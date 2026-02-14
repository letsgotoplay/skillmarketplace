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
import { SkillDetailTabs } from '@/components/skills/skill-detail-tabs';

const visibilityColors: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-700',
  TEAM_ONLY: 'bg-blue-100 text-blue-700',
  PRIVATE: 'bg-gray-100 text-gray-700',
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
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          files: true,
          evals: {
            include: {
              results: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
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

      {/* Team Info */}
      {skill.team && (
        <Card className="mt-8">
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
