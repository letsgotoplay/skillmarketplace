import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser, hasScope } from '@/lib/auth/api-auth';
import { getSkills } from '@/app/actions/skills';
import { processSkillUpload } from '@/lib/skills/upload';
import { createAuditLog, AuditActions } from '@/lib/audit';
import { NextRequest, NextResponse } from 'next/server';
import { Category, Visibility, TokenScope } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * @openapi
 * /skills:
 *   get:
 *     tags: [Skills]
 *     summary: List skills
 *     description: Get a paginated list of skills with optional filtering. Public skills are shown by default. Authenticated users can filter by visibility.
 *     parameters:
 *       - in: query
 *         name: visibility
 *         schema:
 *           type: string
 *           enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *         description: Filter by visibility (requires authentication for non-public)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [DEVELOPMENT, SECURITY, DATA, AIML, TESTING, INTEGRATION]
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, description, or tags
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of skills
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 skills:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Skill'
 *                 total:
 *                   type: integer
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const visibility = searchParams.get('visibility') as 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE' | null;
  const category = searchParams.get('category') as Category | null;
  const search = searchParams.get('search') || undefined;
  const mine = searchParams.get('mine') === 'true';
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

  // For public API, only show public skills
  // Support both session auth and API token auth
  const session = await getServerSession(authOptions);
  const authUser = await getAuthUser(request);

  // Build options
  const options: Parameters<typeof getSkills>[0] = {
    category: category || undefined,
    search,
    limit,
    offset,
  };

  // If "mine" is specified, show user's own skills
  if (mine && (session?.user?.id || authUser?.id)) {
    options.authorId = session?.user?.id || authUser?.id;
  }
  // Otherwise, apply visibility filter
  else {
    options.visibility = visibility && (session || authUser) ? visibility : 'PUBLIC';
  }

  const result = await getSkills(options);

  return NextResponse.json(result);
}

/**
 * @openapi
 * /skills:
 *   post:
 *     tags: [Skills]
 *     summary: Upload a new skill
 *     description: Upload a skill package (ZIP file) to the marketplace. Requires SKILL_WRITE scope for API tokens.
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
 *                 description: Skill ZIP file containing SKILL.md
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *                 default: PUBLIC
 *                 description: Skill visibility
 *               category:
 *                 type: string
 *                 enum: [DEVELOPMENT, SECURITY, DATA, AIML, TESTING, INTEGRATION]
 *                 description: Skill category (auto-detected if not provided)
 *               tags:
 *                 type: string
 *                 description: Comma-separated list of tags (auto-detected if not provided)
 *               teamId:
 *                 type: string
 *                 format: uuid
 *                 description: Team ID to associate the skill with
 *               changelog:
 *                 type: string
 *                 description: Version changelog
 *     responses:
 *       201:
 *         description: Skill uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 skillId:
 *                   type: string
 *                 versionId:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 fullSlug:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - missing required scope
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (supports both session and API token)
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check for SKILL_WRITE scope (required for API tokens)
    if (!hasScope(authUser, TokenScope.SKILL_WRITE)) {
      return NextResponse.json(
        { success: false, error: 'Missing required scope: SKILL_WRITE' },
        { status: 403 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Extract form fields
    const visibility = (formData.get('visibility') as Visibility) || 'PUBLIC';
    const category = formData.get('category') as Category | null;
    const tagsString = formData.get('tags') as string | null;
    const tags = tagsString ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
    const teamId = formData.get('teamId') as string | null;
    const changelog = formData.get('changelog') as string | null;

    // Get user's emailPrefix for slug generation
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

    // Process upload
    const result = await processSkillUpload({
      userId: authUser.id,
      emailPrefix: user.emailPrefix,
      file,
      fileName: file.name,
      visibility,
      category: category || undefined,
      tags,
      teamId,
      changelog,
    });

    if (!result.success) {
      const status = result.validationErrors ? 400 : 500;
      return NextResponse.json(result, { status });
    }

    // Create enhanced audit log
    await createAuditLog({
      userId: authUser.id,
      action: AuditActions.UPLOAD_SKILL,
      resource: 'skill',
      resourceId: result.skillId,
      metadata: {
        version: result.versionId,
        slug: result.slug,
        fullSlug: result.fullSlug,
        specValidationPassed: result.specValidationPassed,
      },
      authUser,
      request,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
