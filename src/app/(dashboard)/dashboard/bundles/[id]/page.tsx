export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowDown, Pencil, Eye, EyeOff, Users } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const visibilityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PUBLIC: { color: 'bg-green-100 text-green-700 border-green-200', icon: <Eye className="h-3 w-3" /> },
  TEAM_ONLY: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Users className="h-3 w-3" /> },
  PRIVATE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <EyeOff className="h-3 w-3" /> },
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
      stats: true,
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
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/dashboard/bundles" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to Bundles
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold truncate">{bundle.name}</h1>
            <Badge className={`border ${visibilityConfig[bundle.visibility].color}`}>
              <span className="mr-1">{visibilityConfig[bundle.visibility].icon}</span>
              {bundle.visibility.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            {bundle.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{bundle.skills.length} skill{bundle.skills.length !== 1 ? 's' : ''}</span>
            {bundle.team && (
              <>
                <span>•</span>
                <Link
                  href={`/dashboard/teams/${bundle.team.id}`}
                  className="hover:text-foreground"
                >
                  {bundle.team.name}
                </Link>
              </>
            )}
            <span>•</span>
            <span>{bundle.stats?.downloadsCount ?? 0} downloads</span>
          </div>
        </div>

        {/* Actions Card */}
        <Card className="lg:w-64 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/api/bundles/${bundle.id}/download`} className="block">
              <Button className="w-full" variant="default">
                <ArrowDown className="h-4 w-4 mr-2" />
                Download Bundle
              </Button>
            </Link>

            {canEdit && (
              <Link href={`/dashboard/bundles/${bundle.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Bundle
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

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
                <Link key={skill.id} href={`/dashboard/skills/${skill.fullSlug || skill.id}`}>
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
