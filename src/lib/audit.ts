import { prisma } from '@/lib/db';
import { AuthUser, getClientInfo } from '@/lib/auth/api-auth';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogOptions {
  userId: string | null;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  authUser?: AuthUser | null;
  request?: Request;
}

/**
 * Create an audit log entry with enhanced auth metadata
 */
export async function createAuditLog(options: CreateAuditLogOptions) {
  const { userId, action, resource, resourceId, metadata, authUser, request } = options;

  // Build auth metadata
  let authMetadata: Record<string, unknown> = {};

  if (request) {
    const clientInfo = getClientInfo(request);
    authMetadata = {
      authType: authUser?.authType || 'anonymous',
      tokenId: authUser?.tokenPrefix || null,
      userAgent: clientInfo.userAgent,
      ip: clientInfo.ip,
    };
  } else if (authUser) {
    authMetadata = {
      authType: authUser.authType,
      tokenId: authUser.tokenPrefix || null,
    };
  }

  // Merge with provided metadata
  const finalMetadata = {
    ...authMetadata,
    ...metadata,
  };

  return prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      metadata: finalMetadata as Prisma.InputJsonValue,
    },
  });
}

/**
 * Audit action constants
 */
export const AuditActions = {
  // Skills
  UPLOAD_SKILL: 'UPLOAD_SKILL',
  UPLOAD_SKILL_VERSION: 'UPLOAD_SKILL_VERSION',
  DELETE_SKILL: 'DELETE_SKILL',
  SKILL_VISIBILITY_CHANGED: 'SKILL_VISIBILITY_CHANGED',
  DOWNLOAD_SKILL: 'DOWNLOAD_SKILL',

  // API Tokens
  CREATE_API_TOKEN: 'CREATE_API_TOKEN',
  REVOKE_API_TOKEN: 'REVOKE_API_TOKEN',

  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',

  // Teams
  CREATE_TEAM: 'CREATE_TEAM',
  JOIN_TEAM: 'JOIN_TEAM',
  LEAVE_TEAM: 'LEAVE_TEAM',
} as const;

export type AuditAction = typeof AuditActions[keyof typeof AuditActions];
