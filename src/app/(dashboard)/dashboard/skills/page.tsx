export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { MySkillsContent } from '@/components/skills/my-skills-content';

const PAGE_SIZE = 12;

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where: {
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        stats: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: PAGE_SIZE,
    }),
    prisma.skill.count({
      where: {
        authorId: session.user.id,
      },
    }),
  ]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Skills</h1>
        <Link href="/dashboard/skills/upload">
          <Button>Upload Skill</Button>
        </Link>
      </div>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You haven&apos;t uploaded any skills yet.
            </p>
            <Link href="/dashboard/skills/upload">
              <Button>Upload Your First Skill</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <MySkillsContent
          initialSkills={skills.map(s => ({
            ...s,
            visibility: s.visibility,
          }))}
          initialTotal={total}
        />
      )}
    </div>
  );
}
