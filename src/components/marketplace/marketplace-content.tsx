'use client';

import { Category, Visibility } from '@prisma/client';
import { InfiniteSkillList } from '@/components/skills/infinite-skill-list';
import { CATEGORY_LABELS } from '@/lib/categories';

interface Skill {
  id: string;
  name: string;
  slug: string;
  fullSlug: string;
  description: string | null;
  category: Category;
  tags: string[];
  visibility: Visibility;
  author: { id: string; name: string | null; email: string };
  stats: { downloadsCount: number; viewsCount: number } | null;
  versions: { version: string }[];
}

interface MarketplaceContentProps {
  initialSkills: Skill[];
  initialTotal: number;
  category?: Category;
  searchQuery?: string;
}

export function MarketplaceContent({
  initialSkills,
  initialTotal,
  category,
  searchQuery,
}: MarketplaceContentProps) {
  return (
    <>
      {/* Active Filters Summary */}
      {(category || searchQuery) && (
        <div className="mb-6 text-sm text-muted-foreground">
          Showing {initialTotal} skill{initialTotal !== 1 ? 's' : ''}
          {category && ` in ${CATEGORY_LABELS[category as Category]}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      )}

      {/* Skills Grid with Infinite Scroll */}
      <InfiniteSkillList
        initialSkills={initialSkills}
        initialTotal={initialTotal}
        category={category}
        search={searchQuery}
        pageSize={12}
      />
    </>
  );
}
