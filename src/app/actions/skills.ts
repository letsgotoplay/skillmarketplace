'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateSkill, parseSkillZip } from '@/lib/skills';
import { SkillStatus, Visibility, Category, ContributionType } from '@prisma/client';
import { validateSpecification } from '@/lib/specification';
import { scanSkill, storeSecurityScan } from '@/lib/security/scanner';
import { analyzeWithAI, analyzeSkillMetadata } from '@/lib/security/ai-analyzer';
import { queueEvaluation } from '@/lib/eval/queue';
import { parseTestConfig } from '@/lib/skills/validation';
import { getStorageProvider } from '@/lib/storage/provider';
import { recordContribution } from '@/lib/teams/contributions';

export interface UploadResult {
  success: boolean;
  skillId?: string;
  versionId?: string;
  error?: string;
  validationErrors?: string[];
  warnings?: string[];
  specValidationPassed?: boolean;
}

export async function uploadSkill(formData: FormData): Promise<UploadResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  const visibility = (formData.get('visibility') as Visibility) || 'PUBLIC';
  const category = (formData.get('category') as Category) || 'DEVELOPMENT';
  const tagsString = formData.get('tags') as string | null;
  const tags = tagsString ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
  const teamId = formData.get('teamId') as string | null;
  const changelog = formData.get('changelog') as string | null;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  if (!file.name.endsWith('.zip')) {
    return { success: false, error: 'Only ZIP files are supported' };
  }

  // Validate team membership if teamId is provided
  if (teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return { success: false, error: 'You are not a member of this team' };
    }
  }

  let skillId: string | null = null;
  let versionId: string | null = null;
  let filePath: string | null = null;

  try {
    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Basic validation (structure, metadata)
    const validation = await validateSkill(buffer);

    if (!validation.valid) {
      return {
        success: false,
        validationErrors: validation.errors,
        warnings: validation.warnings,
      };
    }

    if (!validation.metadata) {
      return { success: false, error: 'Could not parse skill metadata' };
    }

    const { metadata } = validation;
    const slug = generateSlug(metadata.name);
    const version = metadata.version || '1.0.0';

    // Step 2: Run specification validation BEFORE saving
    console.log('[Upload] Running specification validation...');
    const specResult = await validateSpecification(buffer);

    if (!specResult.passed) {
      console.log('[Upload] Specification validation failed:', specResult.errors);
      return {
        success: false,
        error: 'Skill specification validation failed',
        validationErrors: specResult.errors,
        warnings: specResult.warnings,
        specValidationPassed: false,
      };
    }

    console.log('[Upload] Specification validation passed');

    // Step 2.5: AI auto-categorization if category or tags not provided
    let finalCategory = category;
    let finalTags = tags;

    // If user didn't provide category or tags, use AI to analyze and generate them
    if (!formData.get('category') || tags.length === 0) {
      console.log('[Upload] Running AI metadata analysis for auto-categorization...');
      try {
        const parsedSkillForAnalysis = await parseSkillZip(buffer);
        const metadataResult = await analyzeSkillMetadata(
          buffer,
          metadata.name,
          metadata.description,
          parsedSkillForAnalysis
        );

        // Use AI-suggested category if user didn't provide one
        if (!formData.get('category')) {
          finalCategory = metadataResult.category as Category;
          console.log(`[Upload] AI suggested category: ${finalCategory} (confidence: ${metadataResult.confidence}%)`);
        }

        // Use AI-suggested tags if user didn't provide any
        if (tags.length === 0 && metadataResult.tags.length > 0) {
          finalTags = metadataResult.tags;
          console.log(`[Upload] AI suggested tags: ${finalTags.join(', ')}`);
        }
      } catch (error) {
        console.error('[Upload] AI metadata analysis failed, using defaults:', error);
        // Continue with default values
      }
    }

    // Step 3: Check if skill already exists for this user (composite unique: slug + authorId)
    let skill = await prisma.skill.findUnique({
      where: {
        slug_authorId: {
          slug,
          authorId: session.user.id,
        },
      },
    });

    // Create new skill if doesn't exist for this user
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: metadata.name,
          slug,
          description: metadata.description,
          category: finalCategory,
          tags: finalTags,
          authorId: session.user.id,
          teamId: teamId || null,
          visibility,
        },
      });
    }

    skillId = skill.id;

    // Check if version already exists
    const existingVersion = await prisma.skillVersion.findFirst({
      where: {
        skillId: skill.id,
        version,
      },
    });

    if (existingVersion) {
      // Clean up the skill if it was just created and has no other versions
      await cleanupFailedUpload(skill.id, null, null);
      return { success: false, error: `Version ${version} already exists` };
    }

    // Step 4: Save the file using storage provider
    const storageKey = `skills/${skill.id}/${version}.zip`;
    const storage = getStorageProvider();
    await storage.upload(storageKey, buffer, { contentType: 'application/zip' });

    // For backwards compatibility with eval queue, keep local path reference
    filePath = storageKey;

    // Parse skill to get file list
    const parsedSkill = await parseSkillZip(buffer);

    // Step 5: Create skill version with spec validation result
    const skillVersion = await prisma.skillVersion.create({
      data: {
        skillId: skill.id,
        version,
        changelog: changelog || undefined,
        filePath,
        status: SkillStatus.APPROVED,
        createdBy: session.user.id,
        // Store spec validation result
        specValidationPassed: true,
        specValidationErrors: specResult.warnings.length > 0 ? specResult.warnings : undefined,
        processingComplete: false,
      },
    });

    versionId = skillVersion.id;

    // Create skill files records
    await prisma.skillFile.createMany({
      data: parsedSkill.files.map((f) => ({
        skillVersionId: skillVersion.id,
        filePath: f.path,
        fileType: f.type,
        sizeBytes: f.size,
      })),
    });

    // Create skill stats if not exists
    await prisma.skillStat.upsert({
      where: { skillId: skill.id },
      update: {},
      create: {
        skillId: skill.id,
        downloadsCount: 0,
        viewsCount: 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD_SKILL',
        resource: 'skill',
        resourceId: skill.id,
        metadata: { version, name: metadata.name, specValidationPassed: true },
      },
    });

    // Record team contribution and activity if skill belongs to a team
    if (teamId) {
      await recordContribution(
        teamId,
        session.user.id,
        ContributionType.SKILL_UPLOADED,
        skill.id
      );
    }

    // Step 6: Trigger async security analysis (non-blocking)
    triggerSecurityAnalysis(skillVersion.id, buffer, parsedSkill, filePath).catch(console.error);

    revalidatePath('/dashboard/skills');
    revalidatePath('/marketplace');

    return {
      success: true,
      skillId: skill.id,
      versionId: skillVersion.id,
      warnings: [...(validation.warnings || []), ...(specResult.warnings || [])].length > 0
        ? [...(validation.warnings || []), ...(specResult.warnings || [])]
        : undefined,
      specValidationPassed: true,
    };
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up on error
    if (skillId || filePath) {
      await cleanupFailedUpload(skillId, versionId, filePath);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Clean up failed upload - removes files and database records
 */
async function cleanupFailedUpload(
  _skillId: string | null,
  versionId: string | null,
  storageKey: string | null
): Promise<void> {
  try {
    // Delete file from storage if exists
    if (storageKey) {
      try {
        const storage = getStorageProvider();
        await storage.delete(storageKey);
      } catch {
        // Ignore file deletion errors
      }
    }

    // Delete version if exists
    if (versionId) {
      await prisma.skillVersion.delete({ where: { id: versionId } }).catch(() => {});
    }

    // Note: We don't delete the skill itself as it might have other versions
    // If needed, add logic to check and delete skill with no versions
  } catch (error) {
    console.error('[Cleanup] Error during cleanup:', error);
  }
}

export async function getSkills(options?: {
  authorId?: string;
  teamId?: string;
  visibility?: Visibility;
  category?: Category;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (options?.authorId) {
    where.authorId = options.authorId;
  }

  if (options?.teamId) {
    where.teamId = options.teamId;
  }

  if (options?.visibility) {
    where.visibility = options.visibility;
  }

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.search) {
    const searchTerm = options.search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { hasSome: [searchTerm.toLowerCase()] } },
    ];
  }

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true, slug: true } },
        stats: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.skill.count({ where }),
  ]);

  return { skills, total };
}

export async function getSkillById(skillId: string) {
  return prisma.skill.findUnique({
    where: { id: skillId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true, slug: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        include: {
          files: true,
          evals: {
            include: {
              results: true,
            },
          },
          scans: true,
        },
      },
    },
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Security Analysis Pipeline - runs asynchronously after upload
 * Performs security scanning, AI analysis, and evaluation
 * (Spec validation is done synchronously during upload)
 */
async function triggerSecurityAnalysis(
  skillVersionId: string,
  buffer: Buffer,
  parsedSkill: Awaited<ReturnType<typeof parseSkillZip>>,
  filePath: string
): Promise<void> {
  try {
    console.log(`[SecurityAnalysis] Starting for skill version ${skillVersionId}`);

    // Step 1: Pattern-based Security Scan
    console.log('[SecurityAnalysis] Running pattern-based security scan...');
    const securityReport = await scanSkill(buffer);
    await storeSecurityScan(skillVersionId, securityReport);

    // Step 2: AI Security Analysis
    console.log('[SecurityAnalysis] Running AI security analysis...');
    const aiReport = await analyzeWithAI(buffer, parsedSkill);
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        aiSecurityAnalyzed: true,
        aiSecurityReport: JSON.parse(JSON.stringify(aiReport)),
      },
    });

    // Step 3: Queue Evaluation if tests exist
    const testConfig = parseTestConfig(parsedSkill);
    if (testConfig && testConfig.testCases && testConfig.testCases.length > 0) {
      console.log(`[SecurityAnalysis] Queuing evaluation with ${testConfig.testCases.length} test cases...`);
      await queueEvaluation(
        skillVersionId,
        testConfig.testCases.map(tc => ({
          name: tc.name,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          expectedPatterns: tc.expectedPatterns,
          timeout: tc.timeout || 30000,
        })),
        filePath
      );
    }

    // Step 4: Mark processing complete
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        processingComplete: true,
      },
    });

    console.log(`[SecurityAnalysis] Completed for skill version ${skillVersionId}`);
  } catch (error) {
    console.error(`[SecurityAnalysis] Error for skill version ${skillVersionId}:`, error);

    // Mark processing as complete even on error (to avoid infinite retry)
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        processingComplete: true,
        specValidationErrors: [
          'Security analysis error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        ],
      },
    });
  }
}
