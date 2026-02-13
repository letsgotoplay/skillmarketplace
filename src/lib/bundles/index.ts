'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';
import { z } from 'zod';

const createBundleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  teamId: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'TEAM_ONLY', 'PRIVATE']).default('PUBLIC'),
});

export interface BundleResult {
  success: boolean;
  bundle?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };
  error?: string;
}

export async function createBundle(data: {
  name: string;
  description?: string;
  teamId?: string;
  visibility?: Visibility;
}): Promise<BundleResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const validated = createBundleSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid input' };
  }

  const slug = generateSlug(validated.data.name);

  // Check if slug already exists
  const existing = await prisma.skillBundle.findUnique({ where: { slug } });
  if (existing) {
    return { success: false, error: 'Bundle name already taken' };
  }

  try {
    const bundle = await prisma.skillBundle.create({
      data: {
        name: validated.data.name,
        slug,
        description: validated.data.description,
        teamId: validated.data.teamId || null,
        visibility: validated.data.visibility as Visibility,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_BUNDLE',
        resource: 'bundle',
        resourceId: bundle.id,
        metadata: { name: bundle.name },
      },
    });

    revalidatePath('/dashboard/bundles');
    return {
      success: true,
      bundle: { id: bundle.id, name: bundle.name, slug: bundle.slug, description: bundle.description },
    };
  } catch (error) {
    console.error('Create bundle error:', error);
    return { success: false, error: 'Failed to create bundle' };
  }
}

export async function addSkillToBundle(
  bundleId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Check if already in bundle
  const existing = await prisma.bundleSkill.findUnique({
    where: { bundleId_skillId: { bundleId, skillId } },
  });

  if (existing) {
    return { success: false, error: 'Skill already in bundle' };
  }

  try {
    await prisma.bundleSkill.create({
      data: { bundleId, skillId },
    });

    revalidatePath(`/dashboard/bundles/${bundleId}`);
    return { success: true };
  } catch (error) {
    console.error('Add skill to bundle error:', error);
    return { success: false, error: 'Failed to add skill to bundle' };
  }
}

export async function removeSkillFromBundle(
  bundleId: string,
  skillId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.bundleSkill.delete({
      where: { bundleId_skillId: { bundleId, skillId } },
    });

    revalidatePath(`/dashboard/bundles/${bundleId}`);
    return { success: true };
  } catch (error) {
    console.error('Remove skill from bundle error:', error);
    return { success: false, error: 'Failed to remove skill from bundle' };
  }
}

export async function deleteBundle(bundleId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.skillBundle.delete({ where: { id: bundleId } });

    revalidatePath('/dashboard/bundles');
    return { success: true };
  } catch (error) {
    console.error('Delete bundle error:', error);
    return { success: false, error: 'Failed to delete bundle' };
  }
}

export async function getUserBundles() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  return prisma.skillBundle.findMany({
    where: {
      OR: [
        { visibility: 'PUBLIC' },
        { teamId: null },
      ],
    },
    include: {
      _count: { select: { skills: true } },
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBundleById(bundleId: string) {
  return prisma.skillBundle.findUnique({
    where: { id: bundleId },
    include: {
      skills: {
        include: {
          skill: {
            include: {
              author: { select: { id: true, name: true } },
              stats: true,
              versions: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
      },
      team: { select: { id: true, name: true } },
    },
  });
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}
