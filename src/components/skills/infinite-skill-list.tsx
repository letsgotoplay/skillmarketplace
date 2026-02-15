'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Loader2 } from 'lucide-react';
import { Category, Visibility } from '@prisma/client';
import { CATEGORY_LABELS } from '@/lib/categories';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: Category;
  tags: string[];
  visibility: Visibility;
  author: { id: string; name: string | null; email: string };
  stats: { downloadsCount: number; viewsCount: number } | null;
  versions: { version: string }[];
}

interface InfiniteSkillListProps {
  initialSkills?: Skill[];
  initialTotal?: number;
  category?: Category;
  search?: string;
  mine?: boolean;
  pageSize?: number;
  showVisibility?: boolean;
  viewPathPrefix?: string;
}

export function InfiniteSkillList({
  initialSkills = [],
  initialTotal = 0,
  category,
  search,
  mine = false,
  pageSize = 12,
  showVisibility = false,
  viewPathPrefix = '/marketplace',
}: InfiniteSkillListProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialSkills.length < initialTotal);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String(skills.length));
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (mine) params.set('mine', 'true');

      const response = await fetch(`/api/skills?${params.toString()}`);
      const data = await response.json();

      setSkills(prev => [...prev, ...data.skills]);
      setTotal(data.total);
      setHasMore(skills.length + data.skills.length < data.total);
    } catch (error) {
      console.error('Failed to load more skills:', error);
    } finally {
      setIsLoading(false);
    }
  }, [skills.length, hasMore, isLoading, category, search, mine, pageSize]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  // Reset when filters change
  useEffect(() => {
    setSkills(initialSkills);
    setTotal(initialTotal);
    setHasMore(initialSkills.length < initialTotal);
  }, [category, search, initialSkills, initialTotal]);

  if (skills.length === 0 && !isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No skills found. Try adjusting your search or filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map(skill => (
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
              <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
              {skill.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {skill.tags.slice(0, 3).map(tag => (
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
              {showVisibility && (
                <div className="mb-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      skill.visibility === 'PUBLIC'
                        ? 'bg-green-100 text-green-700'
                        : skill.visibility === 'TEAM_ONLY'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {skill.visibility.toLowerCase().replace('_', ' ')}
                  </span>
                </div>
              )}
              <div className="flex gap-2">
                <Link href={`${viewPathPrefix}/${skill.id}`} className="flex-1">
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

      {/* Loading indicator / intersection target */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more skills...</span>
          </div>
        )}
        {!hasMore && skills.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Showing all {total} skill{total !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </>
  );
}
