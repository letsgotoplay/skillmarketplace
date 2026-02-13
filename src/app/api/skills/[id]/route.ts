import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import { notFound } from 'next/navigation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true, slug: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
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

  // Update view count
  await prisma.skillStat.update({
    where: { skillId: skill.id },
    data: {
      viewsCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
  });

  return NextResponse.json(skill);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const skill = await prisma.skill.findUnique({
    where: { id },
  });

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Check ownership
  if (skill.authorId !== session.user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  await prisma.skill.delete({
    where: { id },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'DELETE_SKILL',
      resource: 'skill',
      resourceId: id,
      metadata: { name: skill.name },
    },
  });

  return NextResponse.json({ success: true });
}
