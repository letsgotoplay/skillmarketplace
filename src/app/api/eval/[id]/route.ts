import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { getEvalResults } from '@/lib/eval/queue';

/**
 * @openapi
 * /eval/{id}:
 *   get:
 *     tags: [Evaluations]
 *     summary: Get evaluation results
 *     description: Get the results of a queued evaluation job
 *     security:
 *       - session: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Evaluation job ID
 *     responses:
 *       200:
 *         description: Evaluation results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EvaluationResult'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Evaluation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
