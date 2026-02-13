import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        skills: {
          select: {
            id: true,
            name: true,
            slug: true,
            visibility: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        teamMembers: {
          select: {
            id: true,
            role: true,
            joinedAt: true,
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            skills: true,
            teamMembers: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, name } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role }),
        ...(name !== undefined && { name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
