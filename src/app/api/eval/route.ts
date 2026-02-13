import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { queueEvaluation } from '@/lib/eval/queue';
import { parseSkillZip, parseTestConfig } from '@/lib/skills';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/db';

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
