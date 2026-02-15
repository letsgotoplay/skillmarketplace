import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * @openapi
 * /teams:
 *   get:
 *     tags: [Teams]
 *     summary: List teams the user belongs to
 *     responses:
 *       200:
 *         description: List of teams
 *       401:
 *         description: Unauthorized
 *   post:
 *     tags: [Teams]
 *     summary: Create a new team
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Team created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get teams where user is a member
    const memberships = await prisma.teamMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            _count: {
              select: {
                members: true,
                skills: true,
              },
            },
          },
        },
      },
      orderBy: {
        team: {
          createdAt: 'desc',
        },
      },
    });

    const teams = memberships.map((m) => ({
      ...m.team,
      role: m.role,
      memberCount: m.team._count.members,
      skillCount: m.team._count.skills,
    }));

    return NextResponse.json({ teams });
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Generate a slug from the name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Check if team with same slug already exists for this user
    const existingMembership = await prisma.teamMember.findFirst({
      where: {
        userId: session.user.id,
        team: {
          slug,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You already have a team with this name' }, { status: 400 });
    }

    // Create team and add creator as owner
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        members: {
          create: {
            userId: session.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Failed to create team:', error);
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
  }
}
