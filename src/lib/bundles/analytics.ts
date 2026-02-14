import { prisma } from '@/lib/db';

/**
 * Bundle analytics data
 */
export interface BundleAnalytics {
  bundleId: string;
  bundleName: string;
  downloads: number;
  views: number;
  totalSkills: number;
  totalSkillDownloads: number;
  avgSkillDownloads: number;
  lastDownloadedAt: Date | null;
  lastViewedAt: Date | null;
}

/**
 * Get analytics for a bundle
 */
export async function getBundleAnalytics(bundleId: string): Promise<BundleAnalytics | null> {
  const bundle = await prisma.skillBundle.findUnique({
    where: { id: bundleId },
    include: {
      stats: true,
      skills: {
        include: {
          skill: {
            include: { stats: true },
          },
        },
      },
    },
  });

  if (!bundle) {
    return null;
  }

  const totalSkillDownloads = bundle.skills.reduce(
    (sum, s) => sum + (s.skill.stats?.downloadsCount || 0),
    0
  );

  return {
    bundleId: bundle.id,
    bundleName: bundle.name,
    downloads: bundle.stats?.downloadsCount || 0,
    views: bundle.stats?.viewsCount || 0,
    totalSkills: bundle.skills.length,
    totalSkillDownloads,
    avgSkillDownloads: bundle.skills.length > 0 ? totalSkillDownloads / bundle.skills.length : 0,
    lastDownloadedAt: bundle.stats?.lastDownloadedAt || null,
    lastViewedAt: bundle.stats?.lastViewedAt || null,
  };
}

/**
 * Initialize bundle stats if not exists
 */
export async function initBundleStats(bundleId: string): Promise<void> {
  const existing = await prisma.bundleStat.findUnique({
    where: { bundleId },
  });

  if (!existing) {
    await prisma.bundleStat.create({
      data: { bundleId },
    });
  }
}

/**
 * Increment bundle view count
 */
export async function incrementBundleViews(bundleId: string): Promise<void> {
  await initBundleStats(bundleId);

  await prisma.bundleStat.update({
    where: { bundleId },
    data: {
      viewsCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });
}

/**
 * Increment bundle download count
 */
export async function incrementBundleDownloads(bundleId: string): Promise<void> {
  await initBundleStats(bundleId);

  await prisma.bundleStat.update({
    where: { bundleId },
    data: {
      downloadsCount: { increment: 1 },
      lastDownloadedAt: new Date(),
    },
  });
}

/**
 * Get top bundles by downloads
 */
export async function getTopBundles(limit: number = 10) {
  const bundles = await prisma.skillBundle.findMany({
    where: { visibility: 'PUBLIC' },
    include: {
      stats: true,
      skills: { select: { skillId: true } },
      team: { select: { name: true, slug: true } },
    },
    orderBy: {
      stats: { downloadsCount: 'desc' },
    },
    take: limit,
  });

  return bundles.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    downloads: b.stats?.downloadsCount || 0,
    views: b.stats?.viewsCount || 0,
    skillCount: b.skills.length,
    team: b.team,
  }));
}
