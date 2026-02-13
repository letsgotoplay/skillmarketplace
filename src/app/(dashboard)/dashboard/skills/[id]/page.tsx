export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
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

const visibilityColors: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-700',
  TEAM_ONLY: 'bg-blue-100 text-blue-700',
  PRIVATE: 'bg-gray-100 text-gray-700',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  VALIDATING: 'bg-blue-100 text-blue-700',
  EVALUATING: 'bg-purple-100 text-purple-700',
  SCANNING: 'bg-orange-100 text-orange-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default async function SkillDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const skill = await prisma.skill.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      team: true,
      versions: {
        orderBy: { createdAt: 'desc' },
      },
      stats: true,
    },
  });

  if (!skill) {
    notFound();
  }

  // Check access
  if (skill.authorId !== session.user.id && skill.visibility !== 'PUBLIC') {
    if (skill.visibility === 'PRIVATE') {
      notFound();
    }
    if (skill.visibility === 'TEAM_ONLY' && skill.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: skill.teamId,
          userId: session.user.id,
        },
      });
      if (!membership) {
        notFound();
      }
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{skill.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                visibilityColors[skill.visibility]
              }`}
            >
              {skill.visibility.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">{skill.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/skills">
            <Button variant="outline">Back to Skills</Button>
          </Link>
          <Link href={`/api/skills/${skill.id}/download`}>
            <Button>Download</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Downloads</CardDescription>
            <CardTitle className="text-2xl">
              {skill.stats?.downloadsCount ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Views</CardDescription>
            <CardTitle className="text-2xl">{skill.stats?.viewsCount ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Author</CardDescription>
            <CardTitle className="text-lg">{skill.author.name || skill.author.email}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Version History */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>All versions of this skill</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skill.versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{version.version}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                        statusColors[version.status]
                      }`}
                    >
                      {version.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {version.changelog || 'No changelog'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {skill.team && (
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/dashboard/teams/${skill.team.id}`}
              className="text-primary hover:underline"
            >
              {skill.team.name}
            </Link>
            <p className="text-sm text-muted-foreground">{skill.team.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
