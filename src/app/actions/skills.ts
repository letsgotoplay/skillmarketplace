'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateSkill, parseSkillZip } from '@/lib/skills';
import { SkillStatus, Visibility, Category } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export interface UploadResult {
  success: boolean;
  skillId?: string;
  versionId?: string;
  error?: string;
  validationErrors?: string[];
  warnings?: string[];
}

export async function uploadSkill(formData: FormData): Promise<UploadResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const file = formData.get('file') as File;
  const visibility = (formData.get('visibility') as Visibility) || 'PUBLIC';
  const category = (formData.get('category') as Category) || 'DEVELOPMENT';
  const tagsString = formData.get('tags') as string | null;
  const tags = tagsString ? tagsString.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
  const teamId = formData.get('teamId') as string | null;
  const changelog = formData.get('changelog') as string | null;

  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  if (!file.name.endsWith('.zip')) {
    return { success: false, error: 'Only ZIP files are supported' };
  }

  try {
    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate the skill
    const validation = await validateSkill(buffer);

    if (!validation.valid) {
      return {
        success: false,
        validationErrors: validation.errors,
        warnings: validation.warnings,
      };
    }

    if (!validation.metadata) {
      return { success: false, error: 'Could not parse skill metadata' };
    }

    const { metadata } = validation;
    const slug = generateSlug(metadata.name);
    const version = metadata.version || '1.0.0';

    // Check if skill already exists
    let skill = await prisma.skill.findFirst({
      where: {
        slug,
        authorId: session.user.id,
      },
    });

    // Create or update skill
    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: metadata.name,
          slug,
          description: metadata.description,
          category,
          tags,
          authorId: session.user.id,
          teamId: teamId || null,
          visibility,
        },
      });
    }

    // Check if version already exists
    const existingVersion = await prisma.skillVersion.findFirst({
      where: {
        skillId: skill.id,
        version,
      },
    });

    if (existingVersion) {
      return { success: false, error: `Version ${version} already exists` };
    }

    // Save the file
    const uploadPath = path.join(UPLOAD_DIR, 'skills', skill.id);
    await mkdir(uploadPath, { recursive: true });
    const filePath = path.join(uploadPath, `${version}.zip`);
    await writeFile(filePath, buffer);

    // Parse skill to get file list
    const parsedSkill = await parseSkillZip(buffer);

    // Create skill version
    const skillVersion = await prisma.skillVersion.create({
      data: {
        skillId: skill.id,
        version,
        changelog: changelog || undefined,
        filePath,
        status: SkillStatus.APPROVED, // Auto-approve for now (will change with eval system)
        createdBy: session.user.id,
      },
    });

    // Create skill files records
    await prisma.skillFile.createMany({
      data: parsedSkill.files.map((f) => ({
        skillVersionId: skillVersion.id,
        filePath: f.path,
        fileType: f.type,
        sizeBytes: f.size,
      })),
    });

    // Create skill stats if not exists
    await prisma.skillStat.upsert({
      where: { skillId: skill.id },
      update: {},
      create: {
        skillId: skill.id,
        downloadsCount: 0,
        viewsCount: 0,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD_SKILL',
        resource: 'skill',
        resourceId: skill.id,
        metadata: { version, name: metadata.name },
      },
    });

    revalidatePath('/dashboard/skills');
    revalidatePath('/marketplace');

    return {
      success: true,
      skillId: skill.id,
      versionId: skillVersion.id,
      warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function getSkills(options?: {
  authorId?: string;
  teamId?: string;
  visibility?: Visibility;
  category?: Category;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (options?.authorId) {
    where.authorId = options.authorId;
  }

  if (options?.teamId) {
    where.teamId = options.teamId;
  }

  if (options?.visibility) {
    where.visibility = options.visibility;
  }

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.search) {
    const searchTerm = options.search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { description: { contains: searchTerm, mode: 'insensitive' } },
      { tags: { hasSome: [searchTerm.toLowerCase()] } },
    ];
  }

  const [skills, total] = await Promise.all([
    prisma.skill.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, email: true } },
        team: { select: { id: true, name: true, slug: true } },
        stats: true,
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    }),
    prisma.skill.count({ where }),
  ]);

  return { skills, total };
}

export async function getSkillById(skillId: string) {
  return prisma.skill.findUnique({
    where: { id: skillId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      team: { select: { id: true, name: true, slug: true } },
      stats: true,
      versions: {
        orderBy: { createdAt: 'desc' },
        include: {
          files: true,
          evals: {
            include: {
              results: true,
            },
          },
          scans: true,
        },
      },
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
