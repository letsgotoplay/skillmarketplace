export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';
import { CategoryFilter } from '@/components/marketplace/category-filter';
import { MarketplaceSearch } from '@/components/marketplace/marketplace-search';
import { MarketplaceContent } from '@/components/marketplace/marketplace-content';
import { SLUG_TO_CATEGORY } from '@/lib/categories';

interface MarketplacePageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

const PAGE_SIZE = 12;

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const categorySlug = searchParams.category;
  const searchQuery = searchParams.search;

  const category = categorySlug ? SLUG_TO_CATEGORY[categorySlug] : undefined;

  // Build where clause
  const where: Record<string, unknown> = {
    visibility: 'PUBLIC',
  };

  if (category) {
    where.category = category;
  }

  if (searchQuery) {
    const term = searchQuery.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { tags: { hasSome: [term.toLowerCase()] } },
    ];
  }

  const [skills, total, categoryCounts] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true } },
        stats: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
    }),
    prisma.skill.count({ where }),
    // Get counts for each category
    prisma.skill.groupBy({
      by: ['category'],
      where: { visibility: 'PUBLIC' },
      _count: true,
    }),
  ]);

  const countsMap = Object.fromEntries(
    categoryCounts.map(c => [c.category, c._count])
  ) as Record<string, number>;

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Skill Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and download enterprise-grade AI agent skills
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
        <MarketplaceSearch initialQuery={searchQuery || ''} />
        <CategoryFilter selectedCategory={category} counts={countsMap} />
      </div>

      {/* Content with Infinite Scroll */}
      <MarketplaceContent
        initialSkills={skills.map(s => ({
          ...s,
          visibility: s.visibility as Visibility,
        }))}
        initialTotal={total}
        category={category}
        searchQuery={searchQuery}
      />
    </div>
  );
}
