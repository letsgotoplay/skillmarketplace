'use client';

import { Category, Visibility } from '@prisma/client';
import { InfiniteSkillList } from '@/components/skills/infinite-skill-list';

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

interface MySkillsContentProps {
  initialSkills: Skill[];
  initialTotal: number;
}

export function MySkillsContent({ initialSkills, initialTotal }: MySkillsContentProps) {
  return (
    <InfiniteSkillList
      initialSkills={initialSkills}
      initialTotal={initialTotal}
      mine={true}
      pageSize={12}
      showVisibility={true}
      viewPathPrefix="/dashboard/skills"
    />
  );
}
