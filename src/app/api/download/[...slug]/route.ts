import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthUser } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage/provider';
import { recordContribution } from '@/lib/teams/contributions';
import JSZip from 'jszip';
import { DownloadType, ContributionType } from '@prisma/client';
import { isUUID } from '@/lib/slug';

type DownloadTypeParam = 'full' | 'md' | 'scripts';

// Helper to get user ID from either session or API token
async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const authUser = await getAuthUser(request);
  return session?.user?.id || authUser?.id || null;
}

// Helper to resolve skill identifier (UUID or fullSlug)
async function resolveSkill(identifier: string) {
  if (isUUID(identifier)) {
    return prisma.skill.findUnique({
      where: { id: identifier },
    });
  }
  return prisma.skill.findUnique({
    where: { fullSlug: identifier },
  });
}

/**
 * Get security info for a skill version
 */
async function getSecurityInfo(skillVersionId: string) {
  const version = await prisma.skillVersion.findUnique({
    where: { id: skillVersionId },
    include: {
      scans: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!version) {
    return { score: null, riskLevel: 'unknown' };
  }

  const patternScore = version.scans[0]?.score ?? null;
  const aiReport = version.aiSecurityReport as { riskLevel?: string } | null;
  const aiRiskLevel = aiReport?.riskLevel || 'unknown';

  let overallRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown' = 'unknown';

  if (patternScore !== null) {
    if (patternScore >= 90) {
      overallRiskLevel = 'low';
    } else if (patternScore >= 70) {
      overallRiskLevel = 'medium';
    } else if (patternScore >= 50) {
      overallRiskLevel = 'high';
    } else {
      overallRiskLevel = 'critical';
    }
  }

  const riskOrder = { low: 1, medium: 2, high: 3, critical: 4, unknown: 0 };
  if (riskOrder[aiRiskLevel as keyof typeof riskOrder] > riskOrder[overallRiskLevel]) {
    overallRiskLevel = aiRiskLevel as typeof overallRiskLevel;
  }

  return {
    score: patternScore,
    riskLevel: overallRiskLevel,
    aiRiskLevel,
  };
}

/**
 * Track download in database
 */
async function trackDownload(
  skillId: string,
  version: string,
  downloadType: DownloadType,
  userId?: string
) {
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  const recentDownload = await prisma.downloadRecord.findFirst({
    where: {
      skillId,
      downloadType,
      userId: userId || null,
      createdAt: { gte: fiveSecondsAgo },
    },
  });

  if (recentDownload) {
    console.log(`[Download] Skipping duplicate count for skill ${skillId}`);
    return;
  }

  await prisma.$transaction([
    prisma.skillStat.update({
      where: { skillId },
      data: {
        downloadsCount: { increment: 1 },
        lastDownloadedAt: new Date(),
      },
    }),
    prisma.downloadRecord.create({
      data: {
        skillId,
        version,
        downloadType,
        userId,
      },
    }),
  ]);
}

/**
 * Download SKILL.md only
 */
async function downloadSkillMd(fileBuffer: Buffer): Promise<NextResponse> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const skillMd = zip.file('SKILL.md');

  if (!skillMd) {
    return NextResponse.json({ error: 'SKILL.md not found in skill package' }, { status: 404 });
  }

  const content = await skillMd.async('string');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="SKILL.md"`,
    },
  });
}

/**
 * Download scripts only
 */
async function downloadScriptsZip(
  fileBuffer: Buffer,
  skillSlug: string
): Promise<NextResponse> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const scriptsZip = new JSZip();

  const scriptExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.sh'];
  let scriptCount = 0;

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir) continue;

    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (scriptExtensions.includes(ext)) {
      const content = await file.async('nodebuffer');
      scriptsZip.file(path, content);
      scriptCount++;
    }
  }

  if (scriptCount === 0) {
    return NextResponse.json({ error: 'No script files found in skill package' }, { status: 404 });
  }

  const scriptsBuffer = await scriptsZip.generateAsync({ type: 'nodebuffer' });

  return new NextResponse(new Uint8Array(scriptsBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${skillSlug}-scripts.zip"`,
    },
  });
}

/**
 * Download full ZIP
 */
async function downloadFullZip(
  fileBuffer: Buffer,
  skillSlug: string,
  version: string
): Promise<NextResponse> {
  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${skillSlug}-${version}.zip"`,
    },
  });
}

/**
 * @openapi
 * /download/{id}:
 *   get:
 *     tags: [Skills]
 *     summary: Download a skill
 *     description: Download skill files in various formats. Supports both UUID and fullSlug.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug (e.g., alice/pdf-reader)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, md, scripts]
 *           default: full
 *         description: Download type
 *       - in: query
 *         name: version
 *         schema:
 *           type: string
 *         description: Specific version to download (defaults to latest)
 *     responses:
 *       200:
 *         description: Skill file download
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Skill or version not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const identifier = slug.join('/');
  const userId = await getUserId(request);

  const { searchParams } = new URL(request.url);
  const version = searchParams.get('version');
  const type = (searchParams.get('type') || 'full') as DownloadTypeParam;

  if (!['full', 'md', 'scripts'].includes(type)) {
    return NextResponse.json({ error: 'Invalid download type. Use: full, md, or scripts' }, { status: 400 });
  }

  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  const skillWithVersions = await prisma.skill.findUnique({
    where: { id: skill.id },
    include: {
      versions: version
        ? { where: { version } }
        : { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  if (!skillWithVersions || skillWithVersions.versions.length === 0) {
    return NextResponse.json({ error: 'Skill or version not found' }, { status: 404 });
  }

  // Check access
  if (skillWithVersions.visibility !== 'PUBLIC') {
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (skillWithVersions.authorId !== userId && skillWithVersions.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: skillWithVersions.teamId,
          userId: userId,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
  }

  const skillVersion = skillWithVersions.versions[0];

  try {
    const storage = getStorageProvider();
    const fileBuffer = await storage.download(skillVersion.filePath);

    const securityInfo = await getSecurityInfo(skillVersion.id);

    const downloadTypeMap: Record<DownloadTypeParam, DownloadType> = {
      full: 'FULL_ZIP',
      md: 'SKILL_MD',
      scripts: 'SCRIPTS_ZIP',
    };

    await trackDownload(skillWithVersions.id, skillVersion.version, downloadTypeMap[type], userId || undefined);

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId: userId,
          action: 'DOWNLOAD_SKILL',
          resource: 'skill',
          resourceId: skillWithVersions.id,
          metadata: { version: skillVersion.version, type },
        },
      });

      if (skillWithVersions.teamId) {
        const membership = await prisma.teamMember.findFirst({
          where: {
            teamId: skillWithVersions.teamId,
            userId: userId,
          },
        });

        if (membership) {
          await recordContribution(
            skillWithVersions.teamId,
            userId,
            ContributionType.SKILL_DOWNLOADED,
            skillWithVersions.id
          );
        }
      }
    }

    let response: NextResponse;

    switch (type) {
      case 'md':
        response = await downloadSkillMd(fileBuffer);
        break;
      case 'scripts':
        response = await downloadScriptsZip(fileBuffer, skillWithVersions.slug);
        break;
      case 'full':
      default:
        response = await downloadFullZip(fileBuffer, skillWithVersions.slug, skillVersion.version);
        break;
    }

    response.headers.set('X-Security-Score', String(securityInfo.score ?? 'unknown'));
    response.headers.set('X-Security-Risk-Level', securityInfo.riskLevel);
    response.headers.set(
      'X-Security-Warning',
      securityInfo.riskLevel === 'critical' || securityInfo.riskLevel === 'high' ? 'true' : 'false'
    );

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to read skill file' }, { status: 500 });
  }
}
