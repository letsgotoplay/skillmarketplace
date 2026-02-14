import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSkills } from '@/app/actions/skills';
import { NextResponse } from 'next/server';
import { Category } from '@prisma/client';

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
  const session = await getServerSession(authOptions);

  // Build options
  const options: Parameters<typeof getSkills>[0] = {
    category: category || undefined,
    search,
    limit,
    offset,
  };

  // If "mine" is specified, show user's own skills
  if (mine && session?.user?.id) {
    options.authorId = session.user.id;
  }
  // Otherwise, apply visibility filter
  else {
    options.visibility = visibility && session ? visibility : 'PUBLIC';
  }

  const result = await getSkills(options);

  return NextResponse.json(result);
}
