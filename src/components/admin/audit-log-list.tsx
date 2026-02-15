'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchInput } from '@/components/admin/filters/search-input';
import { DateRangeFilter } from '@/components/admin/filters/date-range-filter';
import { DataTable } from '@/components/admin/data-table';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface AuditLogListProps {
  initialLogs: AuditLog[];
  initialTotal: number;
}

const ACTION_TYPES = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'SKILL_', label: 'Skill Events' },
  { value: 'USER_', label: 'User Events' },
  { value: 'TEAM_', label: 'Team Events' },
  { value: 'EVAL_', label: 'Evaluation Events' },
  { value: 'SECURITY_', label: 'Security Events' },
  { value: 'BUNDLE_', label: 'Bundle Events' },
];

const RESOURCE_TYPES = [
  { value: 'ALL', label: 'All Resources' },
  { value: 'skill', label: 'Skill' },
  { value: 'user', label: 'User' },
  { value: 'team', label: 'Team' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'eval', label: 'Evaluation' },
  { value: 'scan', label: 'Security Scan' },
];

function getActionColor(action: string): string {
  if (action.includes('deleted') || action.includes('removed') || action.includes('failed') || action.includes('rejected')) {
    return 'bg-red-100 text-red-800';
  }
  if (action.includes('created') || action.includes('added') || action.includes('completed') || action.includes('approved')) {
    return 'bg-green-100 text-green-800';
  }
  if (action.includes('updated') || action.includes('uploaded') || action.includes('changed')) {
    return 'bg-blue-100 text-blue-800';
  }
  if (action.includes('viewed') || action.includes('downloaded')) {
    return 'bg-purple-100 text-purple-800';
  }
  return 'bg-gray-100 text-gray-800';
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogList({ initialLogs, initialTotal }: AuditLogListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const userSearch = searchParams.get('userSearch') ?? '';
  const action = searchParams.get('action') ?? 'ALL';
  const resource = searchParams.get('resource') ?? 'ALL';
  const startDate = searchParams.get('startDate') ?? '';
  const endDate = searchParams.get('endDate') ?? '';
  const datePreset = searchParams.get('datePreset') ?? 'all';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'ALL') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      if (!('page' in updates)) {
        params.delete('page');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (userSearch) params.set('userSearch', userSearch);
    if (action !== 'ALL') params.set('action', action);
    if (resource !== 'ALL') params.set('resource', resource);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    params.set('limit', pageSize.toString());
    params.set('offset', ((page - 1) * pageSize).toString());

    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setIsLoading(false);
  }, [userSearch, action, resource, startDate, endDate, page, pageSize]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('userSearch', userSearch);
      if (action !== 'ALL') params.set('action', action);
      if (resource !== 'ALL') params.set('resource', resource);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (log: AuditLog) => (
        <div className="flex items-center gap-2">
          <Collapsible open={expandedLogs.has(log.id)} onOpenChange={() => toggleExpand(log.id)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {expandedLogs.has(log.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          <Badge className={getActionColor(log.action)} variant="secondary">
            {formatAction(log.action)}
          </Badge>
        </div>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (log: AuditLog) => (
        <div>
          <span className="font-medium">{log.resource}</span>
          {log.resourceId && (
            <span className="text-muted-foreground text-xs ml-2">
              ({log.resourceId.slice(0, 8)}...)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (log: AuditLog) =>
        log.user ? (
          <span>{log.user.name || log.user.email}</span>
        ) : (
          <span className="text-muted-foreground">System</span>
        ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (log: AuditLog) => new Date(log.createdAt).toLocaleString(),
    },
    {
      key: 'metadata',
      header: '',
      render: (log: AuditLog) =>
        expandedLogs.has(log.id) ? (
          <Collapsible open={true}>
            <CollapsibleContent>
              <div className="col-span-full mt-2 p-3 bg-muted rounded-md">
                <pre className="text-xs overflow-auto max-h-[200px]">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Recent system events and user actions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <SearchInput
            value={userSearch}
            onChange={(value) => updateParams({ userSearch: value || null })}
            placeholder="Search by user..."
            className="w-[200px]"
          />
          <Select value={action} onValueChange={(value) => updateParams({ action: value })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={resource} onValueChange={(value) => updateParams({ resource: value })}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Resource" />
            </SelectTrigger>
            <SelectContent>
              {RESOURCE_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={(date) => updateParams({ startDate: date || null })}
            onEndDateChange={(date) => updateParams({ endDate: date || null })}
            preset={datePreset}
            onPresetChange={(preset) => updateParams({ datePreset: preset })}
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: (newPage) => updateParams({ page: newPage }),
            onPageSizeChange: (newSize) => updateParams({ pageSize: newSize, page: 1 }),
          }}
          isLoading={isLoading}
          emptyMessage="No audit logs found"
        />
      </CardContent>
    </Card>
  );
}
