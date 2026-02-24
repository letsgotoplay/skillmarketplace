import { getServerSession } from 'next-auth';
import { authOptions } from './index';
import prisma from '@/lib/db';
import crypto from 'crypto';
import { TokenScope } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  scopes?: TokenScope[];
  authType: 'session' | 'token';
  // Token-specific info (null for session auth)
  tokenId?: string;
  tokenPrefix?: string;
}

export interface ApiTokenValidationResult {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Hash a token using SHA-256
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  const randomBytes = crypto.randomBytes(32);
  return `sh_${randomBytes.toString('base64url')}`;
}

/**
 * Get the token prefix (first 8 characters) for identification
 */
export function getTokenPrefix(token: string): string {
  return token.substring(0, 8);
}

/**
 * Validate an API token and return the associated user
 */
export async function validateApiToken(token: string): Promise<ApiTokenValidationResult> {
  if (!token || !token.startsWith('sh_')) {
    return { valid: false, error: 'Invalid token format' };
  }

  const tokenHash = hashToken(token);

  try {
    const apiToken = await prisma.apiToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!apiToken) {
      return { valid: false, error: 'Token not found' };
    }

    if (apiToken.revokedAt) {
      return { valid: false, error: 'Token has been revoked' };
    }

    if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
      return { valid: false, error: 'Token has expired' };
    }

    // Update last used timestamp
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      user: {
        id: apiToken.user.id,
        email: apiToken.user.email,
        name: apiToken.user.name,
        role: apiToken.user.role,
        scopes: apiToken.scopes,
        authType: 'token',
        tokenId: apiToken.id,
        tokenPrefix: apiToken.tokenPrefix,
      },
    };
  } catch (error) {
    console.error('Error validating API token:', error);
    return { valid: false, error: 'Internal server error' };
  }
}

/**
 * Extract Bearer token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Unified authentication that supports both session and API token
 * Use this in API routes to authenticate requests
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  // 1. Check Authorization header for Bearer token
  const authHeader = request.headers.get('Authorization');
  const bearerToken = extractBearerToken(authHeader);

  if (bearerToken) {
    const result = await validateApiToken(bearerToken);
    return result.valid ? result.user || null : null;
  }

  // 2. Fall back to session auth
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || null,
        role: session.user.role,
        authType: 'session',
      };
    }
  } catch (error) {
    console.error('Error getting session:', error);
  }

  return null;
}

/**
 * Check if a user has a specific scope
 */
export function hasScope(user: AuthUser | null, scope: TokenScope): boolean {
  if (!user) return false;

  // Session auth has all scopes based on role
  if (user.authType === 'session') {
    if (user.role === 'ADMIN') return true;
    // Map session roles to scopes
    const roleScopes: Record<string, TokenScope[]> = {
      ADMIN: Object.values(TokenScope),
      TEAM_ADMIN: [TokenScope.SKILL_READ, TokenScope.SKILL_WRITE, TokenScope.BUNDLE_READ, TokenScope.BUNDLE_WRITE, TokenScope.TEAM_READ],
      USER: [TokenScope.SKILL_READ, TokenScope.SKILL_WRITE, TokenScope.BUNDLE_READ],
    };
    return roleScopes[user.role]?.includes(scope) || false;
  }

  // Token auth - check explicit scopes
  return user.scopes?.includes(scope) || false;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Require a specific scope - throws if not authorized
 */
export async function requireScope(request: Request, scope: TokenScope): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (!hasScope(user, scope)) {
    throw new Error(`Missing required scope: ${scope}`);
  }
  return user;
}

/**
 * Extract client info from request headers
 */
export function getClientInfo(request: Request): {
  userAgent: string | null;
  ip: string | null;
} {
  const userAgent = request.headers.get('user-agent');
  // Try various headers for IP (proxies, load balancers, etc.)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    null;

  return { userAgent, ip };
}

/**
 * Build auth metadata for audit logs
 */
export function buildAuthMetadata(
  authUser: AuthUser | null,
  request: Request
): Record<string, unknown> {
  const { userAgent, ip } = getClientInfo(request);

  return {
    authType: authUser?.authType || 'anonymous',
    tokenId: authUser?.tokenPrefix || null,
    userAgent,
    ip,
  };
}
