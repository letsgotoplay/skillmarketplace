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
import { SecurityFindings } from '@/components/security/security-findings';
import type { SecurityFinding } from '@/lib/security/scanner';

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get all skill versions with security data for user's skills
  const skillVersions = await prisma.skillVersion.findMany({
    where: {
      skill: {
        authorId: session.user.id,
      },
    },
    include: {
      skill: true,
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Security Analysis</h1>
          <p className="text-muted-foreground mt-1">
            View security analysis results for your uploaded skills
          </p>
        </div>
      </div>

      {skillVersions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No skills found. Upload a skill to run security analysis.
            </p>
            <Link href="/dashboard/skills/upload">
              <Button>Upload Skill</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {skillVersions.map((version) => {
            const scan = version.scans[0];
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

            const aiReport = version.aiSecurityReport as {
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
              <Card key={version.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{version.skill.name}</CardTitle>
                      <CardDescription>
                        Version {version.version} • Uploaded {new Date(version.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/skills/${version.skill.id}`}>
                        <Button variant="outline" size="sm">View Skill</Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!scan && !version.aiSecurityAnalyzed ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Security analysis in progress...</p>
                    </div>
                  ) : allFindings.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-green-600 font-medium">No security issues found</p>
                    </div>
                  ) : (
                    <SecurityFindings
                      riskLevel={combinedRiskLevel}
                      findings={allFindings}
                      summary={combinedSummary}
                      analyzedAt={reportJson?.analyzedAt}
                      analyzedFiles={reportJson?.analyzedFiles}
                    />
                  )}

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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
