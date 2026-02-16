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
import { Badge } from '@/components/ui/badge';
import { SkillDetailTabs } from '@/components/skills/skill-detail-tabs';
import { NewVersionDialog } from '@/components/skills/new-version-dialog';
import { VisibilityEditor } from '@/components/skills/visibility-editor';
import { isUUID } from '@/lib/slug';
import { CopyButton } from '@/components/skill/copy-button';
import { ArrowLeft, Download, Upload, Eye, EyeOff, Users, Terminal } from 'lucide-react';

const visibilityConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  PUBLIC: { color: 'bg-green-100 text-green-700 border-green-200', icon: <Eye className="h-3 w-3" /> },
  TEAM_ONLY: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Users className="h-3 w-3" /> },
  PRIVATE: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: <EyeOff className="h-3 w-3" /> },
};

const includeConfig = {
  author: true,
  team: true,
  versions: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' as const },
        take: 1,
      },
      files: true,
      evals: {
        include: {
          results: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
    },
  },
  stats: true,
};

export default async function SkillDetailPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Join the slug array to get the full identifier
  const identifier = params.slug.join('/');

  // Determine if this is a UUID (backward compatibility) or a fullSlug
  const skill = isUUID(identifier)
    ? await prisma.skill.findUnique({
        where: { id: identifier },
        include: includeConfig,
      })
    : await prisma.skill.findUnique({
        where: { fullSlug: identifier },
        include: includeConfig,
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

  const isOwner = skill.authorId === session.user.id;
  const latestVersion = skill.versions[0];

  // Prepare data for the tabs component
  const versionsForTabs = skill.versions.map((version) => ({
    id: version.id,
    version: version.version,
    changelog: version.changelog,
    status: version.status,
    createdAt: version.createdAt.toISOString(),
    processingComplete: version.processingComplete,
    files: version.files.map((f) => ({
      id: f.id,
      filePath: f.filePath,
      fileType: f.fileType,
      sizeBytes: f.sizeBytes,
      content: f.content,
    })),
    evals: version.evals.map((e) => ({
      id: e.id,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      startedAt: e.startedAt?.toISOString() || null,
      completedAt: e.completedAt?.toISOString() || null,
      error: e.error,
      results: e.results.map((r) => ({
        id: r.id,
        testName: r.testName,
        status: r.status,
        output: r.output,
        durationMs: r.durationMs,
      })),
    })),
    scans: version.scans.map((s) => ({
      id: s.id,
      status: s.status,
      reportJson: s.reportJson,
      createdAt: s.createdAt.toISOString(),
    })),
    aiSecurityAnalyzed: version.aiSecurityAnalyzed,
    aiSecurityReport: version.aiSecurityReport as unknown,
  }));

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/dashboard/skills" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to My Skills
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h1 className="text-3xl font-bold truncate">{skill.name}</h1>
            <Badge variant="secondary">v{latestVersion?.version || '0.0.0'}</Badge>
            <Badge className={`border ${visibilityConfig[skill.visibility].color}`}>
              <span className="mr-1">{visibilityConfig[skill.visibility].icon}</span>
              {skill.visibility.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            {skill.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>By {skill.author.name || skill.author.email}</span>
            {skill.team && (
              <>
                <span>•</span>
                <Link
                  href={`/dashboard/teams/${skill.team.id}`}
                  className="hover:text-foreground"
                >
                  {skill.team.name}
                </Link>
              </>
            )}
            <span>•</span>
            <span>{skill.versions.length} version{skill.versions.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Actions Card */}
        <Card className="lg:w-72 shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* CLI Install */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <Terminal className="h-3.5 w-3.5" />
                CLI Install
              </p>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  skillhub add {skill.fullSlug}
                </code>
                <CopyButton text={`skillhub add ${skill.fullSlug}`} />
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Link href={`/api/download/${skill.fullSlug || skill.id}`} className="block">
                <Button className="w-full" variant="default">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </Link>

              {isOwner && (
                <>
                  <NewVersionDialog
                    skillId={skill.id}
                    skillName={skill.name}
                    currentVersion={latestVersion?.version || '0.0.0'}
                    trigger={
                      <Button variant="outline" className="w-full justify-start">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Version
                      </Button>
                    }
                  />
                  <VisibilityEditor
                    skillId={skill.id}
                    currentVisibility={skill.visibility}
                    currentTeamId={skill.teamId}
                    isOwner={true}
                  />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{skill.stats?.downloadsCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{skill.stats?.viewsCount ?? 0}</div>
            <div className="text-sm text-muted-foreground">Views</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{skill.versions.length}</div>
            <div className="text-sm text-muted-foreground">Versions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{latestVersion?.files.length ?? 0}</div>
            <div className="text-sm text-muted-foreground">Files</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <SkillDetailTabs
        skillId={skill.id}
        skillName={skill.name}
        skillDescription={skill.description}
        skillVisibility={skill.visibility}
        authorName={skill.author.name}
        authorEmail={skill.author.email}
        createdAt={skill.createdAt.toISOString()}
        versions={versionsForTabs}
      />
    </div>
  );
}
