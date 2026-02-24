import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser, hasScope, type AuthUser } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db';
import { isUUID } from '@/lib/slug';
import { TokenScope, SkillStatus } from '@prisma/client';
import { validateSkill, parseSkillZip } from '@/lib/skills';
import { validateSpecification } from '@/lib/specification';
import { getStorageProvider } from '@/lib/storage/provider';
import { getTextContent } from '@/lib/config/file-preview';
import { scanSkill, storeSecurityScan, updateSecurityScoreAfterAI } from '@/lib/security/scanner';
import { analyzeWithAI } from '@/lib/security/ai-analyzer';
import { getActiveSecurityConfig } from '@/lib/security/config';
import { queueEvaluation } from '@/lib/eval/queue';
import { parseTestConfig } from '@/lib/skills/validation';
import { createAuditLog, AuditActions } from '@/lib/audit';

// Helper to get user ID from either session or API token
async function getUserId(request: NextRequest): Promise<{ userId: string | null; authUser: AuthUser | null }> {
  const session = await getServerSession(authOptions);
  const authUser = await getAuthUser(request);
  const userId = session?.user?.id || authUser?.id || null;
  return { userId, authUser };
}

// Helper to resolve skill identifier (UUID or fullSlug)
async function resolveSkill(identifier: string) {
  if (isUUID(identifier)) {
    return prisma.skill.findUnique({
      where: { id: identifier },
    });
  }
  return prisma.skill.findUnique({
    where: { fullSlug: identifier },
  });
}

/**
 * @openapi
 * /skills/{id}:
 *   get:
 *     tags: [Skills]
 *     summary: Get skill details
 *     description: Get detailed information about a specific skill including versions, stats, and author info. Supports both UUID and fullSlug (e.g., alice/pdf-reader).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug (e.g., alice/pdf-reader)
 *     responses:
 *       200:
 *         description: Skill details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Skill'
 *       401:
 *         description: Unauthorized - authentication required for private/team skills
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - not a team member
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     tags: [Skills]
 *     summary: Delete a skill
 *     description: Delete a skill (owner only)
 *     security:
 *       - session: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug
 *     responses:
 *       200:
 *         description: Skill deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - not the owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const identifier = slug.join('/');
  const { userId } = await getUserId(request);

  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Get full skill with relations
  const fullSkill = await prisma.skill.findUnique({
    where: { id: skill.id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true, slug: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!fullSkill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Check access
  if (fullSkill.visibility !== 'PUBLIC') {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (fullSkill.authorId !== userId && fullSkill.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: fullSkill.teamId,
          userId: userId,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
  }

  // Update view count
  await prisma.skillStat.update({
    where: { skillId: fullSkill.id },
    data: {
      viewsCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return NextResponse.json(fullSkill);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const identifier = slug.join('/');
  const { userId, authUser } = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Check ownership
  if (skill.authorId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Store fullSlug before deletion
  const deletedFullSlug = skill.fullSlug;
  const deletedName = skill.name;

  await prisma.skill.delete({
    where: { id: skill.id },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: AuditActions.DELETE_SKILL,
    resource: 'skill',
    resourceId: skill.id,
    metadata: { name: deletedName, fullSlug: deletedFullSlug },
    authUser,
    request,
  });

  return NextResponse.json({ success: true });
}

/**
 * @openapi
 * /skills/{id}:
 *   patch:
 *     tags: [Skills]
 *     summary: Update a skill
 *     description: Update skill properties (owner only)
 *     security:
 *       - session: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *                 description: New visibility setting
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Team ID for TEAM_ONLY visibility
 *     responses:
 *       200:
 *         description: Skill updated successfully
 *       400:
 *         description: Invalid request - TEAM_ONLY requires team membership
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied - not the owner
 *       404:
 *         description: Skill not found
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const identifier = slug.join('/');
  const { userId, authUser } = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Store fullSlug before update
  const originalFullSlug = skill.fullSlug;

  // Check ownership
  if (skill.authorId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const body = await request.json();
  const { visibility, teamId } = body;

  if (!visibility) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  // Validate visibility value
  if (!['PUBLIC', 'TEAM_ONLY', 'PRIVATE'].includes(visibility)) {
    return NextResponse.json({ error: 'Invalid visibility value' }, { status: 400 });
  }

  let finalTeamId: string | null = null;

  // If setting to TEAM_ONLY, validate team membership
  if (visibility === 'TEAM_ONLY') {
    // Check if user has any team
    const membership = await prisma.teamMember.findFirst({
      where: { userId: userId },
      select: { teamId: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member of a team to set TEAM_ONLY visibility' },
        { status: 400 }
      );
    }

    // Use the provided teamId or the user's first team
    if (teamId) {
      const teamMembership = await prisma.teamMember.findFirst({
        where: { userId: userId, teamId },
      });
      if (!teamMembership) {
        return NextResponse.json(
          { error: 'You are not a member of this team' },
          { status: 400 }
        );
      }
      finalTeamId = teamId;
    } else {
      finalTeamId = membership.teamId;
    }
  }

  // Update skill with the correct data structure
  const updatedSkill = await prisma.skill.update({
    where: { id: skill.id },
    data: {
      visibility,
      teamId: finalTeamId,
    },
    select: {
      id: true,
      name: true,
      fullSlug: true,
      visibility: true,
      teamId: true,
      updatedAt: true,
    },
  });

  // Create audit log
  await createAuditLog({
    userId,
    action: AuditActions.SKILL_VISIBILITY_CHANGED,
    resource: 'skill',
    resourceId: skill.id,
    metadata: {
      oldVisibility: skill.visibility,
      newVisibility: visibility || skill.visibility,
      fullSlug: originalFullSlug,
    },
    authUser,
    request,
  });

  return NextResponse.json(updatedSkill);
}

/**
 * @openapi
 * /skills/{id}/versions:
 *   post:
 *     tags: [Skills]
 *     summary: Upload a new version
 *     description: Upload a new version of an existing skill. Requires SKILL_WRITE scope. Skill name in ZIP must match existing skill.
 *     security:
 *       - bearer: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Skill ZIP file (name must match existing skill)
 *               changelog:
 *                 type: string
 *                 description: Version changelog
 *     responses:
 *       201:
 *         description: Version uploaded successfully
 *       400:
 *         description: Validation error or name mismatch
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Skill not found
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  // Check if this is a versions request: /api/skills/{id}/versions
  if (slug.length < 2 || slug[slug.length - 1] !== 'versions') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const identifier = slug.slice(0, -1).join('/');
  const { authUser } = await getUserId(request);

  if (!authUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Check for SKILL_WRITE scope
  if (!hasScope(authUser, TokenScope.SKILL_WRITE)) {
    return NextResponse.json(
      { success: false, error: 'Missing required scope: SKILL_WRITE' },
      { status: 403 }
    );
  }

  // Resolve the skill
  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ success: false, error: 'Skill not found' }, { status: 404 });
  }

  // Check ownership
  if (skill.authorId !== authUser.id) {
    return NextResponse.json(
      { success: false, error: 'You can only update your own skills' },
      { status: 403 }
    );
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const changelog = formData.get('changelog') as string | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Validate the skill
    const validation = await validateSkill(buffer);
    if (!validation.valid || !validation.metadata) {
      console.log('[API Upload] Validation failed:', validation.errors);
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validationErrors: validation.errors,
      }, { status: 400 });
    }

    const { metadata } = validation;
    // Version is stored in metadata.metadata.version per spec, fallback to default
    const version = metadata.metadata?.version || '1.0.0';

    // Validate skill name matches
    if (metadata.name !== skill.name) {
      return NextResponse.json({
        success: false,
        error: `Skill name mismatch. Expected "${skill.name}", got "${metadata.name}"`,
        validationErrors: [`The skill name in SKILL.md must match: "${skill.name}"`],
      }, { status: 400 });
    }

    // Run specification validation
    const specResult = await validateSpecification(buffer, validation.parsedSkill);
    if (!specResult.passed) {
      console.log('[API Upload] Specification validation failed:', specResult.errors);
      return NextResponse.json({
        success: false,
        error: 'Specification validation failed',
        validationErrors: specResult.errors,
      }, { status: 400 });
    }

    // Check if version already exists
    const existingVersion = await prisma.skillVersion.findFirst({
      where: { skillId: skill.id, version },
    });

    if (existingVersion) {
      return NextResponse.json({
        success: false,
        error: `Version ${version} already exists`,
      }, { status: 400 });
    }

    // Save the file
    const storageKey = `skills/${skill.id}/${version}.zip`;
    const storage = getStorageProvider();
    await storage.upload(storageKey, buffer, { contentType: 'application/zip' });

    // Use already-parsed skill from validation (avoid re-parsing)
    const parsedSkill = validation.parsedSkill || specResult.parsedSkill;

    if (!parsedSkill) {
      return NextResponse.json({
        success: false,
        error: 'Failed to parse skill files',
      }, { status: 500 });
    }

    // Create skill version
    const skillVersion = await prisma.skillVersion.create({
      data: {
        skillId: skill.id,
        version,
        changelog: changelog || undefined,
        filePath: storageKey,
        status: SkillStatus.APPROVED,
        createdBy: authUser.id,
        specValidationPassed: true,
        specValidationErrors: specResult.warnings.length > 0 ? specResult.warnings : undefined,
        processingComplete: false,
      },
    });

    // Create skill files
    await prisma.skillFile.createMany({
      data: parsedSkill.files.map((f) => ({
        skillVersionId: skillVersion.id,
        filePath: f.path,
        fileType: f.type,
        sizeBytes: f.size,
        content: getTextContent(f.content, f.path, f.size),
      })),
    });

    // Create audit log
    await createAuditLog({
      userId: authUser.id,
      action: AuditActions.UPLOAD_SKILL_VERSION,
      resource: 'skill',
      resourceId: skill.id,
      metadata: { version, name: metadata.name, fullSlug: skill.fullSlug },
      authUser,
      request,
    });

    // Trigger async security analysis
    triggerSecurityAnalysis(skillVersion.id, buffer, parsedSkill, storageKey).catch(console.error);

    return NextResponse.json({
      success: true,
      skillId: skill.id,
      versionId: skillVersion.id,
      version,
      fullSlug: skill.fullSlug,
    }, { status: 201 });
  } catch (error) {
    console.error('Upload version error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }, { status: 500 });
  }
}

async function triggerSecurityAnalysis(
  skillVersionId: string,
  buffer: Buffer,
  parsedSkill: Awaited<ReturnType<typeof parseSkillZip>>,
  filePath: string
): Promise<void> {
  try {
    console.log(`[SecurityAnalysis] Starting for version ${skillVersionId}`);

    const securityReport = await scanSkill(buffer);
    await storeSecurityScan(skillVersionId, securityReport);

    const aiConfig = await getActiveSecurityConfig();
    const aiReport = await analyzeWithAI(buffer, aiConfig);
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        aiSecurityAnalyzed: true,
        aiSecurityReport: JSON.parse(JSON.stringify(aiReport)),
      },
    });

    // Update security score with combined findings
    await updateSecurityScoreAfterAI(skillVersionId);

    const testConfig = parseTestConfig(parsedSkill);
    if (testConfig?.testCases?.length) {
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

    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: { processingComplete: true },
    });

    console.log(`[SecurityAnalysis] Completed for version ${skillVersionId}`);
  } catch (error) {
    console.error(`[SecurityAnalysis] Error:`, error);
    await prisma.skillVersion.update({
      where: { id: skillVersionId },
      data: {
        processingComplete: true,
        specValidationErrors: ['Security analysis error: ' + (error instanceof Error ? error.message : 'Unknown error')],
      },
    });
  }
}
