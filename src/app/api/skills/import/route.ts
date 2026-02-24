import { getAuthUser, hasScope } from '@/lib/auth/api-auth';
import { processSkillUpload } from '@/lib/skills/upload';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { Visibility, TokenScope } from '@prisma/client';
import { prisma } from '@/lib/db';
import { GITHUB_IMPORT_ENABLED } from '@/lib/config/features';
import {
  GitHubError,
  scanRepoForSkills,
  extractSkillFromRepo,
  parseGitHubUrl,
  buildGitHubUrl,
} from '@/lib/import';

// Error messages for user-friendly responses
const ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  INVALID_URL: { message: 'Invalid GitHub URL format. Use owner/repo or https://github.com/owner/repo', status: 400 },
  NOT_FOUND: { message: 'Repository not found', status: 404 },
  PRIVATE: { message: 'Only public repositories can be imported', status: 403 },
  UNREACHABLE: { message: 'Unable to connect to GitHub. Please check your network connection or try again later.', status: 503 },
  TIMEOUT: { message: 'GitHub API request timed out. Please try again later.', status: 504 },
  DOWNLOAD_FAILED: { message: 'Failed to download repository. Please try again later.', status: 502 },
  NO_SKILL: { message: 'No skill found in this repository (missing SKILL.md)', status: 400 },
};

/**
 * @openapi
 * /skills/import:
 *   get:
 *     tags: [Skills]
 *     summary: Preview import from GitHub URL
 *     description: Scan a GitHub repository and list all skills that can be imported
 *     parameters:
 *       - in: query
 *         name: url
 *         schema:
 *           type: string
 *         required: true
 *         description: GitHub URL (owner/repo or https://github.com/owner/repo)
 *     responses:
 *       200:
 *         description: Repository scanned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 repo:
 *                   type: object
 *                   properties:
 *                     owner:
 *                       type: string
 *                     name:
 *                       type: string
 *                     url:
 *                       type: string
 *                 skills:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       400:
 *         description: Invalid URL format
 *       404:
 *         description: Repository not found
 *       503:
 *         description: Unable to connect to GitHub
 */
export async function GET(request: NextRequest) {
  try {
    // Check feature flag
    if (!GITHUB_IMPORT_ENABLED) {
      return NextResponse.json(
        { success: false, error: 'GitHub import feature is disabled' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Parse URL to validate format
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_URL.message },
        { status: ERROR_MESSAGES.INVALID_URL.status }
      );
    }

    // Scan repository for skills
    const result = await scanRepoForSkills(url);

    return NextResponse.json({
      success: true,
      repo: {
        owner: result.repoInfo.owner,
        name: result.repoInfo.repo,
        url: result.repoInfo.url,
      },
      skills: result.skills.map(skill => ({
        path: skill.path,
        name: skill.name,
        description: skill.description,
        metadata: skill.metadata,
      })),
    });
  } catch (error) {
    console.error('Import preview error:', error);

    if (error instanceof GitHubError) {
      const errorInfo = ERROR_MESSAGES[error.code];
      return NextResponse.json(
        { success: false, error: errorInfo.message },
        { status: errorInfo.status }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @openapi
 * /skills/import:
 *   post:
 *     tags: [Skills]
 *     summary: Import skill from GitHub URL
 *     description: Import a skill from a GitHub repository. Only public repositories are supported.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - url
 *             properties:
 *               url:
 *                 type: string
 *                 description: GitHub URL (owner/repo or https://github.com/owner/repo)
 *                 examples:
 *                   - owner/repo
 *                   - https://github.com/owner/repo
 *               skillPath:
 *                 type: string
 *                 description: Path to skill subdirectory (for monorepos). Leave empty for root-level skill.
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *                 default: PUBLIC
 *               category:
 *                 type: string
 *                 enum: [DEVELOPMENT, SECURITY, DATA, AIML, TESTING, INTEGRATION]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of tags
 *               teamId:
 *                 type: string
 *                 format: uuid
 *               changelog:
 *                 type: string
 *     responses:
 *       201:
 *         description: Skill imported successfully
 *       400:
 *         description: Invalid URL or no skill found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - repository is not public
 *       503:
 *         description: Unable to connect to GitHub
 */
export async function POST(request: NextRequest) {
  try {
    // Check feature flag
    if (!GITHUB_IMPORT_ENABLED) {
      return NextResponse.json(
        { success: false, error: 'GitHub import feature is disabled' },
        { status: 403 }
      );
    }

    // Authenticate user
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for SKILL_WRITE scope
    if (!hasScope(authUser, TokenScope.SKILL_WRITE)) {
      return NextResponse.json(
        { success: false, error: 'Missing required scope: SKILL_WRITE' },
        { status: 403 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { url, skillPath = '' } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.INVALID_URL.message },
        { status: ERROR_MESSAGES.INVALID_URL.status }
      );
    }

    // Get user's emailPrefix
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { emailPrefix: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }

    // Extract skill from repository
    console.log(`[Import] Extracting skill from: ${url}, path: ${skillPath || '(root)'}`);
    const { buffer, fileName } = await extractSkillFromRepo(url, skillPath);

    // Process the upload using existing logic
    // Note: GitHub imports are always PUBLIC, no category/tags specified (auto-detected)
    const result = await processSkillUpload({
      userId: authUser.id,
      emailPrefix: user.emailPrefix,
      file: buffer,
      fileName,
      visibility: 'PUBLIC' as Visibility,
    });

    if (!result.success) {
      const status = result.validationErrors ? 400 : 500;
      return NextResponse.json(result, { status });
    }

    // Create audit log
    await createAuditLog({
      userId: authUser.id,
      action: AuditActions.UPLOAD_SKILL,
      resource: 'skill',
      resourceId: result.skillId!,
      metadata: {
        version: result.versionId,
        slug: result.slug,
        fullSlug: result.fullSlug,
        sourceUrl: buildGitHubUrl(parsed),
        skillPath: skillPath || '(root)',
        importType: 'github',
        specValidationPassed: result.specValidationPassed,
      },
      authUser,
      request,
    });

    return NextResponse.json({
      ...result,
      sourceUrl: buildGitHubUrl(parsed),
    }, { status: 201 });
  } catch (error) {
    console.error('Import API error:', error);

    if (error instanceof GitHubError) {
      const errorInfo = ERROR_MESSAGES[error.code];
      return NextResponse.json(
        { success: false, error: errorInfo.message },
        { status: errorInfo.status }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
