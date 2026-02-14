import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';

/**
 * @openapi
 * /bundles/{id}:
 *   get:
 *     tags: [Bundles]
 *     summary: Get bundle details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bundle details
 *       404:
 *         description: Bundle not found
 *   put:
 *     tags: [Bundles]
 *     summary: Update a bundle
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               visibility:
 *                 type: string
 *                 enum: [PUBLIC, TEAM_ONLY, PRIVATE]
 *               skillIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Bundle updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *   delete:
 *     tags: [Bundles]
 *     summary: Delete a bundle
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bundle deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const bundle = await prisma.skillBundle.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true, slug: true } },
      skills: {
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
            },
          },
        },
      },
      stats: true,
    },
  });

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  // Check access for non-public bundles
  if (bundle.visibility !== 'PUBLIC') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (bundle.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: { teamId: bundle.teamId, userId: session.user.id },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
  }

  return NextResponse.json(bundle);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bundle = await prisma.skillBundle.findUnique({
    where: { id },
    include: { team: true },
  });

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  // Check if user can edit (must be team admin or owner)
  if (bundle.teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: bundle.teamId, userId: session.user.id },
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: 'Bundle has no team' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, description, visibility, skillIds } = body;

    // Update basic info
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (visibility !== undefined) updateData.visibility = visibility as Visibility;

    // Update skills if provided
    if (skillIds !== undefined && Array.isArray(skillIds)) {
      // Delete existing skills and add new ones
      await prisma.bundleSkill.deleteMany({
        where: { bundleId: id },
      });

      if (skillIds.length > 0) {
        await prisma.bundleSkill.createMany({
          data: skillIds.map((skillId: string) => ({
            bundleId: id,
            skillId,
          })),
        });
      }
    }

    const updated = await prisma.skillBundle.update({
      where: { id },
      data: updateData,
      include: {
        skills: {
          include: {
            skill: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_BUNDLE',
        resource: 'bundle',
        resourceId: id,
        metadata: { name, skillCount: skillIds?.length },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Bundle update error:', error);
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
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

  const bundle = await prisma.skillBundle.findUnique({
    where: { id },
  });

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  // Check if user can delete (must be team admin or owner)
  if (bundle.teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId: bundle.teamId, userId: session.user.id },
    });

    if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }
  }

  await prisma.skillBundle.delete({
    where: { id },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'DELETE_BUNDLE',
      resource: 'bundle',
      resourceId: id,
      metadata: { name: bundle.name },
    },
  });

  return NextResponse.json({ success: true });
}
