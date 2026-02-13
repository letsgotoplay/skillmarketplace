import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getEvalResults } from '@/lib/eval/queue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const evalResults = await getEvalResults(id);

    if (!evalResults) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    return NextResponse.json(evalResults);
  } catch (error) {
    console.error('Get eval results error:', error);
    return NextResponse.json(
      { error: 'Failed to get evaluation results' },
      { status: 500 }
    );
  }
}
