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
