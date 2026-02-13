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

export default async function EvaluationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Get all evaluations for user's skills
  const evaluations = await prisma.evalQueue.findMany({
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
      results: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Evaluations</h1>
      </div>

      {evaluations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No evaluations found. Upload a skill to run evaluations.
            </p>
            <Link href="/dashboard/skills/upload">
              <Button>Upload Skill</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {evaluations.map((eval_) => (
            <Card key={eval_.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{eval_.skillVersion.skill.name}</CardTitle>
                    <CardDescription>
                      Version {eval_.skillVersion.version}
                    </CardDescription>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                      statusColors[eval_.status]
                    }`}
                  >
                    {eval_.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(eval_.createdAt).toLocaleString()}</p>
                    {eval_.startedAt && (
                      <p>Started: {new Date(eval_.startedAt).toLocaleString()}</p>
                    )}
                    {eval_.completedAt && (
                      <p>Completed: {new Date(eval_.completedAt).toLocaleString()}</p>
                    )}
                    {eval_.error && (
                      <p className="text-red-600 mt-2">Error: {eval_.error}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {eval_.results.length > 0 && (
                      <div>
                        <p className="font-medium">Results:</p>
                        <p className="text-sm text-muted-foreground">
                          {eval_.results.filter((r) => r.status === 'PASSED').length} passed,{' '}
                          {eval_.results.filter((r) => r.status === 'FAILED').length} failed
                        </p>
                      </div>
                    )}
                    <Link href={`/dashboard/skills/${eval_.skillVersion.skill.id}`}>
                      <Button variant="outline" className="mt-2">
                        View Skill
                      </Button>
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
