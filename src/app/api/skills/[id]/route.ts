import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser, type AuthUser } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db';

// Helper to get user ID from either session or API token
async function getUserId(request: NextRequest): Promise<{ userId: string | null; authUser: AuthUser | null }> {
  const session = await getServerSession(authOptions);
  const authUser = await getAuthUser(request);
  const userId = session?.user?.id || authUser?.id || null;
  return { userId, authUser };
}

/**
 * @openapi
 * /skills/{id}:
 *   get:
 *     tags: [Skills]
 *     summary: Get skill details
 *     description: Get detailed information about a specific skill including versions, stats, and author info
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Skill ID
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
 *           format: uuid
 *         description: Skill ID
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getUserId(request);

  const skill = await prisma.skill.findUnique({
    where: { id },
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

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Check access
  if (skill.visibility !== 'PUBLIC') {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (skill.authorId !== userId && skill.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: skill.teamId,
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
    where: { skillId: skill.id },
    data: {
      viewsCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return NextResponse.json(skill);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const skill = await prisma.skill.findUnique({
    where: { id },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Check ownership
  if (skill.authorId !== userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  await prisma.skill.delete({
    where: { id },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: userId,
      action: 'DELETE_SKILL',
      resource: 'skill',
      resourceId: id,
      metadata: { name: skill.name },
    },
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
 *           format: uuid
 *         description: Skill ID
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
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await getUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const skill = await prisma.skill.findUnique({
    where: { id },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

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
    where: { id },
    data: {
      visibility,
      teamId: finalTeamId,
    },
    select: {
      id: true,
      name: true,
      visibility: true,
      teamId: true,
      updatedAt: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: userId,
      action: 'SKILL_VISIBILITY_CHANGED',
      resource: 'skill',
      resourceId: id,
      metadata: {
        oldVisibility: skill.visibility,
        newVisibility: visibility || skill.visibility,
      },
    },
  });

  return NextResponse.json(updatedSkill);
}
