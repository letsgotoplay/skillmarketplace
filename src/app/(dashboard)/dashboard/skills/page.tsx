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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function SkillsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const skills = await prisma.skill.findMany({
    where: {
      authorId: session.user.id,
    },
    include: {
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link key={skill.id} href={`/dashboard/skills/${skill.id}`}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{skill.name}</CardTitle>
                  <CardDescription>{skill.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>v{skill.versions[0]?.version || '0.0.0'}</span>
                    <span>{skill.stats?.downloadsCount || 0} downloads</span>
                  </div>
                  <div className="mt-2">
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
