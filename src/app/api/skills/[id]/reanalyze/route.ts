import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyzeWithAI, type AIAnalysisConfig } from '@/lib/security/ai-analyzer';
import { getStorageProvider } from '@/lib/storage/provider';

/**
 * POST /api/skills/[id]/reanalyze
 * Re-run AI security analysis for a specific skill
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: skillId } = await params;

    // Get the latest skill version
    const skillVersion = await prisma.skillVersion.findFirst({
      where: { skillId },
      orderBy: { createdAt: 'desc' },
      include: {
        skill: {
          select: { name: true, authorId: true },
        },
      },
    });

    if (!skillVersion) {
      return NextResponse.json({ error: 'Skill version not found' }, { status: 404 });
    }

    // Check if user owns the skill or is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (skillVersion.skill.authorId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the active security config
    const securityConfig = await prisma.securityConfig.findFirst({
      where: { isActive: true },
      select: { id: true, systemPrompt: true, rulesJson: true },
    });

    // Build AIAnalysisConfig from SecurityConfig
    const aiConfig: AIAnalysisConfig | undefined = securityConfig
      ? {
          systemPrompt: securityConfig.systemPrompt,
          rules: Array.isArray(securityConfig.rulesJson)
            ? securityConfig.rulesJson as AIAnalysisConfig['rules']
            : undefined,
        }
      : undefined;

    // Read the skill zip file using storage provider
    const storage = getStorageProvider();
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

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'REANALYZE_SKILL',
        resource: 'SkillVersion',
        resourceId: skillVersion.id,
        metadata: {
          skillId,
          riskLevel: report.riskLevel,
          threatsCount: report.threats.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Re-analysis completed',
      report: {
        riskLevel: report.riskLevel,
        threatsCount: report.threats.length,
        confidence: report.confidence,
        analyzedAt: report.analyzedAt,
      },
    });
  } catch (error) {
    console.error('Error re-analyzing skill:', error);
    return NextResponse.json(
      { error: 'Failed to re-analyze skill' },
      { status: 500 }
    );
  }
}
