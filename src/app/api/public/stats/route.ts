import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface TrendDataPoint {
  date: string;
  count: number;
}

/**
 * Get upload trend data for the last N days
 */
async function getUploadTrend(days: number): Promise<TrendDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const uploads = await prisma.skillVersion.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  // Group by date
  const byDate: Record<string, number> = {};
  for (const upload of uploads) {
    const date = upload.createdAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + upload._count.id;
  }

  // Fill in missing dates
  const result: TrendDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: byDate[dateStr] || 0,
    });
  }

  return result;
}

/**
 * Get download trend data for the last N days
 */
async function getDownloadTrend(days: number): Promise<TrendDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const downloads = await prisma.downloadRecord.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: { id: true },
  });

  // Group by date
  const byDate: Record<string, number> = {};
  for (const download of downloads) {
    const date = download.createdAt.toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + download._count.id;
  }

  // Fill in missing dates
  const result: TrendDataPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: byDate[dateStr] || 0,
    });
  }

  return result;
}

/**
 * Get security score distribution
 */
async function getSecurityDistribution(): Promise<Array<{ range: string; count: number }>> {
  const scans = await prisma.securityScan.findMany({
    where: { status: 'COMPLETED' },
    select: { score: true },
  });

  const distribution = {
    '0-25': 0,
    '26-50': 0,
    '51-75': 0,
    '76-100': 0,
  };

  for (const scan of scans) {
    if (scan.score === null) continue;
    if (scan.score <= 25) distribution['0-25']++;
    else if (scan.score <= 50) distribution['26-50']++;
    else if (scan.score <= 75) distribution['51-75']++;
    else distribution['76-100']++;
  }

  return Object.entries(distribution).map(([range, count]) => ({ range, count }));
}

/**
 * Get category distribution
 */
async function getCategoryDistribution(): Promise<Array<{ name: string; value: number }>> {
  const skills = await prisma.skill.groupBy({
    by: ['category'],
    where: { visibility: 'PUBLIC' },
    _count: { id: true },
  });

  return skills.map((s) => ({
    name: s.category,
    value: s._count.id,
  }));
}

/**
 * Get top teams by contributions
 */
async function getTopTeams(limit: number = 5) {
  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { skills: true, members: true } },
      skills: {
        include: {
          stats: true,
        },
      },
    },
    take: limit,
  });

  // Calculate total downloads for each team
  return teams.map((team) => {
    const totalDownloads = team.skills.reduce(
      (sum, skill) => sum + (skill.stats?.downloadsCount || 0),
      0
    );

    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      skillCount: team._count.skills,
      memberCount: team._count.members,
      totalDownloads,
    };
  }).sort((a, b) => b.totalDownloads - a.totalDownloads);
}

/**
 * Public statistics endpoint - no authentication required
 */
export async function GET() {
  try {
    const [
      totalSkills,
      publicSkills,
      totalDownloads,
      totalTeams,
      totalUsers,
      securityScans,
      categoryDistribution,
      securityDistribution,
      uploadTrend,
      downloadTrend,
      topTeams,
    ] = await Promise.all([
      prisma.skill.count(),
      prisma.skill.count({ where: { visibility: 'PUBLIC' } }),
      prisma.skillStat.aggregate({ _sum: { downloadsCount: true } }),
      prisma.team.count(),
      prisma.user.count(),
      prisma.securityScan.findMany({
        where: { status: 'COMPLETED' },
        select: { score: true },
      }),
      getCategoryDistribution(),
      getSecurityDistribution(),
      getUploadTrend(30),
      getDownloadTrend(30),
      getTopTeams(5),
    ]);

    // Calculate average security score
    const validScans = securityScans.filter((s) => s.score !== null);
    const avgSecurityScore =
      validScans.length > 0
        ? Math.round(
            validScans.reduce((sum, s) => sum + (s.score || 0), 0) / validScans.length
          )
        : null;

    return NextResponse.json({
      overview: {
        totalSkills,
        publicSkills,
        totalDownloads: totalDownloads._sum.downloadsCount || 0,
        totalTeams,
        totalUsers,
        avgSecurityScore,
      },
      categoryDistribution,
      securityDistribution,
      uploadTrend,
      downloadTrend,
      topTeams,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Public stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
