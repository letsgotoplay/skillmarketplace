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
import { SecurityFindings } from '@/components/security/security-findings';
import type { SecurityFinding } from '@/lib/security/scanner';
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

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
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
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

      {/* Security Analysis */}
      {skill.versions.length > 0 && (() => {
        const latestVersion = skill.versions[0];
        const scan = latestVersion.scans[0];
        const reportJson = scan?.reportJson as {
          riskLevel?: 'low' | 'medium' | 'high' | 'critical';
          findings?: SecurityFinding[];
          summary?: {
            critical: number;
            high: number;
            medium: number;
            low: number;
            info: number;
            total: number;
          };
          analyzedAt?: string;
          analyzedFiles?: number;
        } | null;

        const aiReport = latestVersion.aiSecurityReport as {
          riskLevel?: string;
          threats?: SecurityFinding[];
          recommendations?: string[];
          confidence?: number;
        } | null;

        // Combine findings from pattern scan and AI
        const patternFindings = reportJson?.findings || [];
        const aiFindings = aiReport?.threats || [];
        const allFindings = [...patternFindings, ...aiFindings];

        // Determine combined risk level
        const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
        const patternLevel = reportJson?.riskLevel;
        const aiLevel = aiReport?.riskLevel as string | undefined;
        const patternIndex = patternLevel ? riskLevels.indexOf(patternLevel) : -1;
        const aiIndex = aiLevel ? riskLevels.indexOf(aiLevel as typeof riskLevels[number]) : -1;
        const maxIndex = Math.max(patternIndex, aiIndex);
        const combinedRiskLevel = maxIndex >= 0 ? riskLevels[maxIndex] : 'unknown';

        // Combined summary
        const combinedSummary = {
          critical: allFindings.filter(f => f.severity === 'critical').length,
          high: allFindings.filter(f => f.severity === 'high').length,
          medium: allFindings.filter(f => f.severity === 'medium').length,
          low: allFindings.filter(f => f.severity === 'low').length,
          info: allFindings.filter(f => f.severity === 'info').length,
          total: allFindings.length,
        };

        return (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {combinedRiskLevel === 'critical' || combinedRiskLevel === 'high' ? (
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                    ) : combinedRiskLevel === 'medium' ? (
                      <Shield className="h-5 w-5 text-yellow-500" />
                    ) : combinedRiskLevel === 'low' ? (
                      <ShieldCheck className="h-5 w-5 text-green-500" />
                    ) : (
                      <ShieldX className="h-5 w-5 text-gray-400" />
                    )}
                    Security Analysis
                  </CardTitle>
                  <CardDescription>
                    Latest version v{latestVersion.version}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!scan && !latestVersion.aiSecurityAnalyzed ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Security analysis in progress...</p>
                </div>
              ) : allFindings.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p className="text-green-600 font-medium">No security issues found</p>
                  {reportJson?.analyzedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Analyzed on {new Date(reportJson.analyzedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <SecurityFindings
                    riskLevel={combinedRiskLevel}
                    findings={allFindings}
                    summary={combinedSummary}
                    analyzedAt={reportJson?.analyzedAt}
                    analyzedFiles={reportJson?.analyzedFiles}
                  />

                  {/* AI Recommendations */}
                  {aiReport?.recommendations && aiReport.recommendations.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">AI Recommendations</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {aiReport.recommendations.map((rec, i) => (
                          <li key={i}>• {rec}</li>
                        ))}
                      </ul>
                      {aiReport.confidence && (
                        <p className="text-xs text-blue-600 mt-2">
                          AI Confidence: {aiReport.confidence}%
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
