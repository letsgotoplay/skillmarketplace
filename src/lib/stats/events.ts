/**
 * Event Tracking System
 * Tracks user interactions and system events for analytics
 */

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// Type for JSON metadata
export type JsonMetadata = Prisma.InputJsonValue;

// Event types for tracking
export enum EventType {
  // Skill events
  SKILL_VIEWED = 'skill_viewed',
  SKILL_DOWNLOADED = 'skill_downloaded',
  SKILL_UPLOADED = 'skill_uploaded',
  SKILL_VERSION_CREATED = 'skill_version_created',

  // Evaluation events
  EVAL_STARTED = 'eval_started',
  EVAL_COMPLETED = 'eval_completed',
  EVAL_FAILED = 'eval_failed',

  // Security events
  SECURITY_SCAN_STARTED = 'security_scan_started',
  SECURITY_SCAN_COMPLETED = 'security_scan_completed',
  SECURITY_ISSUE_FOUND = 'security_issue_found',

  // Bundle events
  BUNDLE_CREATED = 'bundle_created',
  BUNDLE_SKILL_ADDED = 'bundle_skill_added',
  BUNDLE_DOWNLOADED = 'bundle_downloaded',

  // Team events
  TEAM_CREATED = 'team_created',
  TEAM_MEMBER_ADDED = 'team_member_added',
  TEAM_MEMBER_REMOVED = 'team_member_removed',

  // User events
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
}

export interface TrackEventOptions {
  type: EventType;
  userId?: string;
  resource: string;
  resourceId?: string;
  metadata?: JsonMetadata;
}

/**
 * Track an event in the audit log
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.type,
        resource: options.resource,
        resourceId: options.resourceId,
        metadata: options.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error('Failed to track event:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Track a skill view event
 */
export async function trackSkillView(skillId: string, userId?: string): Promise<void> {
  await Promise.all([
    trackEvent({
      type: EventType.SKILL_VIEWED,
      userId,
      resource: 'skill',
      resourceId: skillId,
    }),
    incrementSkillViews(skillId),
  ]);
}

/**
 * Track a skill download event
 */
export async function trackSkillDownload(
  skillId: string,
  version: string,
  userId?: string
): Promise<void> {
  await Promise.all([
    trackEvent({
      type: EventType.SKILL_DOWNLOADED,
      userId,
      resource: 'skill',
      resourceId: skillId,
      metadata: { version },
    }),
    incrementSkillDownloads(skillId),
  ]);
}

/**
 * Increment skill view count
 */
async function incrementSkillViews(skillId: string): Promise<void> {
  await prisma.skillStat.upsert({
    where: { skillId },
    update: {
      viewsCount: { increment: 1 },
      lastViewedAt: new Date(),
    },
    create: {
      skillId,
      viewsCount: 1,
      lastViewedAt: new Date(),
    },
  });
}

/**
 * Increment skill download count
 */
async function incrementSkillDownloads(skillId: string): Promise<void> {
  await prisma.skillStat.upsert({
    where: { skillId },
    update: {
      downloadsCount: { increment: 1 },
      lastDownloadedAt: new Date(),
    },
    create: {
      skillId,
      downloadsCount: 1,
      lastDownloadedAt: new Date(),
    },
  });
}

/**
 * Get events for a specific resource
 */
export async function getResourceEvents(
  resource: string,
  resourceId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditLog.findMany({
    where: { resource, resourceId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get events for a user
 */
export async function getUserEvents(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
}

/**
 * Get events by type
 */
export async function getEventsByType(
  type: EventType,
  options?: { limit?: number; offset?: number; startDate?: Date; endDate?: Date }
) {
  return prisma.auditLog.findMany({
    where: {
      action: type,
      createdAt: {
        gte: options?.startDate,
        lte: options?.endDate,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 100,
    skip: options?.offset ?? 0,
  });
}
