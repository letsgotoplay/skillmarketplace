import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/skills/[id] - Get skill details for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const skill = await prisma.skill.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        category: true,
        visibility: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        stats: true,
        versions: {
          select: {
            id: true,
            version: true,
            changelog: true,
            status: true,
            specValidationPassed: true,
            specValidationErrors: true,
            aiSecurityAnalyzed: true,
            processingComplete: true,
            createdAt: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            evals: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                completedAt: true,
                results: {
                  select: {
                    testName: true,
                    status: true,
                    output: true,
                    durationMs: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            scans: {
              select: {
                id: true,
                score: true,
                riskLevel: true,
                blockExecution: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        feedback: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        downloads: {
          select: {
            downloadType: true,
            version: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Failed to fetch skill:', error);
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 });
  }
}

// PATCH /api/admin/skills/[id] - Update skill (visibility, author)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { visibility, authorId } = body;

    const currentSkill = await prisma.skill.findUnique({
      where: { id },
      select: { visibility: true, authorId: true },
    });

    if (!currentSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const auditChanges: Record<string, unknown> = {};

    if (visibility && visibility !== currentSkill.visibility) {
      updateData.visibility = visibility;
      auditChanges.oldVisibility = currentSkill.visibility;
      auditChanges.newVisibility = visibility;
    }

    if (authorId && authorId !== currentSkill.authorId) {
      // Verify new author exists
      const newAuthor = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      });
      if (!newAuthor) {
        return NextResponse.json({ error: 'New author not found' }, { status: 400 });
      }
      updateData.authorId = authorId;
      auditChanges.oldAuthorId = currentSkill.authorId;
      auditChanges.newAuthorId = authorId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const skill = await prisma.skill.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        visibility: true,
        authorId: true,
        updatedAt: true,
      },
    });

    // Create audit log
    if (Object.keys(auditChanges).length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'SKILL_UPDATED_BY_ADMIN',
          resource: 'skill',
          resourceId: id,
          metadata: JSON.parse(JSON.stringify(auditChanges)),
        },
      });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Failed to update skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

// DELETE /api/admin/skills/[id] - Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if skill exists
    const skill = await prisma.skill.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Delete skill (cascade will handle related records)
    await prisma.skill.delete({
      where: { id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SKILL_DELETED_BY_ADMIN',
        resource: 'skill',
        resourceId: id,
        metadata: {
          skillName: skill.name,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
