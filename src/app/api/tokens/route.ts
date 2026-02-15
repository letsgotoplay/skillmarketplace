import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { generateToken, hashToken, getTokenPrefix } from '@/lib/auth/api-auth';
import { TokenScope } from '@prisma/client';

interface CreateTokenRequest {
  name: string;
  scopes: TokenScope[];
  expiresAt?: string;
}

// GET /api/tokens - List user's API tokens
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await prisma.apiToken.findMany({
      where: {
        userId: session.user.id,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        scopes: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error listing tokens:', error);
    return NextResponse.json(
      { error: 'Failed to list tokens' },
      { status: 500 }
    );
  }
}

// POST /api/tokens - Create a new API token
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTokenRequest = await request.json();
    const { name, scopes, expiresAt } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Token name is required' },
        { status: 400 }
      );
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'At least one scope is required' },
        { status: 400 }
      );
    }

    // Validate scopes
    const validScopes = Object.values(TokenScope);
    const invalidScopes = scopes.filter((s) => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate token
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const tokenPrefix = getTokenPrefix(rawToken);

    // Create token in database
    const apiToken = await prisma.apiToken.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        tokenHash,
        tokenPrefix,
        scopes,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'API_TOKEN_CREATED',
        resource: 'api_token',
        resourceId: apiToken.id,
        metadata: {
          name: name.trim(),
          scopes,
          tokenPrefix,
        },
      },
    });

    // Return the raw token ONLY on creation (can't be retrieved later)
    return NextResponse.json({
      id: apiToken.id,
      name: apiToken.name,
      token: rawToken, // Only shown once!
      tokenPrefix: apiToken.tokenPrefix,
      scopes: apiToken.scopes,
      expiresAt: apiToken.expiresAt,
      createdAt: apiToken.createdAt,
      warning: 'Store this token securely. It cannot be retrieved again.',
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    );
  }
}
