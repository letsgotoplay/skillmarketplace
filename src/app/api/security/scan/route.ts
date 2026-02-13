import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { scanSkill, storeSecurityScan, getSecurityScan } from '@/lib/security';
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
      include: { skill: true },
    });

    if (!skillVersion) {
      return NextResponse.json({ error: 'Skill version not found' }, { status: 404 });
    }

    // Check permission
    if (skillVersion.skill.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read skill file
    const skillBuffer = await readFile(skillVersion.filePath);

    // Run security scan
    const report = await scanSkill(skillBuffer);

    // Store results
    await storeSecurityScan(skillVersionId, report);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Security scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skillVersionId = searchParams.get('skillVersionId');

  if (!skillVersionId) {
    return NextResponse.json(
      { error: 'skillVersionId is required' },
      { status: 400 }
    );
  }

  const scan = await getSecurityScan(skillVersionId);

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  return NextResponse.json(scan);
}
