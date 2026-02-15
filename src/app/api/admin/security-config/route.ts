import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import {
  DEFAULT_SECURITY_RULES,
  buildSystemPrompt,
} from '@/lib/security/prompts';

// Schema for updating security config
const SecurityConfigSchema = z.object({
  name: z.string().min(1).max(100),
  systemPrompt: z.string().min(1),
  rulesJson: z.array(z.object({
    id: z.string(),
    category: z.string(),
    name: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    appliesTo: z.array(z.enum(['md', 'scripts'])),
    checkDescription: z.string(),
    harmDescription: z.string(),
  })),
  outputFormat: z.string().min(1),
});

/**
 * GET /api/admin/security-config
 * Get the active security configuration
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get active security config
    let config = await prisma.securityConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // If no config exists, create default from prompts.ts
    if (!config) {
      // Use unique name with timestamp to avoid conflicts
      const uniqueName = `default-${Date.now()}`;
      config = await prisma.securityConfig.create({
        data: {
          name: uniqueName,
          version: '1.0.0',
          systemPrompt: buildSystemPrompt(),
          rulesJson: JSON.parse(JSON.stringify(DEFAULT_SECURITY_RULES)),
          outputFormat: JSON.stringify({
            riskLevel: 'critical | high | medium | low',
            findings: [],
            summary: 'string',
            recommendations: ['string'],
            confidence: 'number',
          }),
          isActive: true,
        },
      });
    }

    // Also get all versions for history
    const allVersions = await prisma.securityConfig.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        version: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      config: {
        id: config.id,
        name: config.name,
        version: config.version,
        systemPrompt: config.systemPrompt,
        rulesJson: config.rulesJson,
        outputFormat: config.outputFormat,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      },
      versions: allVersions,
    });
  } catch (error) {
    console.error('Error fetching security config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security config' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/security-config
 * Create a new version of security configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const validated = SecurityConfigSchema.parse(body);

    // Get current active config to increment version
    const currentConfig = await prisma.securityConfig.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate new version
    let newVersion = '1.0.0';
    if (currentConfig?.version) {
      const parts = currentConfig.version.split('.');
      const patch = parseInt(parts[2] || '0') + 1;
      newVersion = `${parts[0]}.${parts[1]}.${patch}`;
    }

    // Deactivate all existing configs
    await prisma.securityConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new config
    const newConfig = await prisma.securityConfig.create({
      data: {
        name: validated.name,
        version: newVersion,
        systemPrompt: validated.systemPrompt,
        rulesJson: JSON.parse(JSON.stringify(validated.rulesJson)),
        outputFormat: validated.outputFormat,
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_SECURITY_CONFIG',
        resource: 'SecurityConfig',
        resourceId: newConfig.id,
        metadata: {
          version: newVersion,
          rulesCount: validated.rulesJson.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      config: newConfig,
      message: `Security config version ${newVersion} created and activated`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating security config:', error);
    return NextResponse.json(
      { error: 'Failed to update security config' },
      { status: 500 }
    );
  }
}
