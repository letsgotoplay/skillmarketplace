export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Category } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown } from 'lucide-react';
import { CategoryFilter } from '@/components/marketplace/category-filter';
import { MarketplaceSearch } from '@/components/marketplace/marketplace-search';
import { SLUG_TO_CATEGORY, CATEGORY_LABELS } from '@/lib/categories';

interface MarketplacePageProps {
  searchParams: {
    category?: string;
    search?: string;
  };
}

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

  const [skills, categoryCounts] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        author: { select: { name: true } },
        stats: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
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

      {/* Active Filters Summary */}
      {(category || searchQuery) && (
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {skills.length} skill{skills.length !== 1 ? 's' : ''}
          {category && ` in ${CATEGORY_LABELS[category as Category]}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Skills Grid */}
      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No skills found. Try adjusting your search or filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Card key={skill.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {skill.name}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[skill.category as Category]}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      v{skill.versions[0]?.version || '0.0.0'}
                    </span>
                  </div>
                </CardTitle>
                <CardDescription>{skill.description}</CardDescription>
                {skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skill.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {skill.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{skill.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">
                    by {skill.author.name || 'Anonymous'}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <ArrowDown className="h-4 w-4" />
                    {skill.stats?.downloadsCount || 0}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/marketplace/${skill.slug}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/api/skills/${skill.id}/download`} className="flex-1">
                    <Button className="w-full">Download</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
