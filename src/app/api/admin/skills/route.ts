import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/skills - List all skills with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') ?? '25', 10);
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const visibility = searchParams.get('visibility');
    const authorId = searchParams.get('authorId');
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (visibility && visibility !== 'ALL') {
      where.visibility = visibility;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          visibility: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          stats: {
            select: {
              downloadsCount: true,
              viewsCount: true,
            },
          },
          versions: {
            select: {
              id: true,
              version: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              versions: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.skill.count({ where }),
    ]);

    return NextResponse.json({ skills, total });
  } catch (error) {
    console.error('Failed to fetch skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}
