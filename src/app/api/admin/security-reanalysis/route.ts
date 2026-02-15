import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { analyzeWithAI, type AIAnalysisConfig } from '@/lib/security/ai-analyzer';
import { getStorageProvider } from '@/lib/storage/provider';

// Schema for re-analysis request
const ReanalysisRequestSchema = z.object({
  scope: z.object({
    type: z.enum(['all', 'team', 'bundle', 'skills']),
    teamId: z.string().optional(),
    bundleId: z.string().optional(),
    skillIds: z.array(z.string()).optional(),
  }),
  configId: z.string().optional(),
});

interface ReanalysisResult {
  skillId: string;
  skillVersionId: string;
  skillName: string;
  status: 'success' | 'failed';
  riskLevel?: string;
  error?: string;
}

/**
 * POST /api/admin/security-reanalysis
 * Trigger re-analysis of existing skills
 */
export async function POST(request: NextRequest) {
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
    const validated = ReanalysisRequestSchema.parse(body);

    // Get the security config to use
    let configId = validated.configId;
    let securityConfig: {
      id: string;
      systemPrompt: string;
      rulesJson: unknown;
    } | null = null;

    if (configId) {
      securityConfig = await prisma.securityConfig.findUnique({
        where: { id: configId },
        select: { id: true, systemPrompt: true, rulesJson: true },
      });
    } else {
      securityConfig = await prisma.securityConfig.findFirst({
        where: { isActive: true },
        select: { id: true, systemPrompt: true, rulesJson: true },
      });
      configId = securityConfig?.id;
    }

    // Build AIAnalysisConfig from SecurityConfig
    const aiConfig: AIAnalysisConfig | undefined = securityConfig
      ? {
          systemPrompt: securityConfig.systemPrompt,
          rules: Array.isArray(securityConfig.rulesJson)
            ? securityConfig.rulesJson as AIAnalysisConfig['rules']
            : undefined,
        }
      : undefined;

    // Build query to get skill versions based on scope
    let skillVersions: Array<{
      id: string;
      skillId: string;
      filePath: string;
      skill: { name: string };
    }> = [];

    switch (validated.scope.type) {
      case 'all':
        skillVersions = await prisma.skillVersion.findMany({
          select: {
            id: true,
            skillId: true,
            filePath: true,
            skill: { select: { name: true } },
          },
        });
        break;

      case 'team':
        if (!validated.scope.teamId) {
          return NextResponse.json(
            { error: 'teamId is required for team scope' },
            { status: 400 }
          );
        }
        skillVersions = await prisma.skillVersion.findMany({
          where: {
            skill: { teamId: validated.scope.teamId },
          },
          select: {
            id: true,
            skillId: true,
            filePath: true,
            skill: { select: { name: true } },
          },
        });
        break;

      case 'bundle':
        if (!validated.scope.bundleId) {
          return NextResponse.json(
            { error: 'bundleId is required for bundle scope' },
            { status: 400 }
          );
        }
        skillVersions = await prisma.skillVersion.findMany({
          where: {
            skill: {
              bundleSkills: {
                some: { bundleId: validated.scope.bundleId },
              },
            },
          },
          select: {
            id: true,
            skillId: true,
            filePath: true,
            skill: { select: { name: true } },
          },
        });
        break;

      case 'skills':
        if (!validated.scope.skillIds?.length) {
          return NextResponse.json(
            { error: 'skillIds is required for skills scope' },
            { status: 400 }
          );
        }
        skillVersions = await prisma.skillVersion.findMany({
          where: {
            skillId: { in: validated.scope.skillIds },
          },
          select: {
            id: true,
            skillId: true,
            filePath: true,
            skill: { select: { name: true } },
          },
        });
        break;
    }

    if (skillVersions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No skills found matching the scope',
        processedCount: 0,
        failedCount: 0,
        results: [],
      });
    }

    // Process re-analysis (limit to first 50 to avoid timeout)
    const limit = 50;
    const toProcess = skillVersions.slice(0, limit);
    const results: ReanalysisResult[] = [];
    let processedCount = 0;
    let failedCount = 0;

    // Get storage provider for reading files
    const storage = getStorageProvider();

    for (const skillVersion of toProcess) {
      try {
        // Read the skill zip file using storage provider
        const buffer = await storage.download(skillVersion.filePath);

        // Run AI analysis with config
        const report = await analyzeWithAI(buffer, aiConfig);

        // Update the skill version with new report
        await prisma.skillVersion.update({
          where: { id: skillVersion.id },
          data: {
            aiSecurityAnalyzed: true,
            aiSecurityReport: JSON.parse(JSON.stringify(report)),
          },
        });

        results.push({
          skillId: skillVersion.skillId,
          skillVersionId: skillVersion.id,
          skillName: skillVersion.skill.name,
          status: 'success',
          riskLevel: report.riskLevel,
        });
        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          skillId: skillVersion.skillId,
          skillVersionId: skillVersion.id,
          skillName: skillVersion.skill.name,
          status: 'failed',
          error: errorMessage,
        });
        failedCount++;
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRIGGER_SECURITY_REANALYSIS',
        resource: 'SecurityReanalysis',
        metadata: {
          scope: validated.scope,
          totalSkills: skillVersions.length,
          processed: processedCount,
          failed: failedCount,
          configId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Re-analysis completed for ${processedCount} skills (${failedCount} failed)`,
      totalSkills: skillVersions.length,
      processedCount,
      failedCount,
      limited: skillVersions.length > limit,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error triggering re-analysis:', error);
    return NextResponse.json(
      { error: 'Failed to trigger re-analysis' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/security-reanalysis
 * Get list of skills that can be re-analyzed (preview count)
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'all' | 'team' | 'bundle' | 'skills' | null;
    const teamId = searchParams.get('teamId');
    const bundleId = searchParams.get('bundleId');
    const skillIds = searchParams.get('skillIds')?.split(',');

    let count = 0;

    switch (type) {
      case 'all':
        count = await prisma.skillVersion.count();
        break;

      case 'team':
        if (teamId) {
          count = await prisma.skillVersion.count({
            where: { skill: { teamId } },
          });
        }
        break;

      case 'bundle':
        if (bundleId) {
          count = await prisma.skillVersion.count({
            where: {
              skill: {
                bundleSkills: { some: { bundleId } },
              },
            },
          });
        }
        break;

      case 'skills':
        if (skillIds?.length) {
          count = await prisma.skillVersion.count({
            where: { skillId: { in: skillIds } },
          });
        }
        break;
    }

    return NextResponse.json({
      count,
      type: type || 'all',
    });
  } catch (error) {
    console.error('Error getting re-analysis preview:', error);
    return NextResponse.json(
      { error: 'Failed to get re-analysis preview' },
      { status: 500 }
    );
  }
}
