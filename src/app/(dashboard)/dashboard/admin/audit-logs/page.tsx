import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/audit-logs?limit=50`,
    { cache: 'no-store' }
  );
  return res.json();
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function getActionColor(action: string): string {
  if (action.includes('deleted') || action.includes('removed') || action.includes('failed')) {
    return 'bg-red-100 text-red-800';
  }
  if (action.includes('created') || action.includes('added') || action.includes('completed')) {
    return 'bg-green-100 text-green-800';
  }
  if (action.includes('updated') || action.includes('uploaded')) {
    return 'bg-blue-100 text-blue-800';
  }
  return 'bg-gray-100 text-gray-800';
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

      <Card>
        <CardHeader>
          <CardTitle>System Activity</CardTitle>
          <CardDescription>Recent system events and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No audit logs yet</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getActionColor(log.action)}`}
                      >
                        {formatAction(log.action)}
                      </span>
                      <span className="text-sm text-muted-foreground">{log.resource}</span>
                    </div>
                    <div className="text-sm">
                      {log.user ? (
                        <span>
                          By <strong>{log.user.name ?? log.user.email}</strong>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                      {log.resourceId && (
                        <span className="text-muted-foreground ml-2">
                          on {log.resource} ({log.resourceId.slice(0, 8)}...)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
