import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTeamActivity, getTeamStatsSummary, getTeamLeaderboard } from '@/lib/teams/contributions';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Check if user is a team member
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { teamId: id, userId: session.user.id },
  });

  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'activity';
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  switch (type) {
    case 'stats':
      const stats = await getTeamStatsSummary(id);
      return NextResponse.json(stats);

    case 'leaderboard':
      const leaderboard = await getTeamLeaderboard(id, limit);
      return NextResponse.json(leaderboard);

    case 'activity':
    default:
      const activity = await getTeamActivity(id, limit, offset);
      return NextResponse.json(activity);
  }
}
