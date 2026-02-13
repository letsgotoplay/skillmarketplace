'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Category } from '@prisma/client';
import { CATEGORY_LABELS, CATEGORY_SLUGS, ALL_CATEGORIES } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  selectedCategory?: Category | null;
  counts?: Record<string, number>;
}

export function CategoryFilter({ selectedCategory, counts }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleCategoryClick = (category: Category | null) => {
    const params = new URLSearchParams(window.location.search);

    if (category) {
      params.set('category', CATEGORY_SLUGS[category]);
    } else {
      params.delete('category');
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={!selectedCategory ? 'default' : 'outline'}
        size="sm"
        onClick={() => handleCategoryClick(null)}
      >
        All
      </Button>
      {ALL_CATEGORIES.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleCategoryClick(category)}
          className="gap-2"
        >
          {CATEGORY_LABELS[category]}
          {counts?.[category] !== undefined && counts[category] > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {counts[category]}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
