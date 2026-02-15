import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/users/[id]/activity - Get user activity timeline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const logs = await prisma.auditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch user activity:', error);
    return NextResponse.json({ error: 'Failed to fetch user activity' }, { status: 500 });
  }
}
