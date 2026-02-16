import { prisma } from '@/lib/db';
import { validateSkill, parseSkillZip } from '@/lib/skills';
import { SkillStatus, Visibility, Category, ContributionType, TokenScope } from '@prisma/client';
import { validateSpecification } from '@/lib/specification';
import { scanSkill, storeSecurityScan } from '@/lib/security/scanner';
import { analyzeWithAI, analyzeSkillMetadata } from '@/lib/security/ai-analyzer';
import { queueEvaluation, isEvalEnabled } from '@/lib/eval/queue';
import { parseTestConfig } from '@/lib/skills/validation';
import { getStorageProvider } from '@/lib/storage/provider';
import { recordContribution } from '@/lib/teams/contributions';
import { getTextContent } from '@/lib/config/file-preview';
import { generateSkillSlug, generateFullSlug } from '@/lib/slug';

export interface UploadResult {
  success: boolean;
  skillId?: string;
  versionId?: string;
  slug?: string;
  fullSlug?: string;
  error?: string;
  validationErrors?: string[];
  warnings?: string[];
  specValidationPassed?: boolean;
}

export interface UploadOptions {
  userId: string;
  emailPrefix: string;
  file: File | Buffer;
  fileName: string;
  visibility?: Visibility;
  category?: Category;
  tags?: string[];
  teamId?: string | null;
  changelog?: string | null;
}

/**
 * Core upload logic - can be used by both server actions and API routes
 */
export async function processSkillUpload(options: UploadOptions): Promise<UploadResult> {
  const {
    userId,
    emailPrefix,
    file,
    fileName,
    visibility = 'PUBLIC',
    category = 'DEVELOPMENT',
    tags = [],
    teamId = null,
    changelog = null,
  } = options;

  if (!fileName.endsWith('.zip')) {
    return { success: false, error: 'Only ZIP files are supported' };
  }

  // Validate team membership if teamId is provided
  if (teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId,
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
    const buffer = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;

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
    const slug = generateSkillSlug(metadata.name);
    const version = metadata.version || '1.0.0';
    const fullSlug = generateFullSlug(emailPrefix, slug);

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
    if (!category || tags.length === 0) {
      console.log('[Upload] Running AI metadata analysis for auto-categorization...');
      try {
        const metadataResult = await analyzeSkillMetadata(
          buffer,
          metadata.name,
          metadata.description
        );

        // Use AI-suggested category if user didn't provide one
        if (!category) {
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

    // Step 3: Check if skill already exists for this user (by fullSlug)
    let skill = await prisma.skill.findUnique({
      where: {
        fullSlug,
      },
    });

    // Also check by composite key for backward compatibility
    if (!skill) {
      skill = await prisma.skill.findUnique({
        where: {
          slug_authorId: {
            slug,
            authorId: userId,
          },
        },
      });
    }

    // Create new skill if doesn't exist for this user
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: metadata.name,
          slug,
          fullSlug,
          description: metadata.description,
          category: finalCategory,
          tags: finalTags,
          authorId: userId,
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
        createdBy: userId,
        // Store spec validation result
        specValidationPassed: true,
        specValidationErrors: specResult.warnings.length > 0 ? specResult.warnings : undefined,
        processingComplete: false,
      },
    });

    versionId = skillVersion.id;

    // Create skill files records with content for text files
    await prisma.skillFile.createMany({
      data: parsedSkill.files.map((f) => ({
        skillVersionId: skillVersion.id,
        filePath: f.path,
        fileType: f.type,
        sizeBytes: f.size,
        content: getTextContent(f.content, f.path, f.size),
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
        userId,
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
        userId,
        ContributionType.SKILL_UPLOADED,
        skill.id
      );
    }

    // Step 6: Trigger async security analysis (non-blocking)
    triggerSecurityAnalysis(skillVersion.id, buffer, parsedSkill, filePath).catch(console.error);

    return {
      success: true,
      skillId: skill.id,
      versionId: skillVersion.id,
      slug,
      fullSlug,
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
    const aiReport = await analyzeWithAI(buffer);
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        aiSecurityAnalyzed: true,
        aiSecurityReport: JSON.parse(JSON.stringify(aiReport)),
      },
    });

    // Step 3: Queue Evaluation if tests exist and eval is enabled
    const testConfig = parseTestConfig(parsedSkill);
    if (testConfig && testConfig.testCases && testConfig.testCases.length > 0) {
      if (isEvalEnabled()) {
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
      } else {
        console.log('[SecurityAnalysis] Eval disabled (no Redis) - skipping test evaluation');
      }
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
