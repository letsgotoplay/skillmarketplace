import { prisma } from '@/lib/db';
import { ContributionType } from '@prisma/client';

/**
 * Points awarded for each contribution type
 */
const CONTRIBUTION_POINTS: Record<ContributionType, number> = {
  SKILL_UPLOADED: 10,
  SKILL_DOWNLOADED: 1,
  EVAL_RUN: 5,
  SECURITY_SCAN: 3,
  BUNDLE_CREATED: 7,
  MEMBER_ADDED: 5,
};

/**
 * Human-readable descriptions for contribution types
 */
const CONTRIBUTION_DESCRIPTIONS: Record<ContributionType, string> = {
  SKILL_UPLOADED: 'Uploaded a new skill',
  SKILL_DOWNLOADED: 'Skill was downloaded',
  EVAL_RUN: 'Ran evaluation tests',
  SECURITY_SCAN: 'Performed security scan',
  BUNDLE_CREATED: 'Created a skill bundle',
  MEMBER_ADDED: 'Added a new team member',
};

/**
 * Record a contribution for a team member
 */
export async function recordContribution(
  teamId: string,
  userId: string,
  type: ContributionType,
  resourceId?: string
): Promise<void> {
  // Create contribution record
  await prisma.teamContribution.create({
    data: {
      teamId,
      userId,
      contributionType: type,
      resourceId,
      points: CONTRIBUTION_POINTS[type],
    },
  });

  // Create activity record
  await prisma.teamActivity.create({
    data: {
      teamId,
      userId,
      action: type,
      description: CONTRIBUTION_DESCRIPTIONS[type],
      metadata: resourceId ? { resourceId } : undefined,
    },
  });
}

/**
 * Get contribution statistics for a team member
 */
export async function getTeamMemberStats(teamId: string, userId: string) {
  const contributions = await prisma.teamContribution.findMany({
    where: { teamId, userId },
    select: {
      contributionType: true,
      points: true,
    },
  });

  // Aggregate by type
  const byType: Record<string, { count: number; points: number }> = {};

  for (const c of contributions) {
    const type = c.contributionType;
    if (!byType[type]) {
      byType[type] = { count: 0, points: 0 };
    }
    byType[type].count++;
    byType[type].points += c.points;
  }

  const totalPoints = contributions.reduce((sum, c) => sum + c.points, 0);

  return {
    totalContributions: contributions.length,
    totalPoints,
    byType,
    breakdown: {
      skillsUploaded: byType['SKILL_UPLOADED']?.count || 0,
      downloads: byType['SKILL_DOWNLOADED']?.count || 0,
      evalsRun: byType['EVAL_RUN']?.count || 0,
      securityScans: byType['SECURITY_SCAN']?.count || 0,
      bundlesCreated: byType['BUNDLE_CREATED']?.count || 0,
      membersAdded: byType['MEMBER_ADDED']?.count || 0,
    },
  };
}

/**
 * Get team leaderboard (top contributors)
 */
export async function getTeamLeaderboard(teamId: string, limit: number = 10) {
  const contributions = await prisma.teamContribution.groupBy({
    by: ['userId'],
    where: { teamId },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  });

  // Get user details for each
  const userIds = contributions.map((c) => c.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return contributions.map((c, index) => ({
    rank: index + 1,
    userId: c.userId,
    user: userMap.get(c.userId),
    totalPoints: c._sum.points || 0,
    contributionCount: c._count.id,
  }));
}

/**
 * Get recent team activity
 */
export async function getTeamActivity(teamId: string, limit: number = 20, offset: number = 0) {
  const activities = await prisma.teamActivity.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      team: {
        select: { name: true },
      },
    },
  });

  // Get user details
  const userIds = Array.from(new Set(activities.filter((a) => a.userId).map((a) => a.userId!)));
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return activities.map((a) => ({
    id: a.id,
    action: a.action,
    description: a.description,
    metadata: a.metadata,
    createdAt: a.createdAt,
    user: a.userId ? userMap.get(a.userId) : null,
  }));
}

/**
 * Get team statistics summary
 */
export async function getTeamStatsSummary(teamId: string) {
  const [totalContributions, totalPoints, activityCount] = await Promise.all([
    prisma.teamContribution.count({ where: { teamId } }),
    prisma.teamContribution.aggregate({
      where: { teamId },
      _sum: { points: true },
    }),
    prisma.teamActivity.count({ where: { teamId } }),
  ]);

  // Get contribution breakdown
  const byType = await prisma.teamContribution.groupBy({
    by: ['contributionType'],
    where: { teamId },
    _count: { id: true },
  });

  const breakdown: Record<string, number> = {};
  for (const item of byType) {
    breakdown[item.contributionType] = item._count.id;
  }

  return {
    totalContributions,
    totalPoints: totalPoints._sum.points || 0,
    activityCount,
    breakdown,
  };
}
