export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDown,
  Shield,
  CheckCircle,
  Share2,
  FolderOpen,
} from 'lucide-react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SkillFileBrowser } from '@/components/skill/file-browser';
import { CopyButton } from '@/components/skill/copy-button';
import { SkillFeedbackSection } from '@/components/skill/feedback-section';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

const testStatusColors: Record<string, string> = {
  PASSED: 'text-green-600',
  FAILED: 'text-red-600',
  SKIPPED: 'text-gray-500',
};

export default async function MarketplaceSkillPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  const skill = await prisma.skill.findFirst({
    where: {
      id: params.id,
      visibility: 'PUBLIC',
    },
    include: {
      author: { select: { name: true, email: true } },
      team: { select: { name: true, slug: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        include: {
          files: {
            select: {
              filePath: true,
              fileType: true,
              sizeBytes: true,
              content: true,
            },
          },
          _count: { select: { files: true } },
          evals: {
            include: {
              results: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!skill) {
    notFound();
  }

  const latestVersion = skill.versions[0];
  const latestEval = latestVersion?.evals[0];
  const latestScan = latestVersion?.scans[0];
  const files = latestVersion?.files || [];
  const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/marketplace/${skill.id}`;

  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to Marketplace
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{skill.name}</h1>
          <p className="text-lg text-muted-foreground mb-4">{skill.description}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">v{latestVersion?.version || '0.0.0'}</Badge>
            <Badge variant="outline">{skill.team?.name || 'Independent'}</Badge>
            {latestScan?.score !== null && latestScan?.score !== undefined && (
              <Badge
                variant={latestScan.score >= 80 ? 'default' : latestScan.score >= 60 ? 'secondary' : 'destructive'}
              >
                <Shield className="h-3 w-3 mr-1" />
                Security: {latestScan.score}/100
              </Badge>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {session ? (
            <Link href={`/api/skills/${skill.id}/download`}>
              <Button size="lg">
                <ArrowDown className="h-4 w-4 mr-2" />
                Download
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="lg">
                Sign in to Download
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{skill.stats?.downloadsCount || 0}</div>
            <div className="text-sm text-muted-foreground">Downloads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold">{skill.stats?.viewsCount || 0}</div>
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
            <div className="text-3xl font-bold">{files.length}</div>
            <div className="text-sm text-muted-foreground">Files</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Browser */}
          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Files ({files.length})
                </CardTitle>
                <CardDescription>
                  Browse the skill file structure
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SkillFileBrowser
                  files={files.map((f: { filePath: string; fileType: string; sizeBytes: number; content: string | null }) => ({
                    filePath: f.filePath,
                    fileType: f.fileType,
                    sizeBytes: f.sizeBytes,
                    content: f.content,
                  }))}
                  skillId={skill.id}
                  skillDescription={skill.description || undefined}
                  showDownloadButton={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Security Scan & Evaluation Results - Side by Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Security Scan (Left) */}
            {latestScan && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Security analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-3xl font-bold ${latestScan.score !== null && latestScan.score >= 80 ? 'text-green-600' : latestScan.score !== null && latestScan.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {latestScan.score !== null ? latestScan.score : 'N/A'}
                        </span>
                        <span className="text-muted-foreground text-sm">/100</span>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${statusColors[latestScan.status]}`}>
                        {latestScan.status}
                      </span>
                    </div>
                    {latestScan.reportJson && typeof latestScan.reportJson === 'object' && 'findings' in latestScan.reportJson && (
                      <div className="space-y-2">
                        {(latestScan.reportJson as { findings?: Array<{ severity: string; type: string }> }).findings?.slice(0, 3).map((finding, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'bg-red-500' :
                              finding.severity === 'MEDIUM' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`} />
                            <span className="truncate">{finding.type}</span>
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">{finding.severity}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evaluation / Test Results (Right) */}
            {latestEval && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Test Cases
                  </CardTitle>
                  <CardDescription>
                    Evaluation results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${statusColors[latestEval.status]}`}>
                        {latestEval.status}
                      </span>
                      {latestEval.completedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(latestEval.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {latestEval.results.length > 0 ? (
                      <div className="space-y-2">
                        {latestEval.results.slice(0, 5).map((result: { testName: string; status: string }, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm">
                            <span className="truncate mr-2">{result.testName}</span>
                            <span className={`font-medium shrink-0 ${testStatusColors[result.status]}`}>
                              {result.status}
                            </span>
                          </div>
                        ))}
                        {latestEval.results.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{latestEval.results.length - 5} more tests
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No test results available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feedback Section */}
          <SkillFeedbackSection skillId={skill.id} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Share URL */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {shareUrl}
                </code>
                <CopyButton text={shareUrl} />
              </div>
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Author</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {(skill.author.name || skill.author.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{skill.author.name || 'Anonymous'}</p>
                  <p className="text-sm text-muted-foreground">{skill.author.email}</p>
                </div>
              </div>
              {skill.team && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Part of</p>
                  <p className="font-medium">{skill.team.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Version History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Versions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {skill.versions.slice(0, 5).map((version: { id: string; version: string; createdAt: Date }, index: number) => (
                  <div key={version.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">v{version.version}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {index === 0 && (
                      <Badge variant="secondary">Latest</Badge>
                    )}
                  </div>
                ))}
                {skill.versions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{skill.versions.length - 5} more versions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Install Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block p-3 bg-muted rounded text-sm overflow-x-auto">
                claude skill install {skill.slug}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Or download and extract to your skills directory
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
