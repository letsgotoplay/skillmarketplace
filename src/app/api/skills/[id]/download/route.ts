import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const { searchParams } = new URL(request.url);
  const version = searchParams.get('version');

  // Find the skill
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      versions: version
        ? { where: { version } }
        : { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!skill || skill.versions.length === 0) {
    return NextResponse.json({ error: 'Skill or version not found' }, { status: 404 });
  }

  // Check access
  if (skill.visibility !== 'PUBLIC') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (skill.authorId !== session.user.id && skill.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: skill.teamId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
  }

  const skillVersion = skill.versions[0];

  try {
    const fileBuffer = await readFile(skillVersion.filePath);

    // Update download count
    await prisma.skillStat.update({
      where: { skillId: skill.id },
      data: {
        downloadsCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    });

    // Create audit log
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DOWNLOAD_SKILL',
          resource: 'skill',
          resourceId: skill.id,
          metadata: { version: skillVersion.version },
        },
      });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${skill.slug}-${skillVersion.version}.zip"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to read skill file' }, { status: 500 });
  }
}
