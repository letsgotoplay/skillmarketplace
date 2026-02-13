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

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  RUNNING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
};

function getScoreColor(score: number | null): string {
  if (score === null) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get all security scans for user's skills
  const scans = await prisma.securityScan.findMany({
    where: {
      skillVersion: {
        skill: {
          authorId: session.user.id,
        },
      },
    },
    include: {
      skillVersion: {
        include: {
          skill: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Security Scans</h1>
      </div>

      {scans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No security scans found. Upload a skill to run security scans.
            </p>
            <Link href="/dashboard/skills/upload">
              <Button>Upload Skill</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {scans.map((scan) => (
            <Card key={scan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{scan.skillVersion.skill.name}</CardTitle>
                    <CardDescription>
                      Version {scan.skillVersion.version}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {scan.score !== null && (
                      <span className={`text-2xl font-bold ${getScoreColor(scan.score)}`}>
                        {scan.score}/100
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                        statusColors[scan.status]
                      }`}
                    >
                      {scan.status}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(scan.createdAt).toLocaleString()}</p>
                    {scan.completedAt && (
                      <p>Completed: {new Date(scan.completedAt).toLocaleString()}</p>
                    )}
                    {scan.reportJson && typeof scan.reportJson === 'object' && 'findings' in scan.reportJson && (
                      <div className="mt-2">
                        <p className="font-medium">Findings:</p>
                        <ul className="list-disc list-inside">
                          {(scan.reportJson as { findings?: Array<{ severity: string; type: string }> }).findings?.slice(0, 3).map((finding, i) => (
                            <li key={i} className={
                              finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
                                ? 'text-red-600'
                                : finding.severity === 'MEDIUM'
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }>
                              {finding.severity}: {finding.type}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/skills/${scan.skillVersion.skill.id}`}>
                      <Button variant="outline">View Skill</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
