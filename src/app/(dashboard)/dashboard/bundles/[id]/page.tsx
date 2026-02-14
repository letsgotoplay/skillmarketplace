export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowDown, Pencil } from 'lucide-react';
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

export default async function BundleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const bundle = await prisma.skillBundle.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      skills: {
        include: {
          skill: {
            include: {
              author: true,
              stats: true,
              versions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!bundle) {
    notFound();
  }

  // Check access for TEAM_ONLY bundles
  let canEdit = false;
  if (bundle.teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: {
        teamId: bundle.teamId,
        userId: session.user.id,
      },
    });
    if (!membership && bundle.visibility === 'TEAM_ONLY') {
      notFound();
    }
    canEdit = membership?.role === 'ADMIN' || membership?.role === 'OWNER';
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{bundle.name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                visibilityColors[bundle.visibility]
              }`}
            >
              {bundle.visibility.toLowerCase().replace('_', ' ')}
            </span>
          </div>
          <p className="text-muted-foreground">
            {bundle.description || 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bundles">
            <Button variant="outline">Back to Bundles</Button>
          </Link>
          {canEdit && (
            <Link href={`/dashboard/bundles/${bundle.id}/edit`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <Link href={`/api/bundles/${bundle.id}/download`}>
            <Button>
              <ArrowDown className="h-4 w-4 mr-2" />
              Download Bundle
            </Button>
          </Link>
        </div>
      </div>

      {/* Bundle Info */}
      {bundle.team && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/dashboard/teams/${bundle.team.id}`}
              className="text-primary hover:underline"
            >
              {bundle.team.name}
            </Link>
            <p className="text-sm text-muted-foreground">{bundle.team.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Skills in Bundle */}
      <Card>
        <CardHeader>
          <CardTitle>Skills ({bundle.skills.length})</CardTitle>
          <CardDescription>Skills included in this bundle</CardDescription>
        </CardHeader>
        <CardContent>
          {bundle.skills.length === 0 ? (
            <p className="text-muted-foreground">No skills in this bundle yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bundle.skills.map(({ skill }) => (
                <Link key={skill.id} href={`/dashboard/skills/${skill.id}`}>
                  <Card className="h-full hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {skill.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>v{skill.versions[0]?.version || '0.0.0'}</span>
                        <span>{skill.stats?.downloadsCount || 0} downloads</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        by {skill.author.name || skill.author.email}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
