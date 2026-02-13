import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSkills } from '@/app/actions/skills';
import { NextResponse } from 'next/server';
import { Category } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const visibility = searchParams.get('visibility') as 'PUBLIC' | 'TEAM_ONLY' | 'PRIVATE' | null;
  const category = searchParams.get('category') as Category | null;
  const search = searchParams.get('search') || undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

  // For public API, only show public skills
  const session = await getServerSession(authOptions);

  const result = await getSkills({
    visibility: visibility && session ? visibility : 'PUBLIC',
    category: category || undefined,
    search,
    limit,
    offset,
  });

  return NextResponse.json(result);
}
