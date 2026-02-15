import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/audit-logs/export - Export audit logs as CSV
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const userSearch = searchParams.get('userSearch');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // If userSearch is provided, find matching users first
    let userIdsFromSearch: string[] | null = null;
    if (userSearch && !userId) {
      const matchingUsers = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: userSearch, mode: 'insensitive' } },
            { name: { contains: userSearch, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      userIdsFromSearch = matchingUsers.map((u) => u.id);
    }

    const where = {
      ...(userId && { userId }),
      ...(userIdsFromSearch && { userId: { in: userIdsFromSearch } }),
      ...(action && { action: { contains: action, mode: 'insensitive' as const } }),
      ...(resource && { resource: { contains: resource, mode: 'insensitive' as const } }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate + 'T23:59:59') }),
            },
          }
        : {}),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to 10000 rows for export
    });

    // Get unique user IDs and fetch user info
    const userIds = Array.from(new Set(logs.filter((l) => l.userId).map((l) => l.userId))) as string[];
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    // Generate CSV
    const headers = ['ID', 'Timestamp', 'User Email', 'User Name', 'Action', 'Resource', 'Resource ID', 'Metadata'];
    const rows = logs.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      return [
        log.id,
        log.createdAt.toISOString(),
        user?.email || '',
        user?.name || '',
        log.action,
        log.resource,
        log.resourceId || '',
        JSON.stringify(log.metadata || {}),
      ];
    });

    // Escape CSV fields
    const escapeCsv = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Failed to export audit logs:', error);
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 });
  }
}
