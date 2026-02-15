import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SkillList } from '@/components/admin/skills/skill-list';

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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/skills`,
    { cache: 'no-store' }
  );
  return res.json();
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
