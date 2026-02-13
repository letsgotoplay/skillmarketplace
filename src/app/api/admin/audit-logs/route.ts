import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/audit-logs - List audit logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resource && { resource }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
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
      user: log.userId ? userMap.get(log.userId) : null,
    }));

    return NextResponse.json({ logs: logsWithUsers, total });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
