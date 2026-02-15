'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/admin/data-table';
import { SkillFilters } from './skill-filters';
import { SkillActionsMenu } from './skill-actions-menu';
import { SkillDetailDialog } from './skill-detail-dialog';
import { StatusBadge, VisibilityBadge, CategoryBadge } from './skill-status-badge';
import { Badge } from '@/components/ui/badge';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  visibility: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  team: {
    id: string;
    name: string;
  } | null;
  stats: {
    downloadsCount: number;
    viewsCount: number;
  } | null;
  versions: Array<{
    id: string;
    version: string;
    status: string;
    createdAt: string;
  }>;
  _count: {
    versions: number;
  };
}

interface SkillListProps {
  initialSkills: Skill[];
  initialTotal: number;
}

export function SkillList({ initialSkills, initialTotal }: SkillListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? 'ALL';
  const visibility = searchParams.get('visibility') ?? 'ALL';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'ALL') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      if (!('page' in updates)) {
        params.delete('page');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchSkills = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category !== 'ALL') params.set('category', category);
    if (visibility !== 'ALL') params.set('visibility', visibility);
    params.set('limit', pageSize.toString());
    params.set('offset', ((page - 1) * pageSize).toString());

    const res = await fetch(`/api/admin/skills?${params.toString()}`);
    const data = await res.json();
    setSkills(data.skills || []);
    setTotal(data.total || 0);
    setIsLoading(false);
  }, [search, category, visibility, page, pageSize]);

  const handleDelete = async (skillId: string) => {
    const res = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setSkills((prev) => prev.filter((s) => s.id !== skillId));
      setTotal((prev) => prev - 1);
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete skill');
    }
  };

  const handleChangeVisibility = async (skillId: string, newVisibility: string) => {
    const res = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: newVisibility }),
    });

    if (res.ok) {
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, visibility: newVisibility } : s))
      );
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Failed to change visibility');
    }
  };

  const handleTransferAuthor = async (skillId: string, newAuthorId: string) => {
    const res = await fetch(`/api/admin/skills/${skillId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId: newAuthorId }),
    });

    if (res.ok) {
      fetchSkills();
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Failed to transfer skill');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (skill: Skill) => (
        <div>
          <p className="font-medium">{skill.name}</p>
          {skill.description && (
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {skill.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'author',
      header: 'Author',
      render: (skill: Skill) => skill.author.name || skill.author.email,
    },
    {
      key: 'category',
      header: 'Category',
      render: (skill: Skill) => (
        <CategoryBadge category={skill.category as 'DEVELOPMENT' | 'SECURITY' | 'DATA_ANALYTICS' | 'AI_ML' | 'TESTING' | 'INTEGRATION'} />
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (skill: Skill) => (
        <VisibilityBadge visibility={skill.visibility as 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (skill: Skill) =>
        skill.versions[0] ? (
          <StatusBadge status={skill.versions[0].status as 'PENDING' | 'VALIDATING' | 'EVALUATING' | 'SCANNING' | 'APPROVED' | 'REJECTED'} />
        ) : (
          <Badge variant="outline">No versions</Badge>
        ),
    },
    {
      key: 'versions',
      header: 'Versions',
      render: (skill: Skill) => skill._count.versions,
    },
    {
      key: 'downloads',
      header: 'Downloads',
      render: (skill: Skill) => skill.stats?.downloadsCount ?? 0,
    },
    {
      key: 'created',
      header: 'Created',
      render: (skill: Skill) => new Date(skill.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (skill: Skill) => (
        <SkillActionsMenu
          skill={skill}
          onView={(id) => {
            setSelectedSkillId(id);
            setDetailOpen(true);
          }}
          onDelete={handleDelete}
          onChangeVisibility={handleChangeVisibility}
          onTransferAuthor={handleTransferAuthor}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Skills</CardTitle>
        <CardDescription>Manage and moderate skills in the marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6">
          <SkillFilters
            search={search}
            onSearchChange={(value) => updateParams({ search: value || null })}
            category={category}
            onCategoryChange={(value) => updateParams({ category: value })}
            visibility={visibility}
            onVisibilityChange={(value) => updateParams({ visibility: value })}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={skills}
          keyExtractor={(skill) => skill.id}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: (newPage) => updateParams({ page: newPage }),
            onPageSizeChange: (newSize) => updateParams({ pageSize: newSize, page: 1 }),
          }}
          isLoading={isLoading}
          emptyMessage="No skills found"
        />
      </CardContent>

      {/* Skill Detail Dialog */}
      <SkillDetailDialog
        skillId={selectedSkillId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}
