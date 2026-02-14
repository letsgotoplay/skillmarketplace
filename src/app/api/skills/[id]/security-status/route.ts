import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * @openapi
 * /skills/{id}/security-status:
 *   get:
 *     tags: [Security]
 *     summary: Get security status
 *     description: Get security analysis results for a skill including pattern scan and AI analysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Skill ID
 *     responses:
 *       200:
 *         description: Security status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SecurityStatus'
 *       404:
 *         description: Skill not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Get the latest version with security info
  const skill = await prisma.skill.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          scans: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!skill || skill.versions.length === 0) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  const version = skill.versions[0];
  const scan = version.scans[0];

  // Get AI security report
  const aiReport = version.aiSecurityReport as {
    riskLevel?: string;
    threats?: Array<{
      type: string;
      description: string;
      severity: string;
      file?: string;
      remediation: string;
    }>;
    recommendations?: string[];
    confidence?: number;
  } | null;

  // Calculate overall status
  const patternScore = scan?.score ?? null;
  const aiRiskLevel = aiReport?.riskLevel || 'unknown';
  const processingComplete = version.processingComplete;

  // Determine if warning should be shown
  let shouldWarn = false;
  let warningReason: string[] = [];

  if (patternScore !== null && patternScore < 70) {
    shouldWarn = true;
    warningReason.push(`Low security score: ${patternScore}/100`);
  }

  if (aiRiskLevel === 'critical' || aiRiskLevel === 'high') {
    shouldWarn = true;
    warningReason.push(`AI detected ${aiRiskLevel} risk level`);
  }

  return NextResponse.json({
    skillId: skill.id,
    version: version.version,
    processingComplete,
    specification: {
      passed: version.specValidationPassed,
      errors: version.specValidationErrors,
    },
    patternScan: scan
      ? {
          score: scan.score,
          status: scan.status,
          completedAt: scan.completedAt,
          report: scan.reportJson,
        }
      : null,
    aiAnalysis: aiReport
      ? {
          riskLevel: aiReport.riskLevel,
          threats: aiReport.threats,
          recommendations: aiReport.recommendations,
          confidence: aiReport.confidence,
          analyzedAt: version.aiSecurityAnalyzed,
        }
      : null,
    warning: {
      shouldWarn,
      reasons: warningReason,
    },
  });
}
