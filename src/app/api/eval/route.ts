import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { queueEvaluation } from '@/lib/eval/queue';
import { parseSkillZip, parseTestConfig } from '@/lib/skills';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/db';

/**
 * @openapi
 * /eval:
 *   post:
 *     tags: [Evaluations]
 *     summary: Queue evaluation
 *     description: Queue a skill for automated evaluation (owner only). Requires test cases in the skill package.
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillVersionId
 *             properties:
 *               skillVersionId:
 *                 type: string
 *                 format: uuid
 *                 description: Skill version ID to evaluate
 *     responses:
 *       200:
 *         description: Evaluation queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 evalId:
 *                   type: string
 *                   description: Job ID for tracking the evaluation
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing skillVersionId or no test cases found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { skillVersionId } = body;

    if (!skillVersionId) {
      return NextResponse.json(
        { error: 'skillVersionId is required' },
        { status: 400 }
      );
    }

    // Get skill version
    const skillVersion = await prisma.skillVersion.findUnique({
      where: { id: skillVersionId },
      include: {
        skill: true,
      },
    });

    if (!skillVersion) {
      return NextResponse.json({ error: 'Skill version not found' }, { status: 404 });
    }

    // Check permission
    if (skillVersion.skill.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read skill file and parse test config
    const skillBuffer = await readFile(skillVersion.filePath);
    const parsedSkill = await parseSkillZip(skillBuffer);
    const testConfig = parseTestConfig(parsedSkill);

    if (!testConfig || !testConfig.testCases || testConfig.testCases.length === 0) {
      return NextResponse.json(
        { error: 'No test cases found in skill package' },
        { status: 400 }
      );
    }

    // Queue the evaluation
    const jobId = await queueEvaluation(
      skillVersionId,
      testConfig.testCases.map((tc) => ({
        name: tc.name,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        expectedPatterns: tc.expectedPatterns,
        timeout: tc.timeout || 30000,
      })),
      skillVersion.filePath
    );

    return NextResponse.json({
      success: true,
      evalId: jobId,
      message: 'Evaluation queued successfully',
    });
  } catch (error) {
    console.error('Evaluation queue error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to queue evaluation' },
      { status: 500 }
    );
  }
}
