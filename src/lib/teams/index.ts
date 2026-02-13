'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TeamRole } from '@prisma/client';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export interface TeamResult {
  success: boolean;
  team?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  error?: string;
}

export async function createTeam(data: {
  name: string;
  description?: string;
}): Promise<TeamResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const validated = createTeamSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid input' };
  }

  const slug = generateSlug(validated.data.name);

  // Check if slug already exists
  const existing = await prisma.team.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: 'Team name already taken' };
  }

  try {
    const team = await prisma.team.create({
      data: {
        name: validated.data.name,
        slug,
        description: validated.data.description,
      },
    });

    // Add creator as owner
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: session.user.id,
        role: TeamRole.OWNER,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_TEAM',
        resource: 'team',
        resourceId: team.id,
        metadata: { name: team.name },
      },
    });

    revalidatePath('/dashboard/teams');
    return {
      success: true,
      team: { id: team.id, name: team.name, slug: team.slug, description: team.description },
    };
  } catch (error) {
    console.error('Create team error:', error);
    return { success: false, error: 'Failed to create team' };
  }
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; description?: string }
): Promise<TeamResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check permission
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });

  if (!membership) {
    return { success: false, error: 'Access denied' };
  }

  const validated = updateTeamSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid input' };
  }

  try {
    const team = await prisma.team.update({
      where: { id: teamId },
      data: validated.data,
    });

    revalidatePath('/dashboard/teams');
    return {
      success: true,
      team: { id: team.id, name: team.name, slug: team.slug, description: team.description },
    };
  } catch (error) {
    console.error('Update team error:', error);
    return { success: false, error: 'Failed to update team' };
  }
}

export async function deleteTeam(teamId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check permission - only owner can delete
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: TeamRole.OWNER },
  });

  if (!membership) {
    return { success: false, error: 'Only team owner can delete' };
  }

  try {
    await prisma.team.delete({ where: { id: teamId } });

    revalidatePath('/dashboard/teams');
    return { success: true };
  } catch (error) {
    console.error('Delete team error:', error);
    return { success: false, error: 'Failed to delete team' };
  }
}

export async function addTeamMember(
  teamId: string,
  email: string,
  role: TeamRole = TeamRole.MEMBER
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check permission
  const adminMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });

  if (!adminMembership) {
    return { success: false, error: 'Access denied' };
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Check if already a member
  const existing = await prisma.teamMember.findFirst({
    where: { teamId, userId: user.id },
  });

  if (existing) {
    return { success: false, error: 'User is already a team member' };
  }

  try {
    await prisma.teamMember.create({
      data: { teamId, userId: user.id, role },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'ADD_TEAM_MEMBER',
        resource: 'team',
        resourceId: teamId,
        metadata: { addedUserId: user.id, role },
      },
    });

    revalidatePath(`/dashboard/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error('Add team member error:', error);
    return { success: false, error: 'Failed to add team member' };
  }
}

export async function removeTeamMember(
  teamId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check permission
  const adminMembership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id, role: { in: [TeamRole.OWNER, TeamRole.ADMIN] } },
  });

  if (!adminMembership && session.user.id !== userId) {
    return { success: false, error: 'Access denied' };
  }

  try {
    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId } },
    });

    revalidatePath(`/dashboard/teams/${teamId}`);
    return { success: true };
  } catch (error) {
    console.error('Remove team member error:', error);
    return { success: false, error: 'Failed to remove team member' };
  }
}

export async function getUserTeams() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const memberships = await prisma.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true, skills: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    ...m.team,
    role: m.role,
    memberCount: m.team._count.members,
    skillCount: m.team._count.skills,
  }));
}

export async function getTeamById(teamId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId: session.user.id },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          skills: {
            include: {
              stats: true,
              versions: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      },
    },
  });

  if (!membership) return null;

  return {
    ...membership.team,
    userRole: membership.role,
  };
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
