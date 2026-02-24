import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditLogList } from '@/components/admin/audit-log-list';
import { prisma } from '@/lib/db';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

async function getAuditLogs(): Promise<{ logs: AuditLog[]; total: number }> {
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.auditLog.count(),
  ]);

  // Get unique user IDs and fetch user info
  const userIds = Array.from(new Set(logs.filter((l) => l.userId).map((l) => l.userId))) as string[];
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, name: true },
      })
    : [];

  const userMap = new Map(users.map((u) => [u.id, u]));
  const logsWithUsers = logs.map((log) => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
    user: log.userId ? userMap.get(log.userId) : null,
  }));

  return { logs: logsWithUsers, total };
}

function AuditLogSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AuditLogsPage() {
  const { logs, total } = await getAuditLogs();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">{total} total events</p>
        </div>
      </div>

      <Suspense fallback={<AuditLogSkeleton />}>
        <AuditLogList initialLogs={logs} initialTotal={total} />
      </Suspense>
    </div>
  );
}
