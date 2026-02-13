/**
 * Statistics Aggregation Service
 * Aggregates data from events and other sources for analytics
 */

import { prisma } from '@/lib/db';
import { EventType } from './events';

// Date range type
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Aggregated statistics types
export interface SkillStatistics {
  totalSkills: number;
  totalVersions: number;
  publicSkills: number;
  teamSkills: number;
  privateSkills: number;
  avgDownloadsPerSkill: number;
  avgViewsPerSkill: number;
  topDownloadedSkills: TopSkill[];
  topViewedSkills: TopSkill[];
}

export interface TopSkill {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
}

export interface TeamStatistics {
  totalTeams: number;
  avgMembersPerTeam: number;
  avgSkillsPerTeam: number;
  topTeams: TopTeam[];
}

export interface TopTeam {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  skillCount: number;
}

export interface EvaluationStatistics {
  totalEvals: number;
  successfulEvals: number;
  failedEvals: number;
  successRate: number;
  avgDurationMs: number;
  evalsByStatus: Record<string, number>;
}

export interface SecurityStatistics {
  totalScans: number;
  avgSecurityScore: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  scoreDistribution: ScoreBucket[];
}

export interface ScoreBucket {
  range: string;
  count: number;
}

export interface EventCountByDay {
  date: string;
  count: number;
}

export interface OverviewStatistics {
  skills: SkillStatistics;
  users: UserStatistics;
  teams: TeamStatistics;
  evaluations: EvaluationStatistics;
  security: SecurityStatistics;
}

/**
 * Get skill statistics
 */
export async function getSkillStatistics(): Promise<SkillStatistics> {
  const [
    totalSkills,
    totalVersions,
    visibilityCounts,
    statsAggregation,
    topDownloaded,
    topViewed,
  ] = await Promise.all([
    prisma.skill.count(),
    prisma.skillVersion.count(),
    prisma.skill.groupBy({
      by: ['visibility'],
      _count: true,
    }),
    prisma.skillStat.aggregate({
      _avg: {
        downloadsCount: true,
        viewsCount: true,
      },
    }),
    prisma.skillStat.findMany({
      orderBy: { downloadsCount: 'desc' },
      take: 10,
      include: {
        skill: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.skillStat.findMany({
      orderBy: { viewsCount: 'desc' },
      take: 10,
      include: {
        skill: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
  ]);

  const visibilityMap = visibilityCounts.reduce(
    (acc, item) => {
      acc[item.visibility] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalSkills,
    totalVersions,
    publicSkills: visibilityMap['PUBLIC'] ?? 0,
    teamSkills: visibilityMap['TEAM_ONLY'] ?? 0,
    privateSkills: visibilityMap['PRIVATE'] ?? 0,
    avgDownloadsPerSkill: Math.round(statsAggregation._avg.downloadsCount ?? 0),
    avgViewsPerSkill: Math.round(statsAggregation._avg.viewsCount ?? 0),
    topDownloadedSkills: topDownloaded.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      count: s.downloadsCount,
    })),
    topViewedSkills: topViewed.map((s) => ({
      id: s.skill.id,
      name: s.skill.name,
      slug: s.skill.slug,
      count: s.viewsCount,
    })),
  };
}

/**
 * Get user statistics
 */
export async function getUserStatistics(): Promise<UserStatistics> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, roleCounts, newUsersThisMonth, recentLogins] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({
      by: ['role'],
      _count: true,
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.auditLog.findMany({
      where: {
        action: EventType.USER_LOGIN,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  const usersByRole = roleCounts.reduce(
    (acc, item) => {
      acc[item.role] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalUsers,
    activeUsers: recentLogins.length,
    newUsersThisMonth,
    usersByRole,
  };
}

/**
 * Get team statistics
 */
export async function getTeamStatistics(): Promise<TeamStatistics> {
  const [totalTeams, teamsWithCounts] = await Promise.all([
    prisma.team.count(),
    prisma.team.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            members: true,
            skills: true,
          },
        },
      },
    }),
  ]);

  const avgMembers =
    teamsWithCounts.reduce((sum, t) => sum + t._count.members, 0) / (totalTeams || 1);

  const avgSkills =
    teamsWithCounts.reduce((sum, t) => sum + t._count.skills, 0) / (totalTeams || 1);

  const topTeams = teamsWithCounts
    .sort((a, b) => b._count.members - a._count.members)
    .slice(0, 10)
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      memberCount: t._count.members,
      skillCount: t._count.skills,
    }));

  return {
    totalTeams,
    avgMembersPerTeam: Math.round(avgMembers * 10) / 10,
    avgSkillsPerTeam: Math.round(avgSkills * 10) / 10,
    topTeams,
  };
}

/**
 * Get evaluation statistics
 */
export async function getEvaluationStatistics(): Promise<EvaluationStatistics> {
  const [totalEvals, statusCounts, evalResults] = await Promise.all([
    prisma.evalQueue.count(),
    prisma.evalQueue.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.evalResult.aggregate({
      _count: true,
      _avg: {
        durationMs: true,
      },
      where: {
        evalQueue: {
          status: 'COMPLETED',
        },
      },
    }),
  ]);

  const evalsByStatus = statusCounts.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const successfulEvals = evalsByStatus['COMPLETED'] ?? 0;
  const failedEvals = evalsByStatus['FAILED'] ?? 0;

  return {
    totalEvals,
    successfulEvals,
    failedEvals,
    successRate: totalEvals > 0 ? (successfulEvals / totalEvals) * 100 : 0,
    avgDurationMs: Math.round(evalResults._avg.durationMs ?? 0),
    evalsByStatus,
  };
}

/**
 * Get security statistics
 */
export async function getSecurityStatistics(): Promise<SecurityStatistics> {
  const scans = await prisma.securityScan.findMany({
    where: {
      score: { not: null },
    },
    select: { score: true },
  });

  const totalScans = scans.length;
  const scores = scans.map((s) => s.score as number);

  const avgSecurityScore =
    totalScans > 0 ? scores.reduce((sum, s) => sum + s, 0) / totalScans : 0;

  // Categorize by risk level
  const highRiskCount = scores.filter((s) => s < 40).length;
  const mediumRiskCount = scores.filter((s) => s >= 40 && s < 70).length;
  const lowRiskCount = scores.filter((s) => s >= 70).length;

  // Score distribution buckets
  const buckets: ScoreBucket[] = [
    { range: '0-20', count: scores.filter((s) => s < 20).length },
    { range: '20-40', count: scores.filter((s) => s >= 20 && s < 40).length },
    { range: '40-60', count: scores.filter((s) => s >= 40 && s < 60).length },
    { range: '60-80', count: scores.filter((s) => s >= 60 && s < 80).length },
    { range: '80-100', count: scores.filter((s) => s >= 80).length },
  ];

  return {
    totalScans,
    avgSecurityScore: Math.round(avgSecurityScore * 10) / 10,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    scoreDistribution: buckets,
  };
}

/**
 * Get event counts by day for a date range
 */
export async function getEventCountsByDay(
  eventType: EventType,
  dateRange: DateRange
): Promise<EventCountByDay[]> {
  const events = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count
    FROM audit_logs
    WHERE action = ${eventType}
      AND created_at >= ${dateRange.startDate}
      AND created_at <= ${dateRange.endDate}
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  return events.map((e) => ({
    date: e.date.toISOString().split('T')[0],
    count: Number(e.count),
  }));
}

/**
 * Get complete overview statistics
 */
export async function getOverviewStatistics(): Promise<OverviewStatistics> {
  const [skills, users, teams, evaluations, security] = await Promise.all([
    getSkillStatistics(),
    getUserStatistics(),
    getTeamStatistics(),
    getEvaluationStatistics(),
    getSecurityStatistics(),
  ]);

  return {
    skills,
    users,
    teams,
    evaluations,
    security,
  };
}
