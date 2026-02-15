import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// DELETE /api/tokens/[id] - Revoke an API token
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenId = params.id;

    // Find the token and verify ownership
    const token = await prisma.apiToken.findFirst({
      where: {
        id: tokenId,
        userId: session.user.id,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    if (token.revokedAt) {
      return NextResponse.json(
        { error: 'Token already revoked' },
        { status: 400 }
      );
    }

    // Revoke the token
    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { revokedAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'API_TOKEN_REVOKED',
        resource: 'api_token',
        resourceId: tokenId,
        metadata: {
          name: token.name,
          tokenPrefix: token.tokenPrefix,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking token:', error);
    return NextResponse.json(
      { error: 'Failed to revoke token' },
      { status: 500 }
    );
  }
}

// GET /api/tokens/[id] - Get a specific token's details
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokenId = params.id;

    const token = await prisma.apiToken.findFirst({
      where: {
        id: tokenId,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
        revokedAt: true,
      },
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
}
