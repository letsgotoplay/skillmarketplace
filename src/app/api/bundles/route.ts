import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';
import { initBundleStats } from '@/lib/bundles/analytics';

/**
 * @openapi
 * /bundles:
 *   get:
 *     tags: [Bundles]
 *     summary: List bundles
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Filter by team ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for bundle name
 *     responses:
 *       200:
 *         description: List of bundles
 *   post:
 *     tags: [Bundles]
 *     summary: Create a new bundle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - teamId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *               skillIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               teamId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bundle created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);

  const teamId = searchParams.get('teamId');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};

  // Filter by team
  if (teamId) {
    where.teamId = teamId;
  } else {
    // If no team specified, show public bundles only
    where.visibility = 'PUBLIC';
  }

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  try {
    const bundles = await prisma.skillBundle.findMany({
      where,
      include: {
        team: { select: { id: true, name: true, slug: true } },
        skills: {
          include: {
            skill: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        stats: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ bundles });
  } catch (error) {
    console.error('Failed to fetch bundles:', error);
    return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, visibility, skillIds, teamId } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Bundle name is required' }, { status: 400 });
    }

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
    }

    // Validate team membership
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 403 });
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);

    // Check for duplicate slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.skillBundle.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Validate skill IDs if provided
    if (skillIds && Array.isArray(skillIds) && skillIds.length > 0) {
      const validSkills = await prisma.skill.findMany({
        where: {
          id: { in: skillIds },
          OR: [
            { visibility: Visibility.PUBLIC },
            { authorId: session.user.id },
            { teamId, visibility: Visibility.TEAM_ONLY },
          ],
        },
        select: { id: true },
      });

      if (validSkills.length !== skillIds.length) {
        return NextResponse.json({ error: 'Some skills are not accessible' }, { status: 400 });
      }
    }

    // Create bundle
    const bundle = await prisma.skillBundle.create({
      data: {
        name,
        slug,
        description: description || null,
        visibility: (visibility as Visibility) || Visibility.PUBLIC,
        teamId,
        skills: skillIds && skillIds.length > 0
          ? {
              create: skillIds.map((skillId: string) => ({
                skillId,
              })),
            }
          : undefined,
      },
      include: {
        skills: {
          include: {
            skill: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Initialize bundle stats
    await initBundleStats(bundle.id);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_BUNDLE',
        resource: 'bundle',
        resourceId: bundle.id,
        metadata: { name, skillCount: skillIds?.length || 0, teamId },
      },
    });

    return NextResponse.json(bundle, { status: 201 });
  } catch (error) {
    console.error('Bundle creation error:', error);
    return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
  }
}
