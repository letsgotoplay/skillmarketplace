import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/users - List all users
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '25', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              skills: true,
              teamMembers: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
