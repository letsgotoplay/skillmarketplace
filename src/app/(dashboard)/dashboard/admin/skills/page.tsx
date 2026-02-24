import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SkillList } from '@/components/admin/skills/skill-list';
import { prisma } from '@/lib/db';

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

async function getSkills(): Promise<{ skills: Skill[]; total: number }> {
  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        visibility: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        stats: {
          select: {
            downloadsCount: true,
            viewsCount: true,
          },
        },
        versions: {
          select: {
            id: true,
            version: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.skill.count(),
  ]);

  // Serialize dates to strings for Client Component compatibility
  const serializedSkills = skills.map((skill) => ({
    ...skill,
    createdAt: skill.createdAt.toISOString(),
    updatedAt: skill.updatedAt.toISOString(),
    versions: skill.versions.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    })),
  }));

  return { skills: serializedSkills, total };
}

function SkillListSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminSkillsPage() {
  const { skills, total } = await getSkills();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Skills Management</h1>
          <p className="text-muted-foreground">{total} total skills</p>
        </div>
      </div>

      <Suspense fallback={<SkillListSkeleton />}>
        <SkillList initialSkills={skills} initialTotal={total} />
      </Suspense>
    </div>
  );
}
