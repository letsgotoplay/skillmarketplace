import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStorageProvider } from '@/lib/storage/provider';
import JSZip from 'jszip';
import { incrementBundleDownloads } from '@/lib/bundles/analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  // Get bundle with skills
  const bundle = await prisma.skillBundle.findUnique({
    where: { id },
    include: {
      skills: {
        include: {
          skill: {
            include: {
              versions: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              team: { select: { id: true } },
            },
          },
        },
      },
      team: { select: { id: true } },
    },
  });

  if (!bundle) {
    return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });
  }

  // Check access
  if (bundle.visibility !== 'PUBLIC') {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is team member if bundle belongs to a team
    if (bundle.teamId) {
      const membership = await prisma.teamMember.findFirst({
        where: {
          teamId: bundle.teamId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
  }

  try {
    const bundleZip = new JSZip();
    const securityWarnings: string[] = [];
    const storage = getStorageProvider();

    // Add each skill to the bundle
    for (const bundleSkill of bundle.skills) {
      const skillVersion = bundleSkill.skill.versions[0];

      if (!skillVersion) continue;

      try {
        // Use storage provider to download skill file
        const buffer = await storage.download(skillVersion.filePath);
        const skillZip = await JSZip.loadAsync(buffer);

        // Create folder for each skill
        const skillFolder = bundleZip.folder(bundleSkill.skill.slug);
        if (!skillFolder) continue;

        // Add files from skill to bundle
        for (const [path, file] of Object.entries(skillZip.files)) {
          if (file.dir) {
            skillFolder.folder(path);
          } else {
            const content = await file.async('nodebuffer');
            skillFolder.file(path, content);
          }
        }

        // Check for security warnings
        const aiReport = skillVersion.aiSecurityReport as { riskLevel?: string } | null;
        if (aiReport?.riskLevel === 'critical' || aiReport?.riskLevel === 'high') {
          securityWarnings.push(`${bundleSkill.skill.name}: ${aiReport.riskLevel} risk`);
        }
      } catch (err) {
        console.error(`Failed to add skill ${bundleSkill.skill.id} to bundle:`, err);
      }
    }

    // Generate bundle zip
    const bundleBuffer = await bundleZip.generateAsync({ type: 'nodebuffer' });

    // Track bundle download
    await incrementBundleDownloads(bundle.id);

    // Track individual skill downloads
    for (const bundleSkill of bundle.skills) {
      await prisma.skillStat.update({
        where: { skillId: bundleSkill.skillId },
        data: {
          downloadsCount: { increment: 1 },
          lastDownloadedAt: new Date(),
        },
      });

      await prisma.downloadRecord.create({
        data: {
          skillId: bundleSkill.skillId,
          version: bundleSkill.skill.versions[0]?.version || 'unknown',
          downloadType: 'BUNDLE_ZIP',
          userId: session?.user?.id,
        },
      });
    }

    // Create audit log
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'DOWNLOAD_BUNDLE',
          resource: 'bundle',
          resourceId: bundle.id,
          metadata: { skillCount: bundle.skills.length },
        },
      });
    }

    // Create response with security headers
    const response = new NextResponse(new Uint8Array(bundleBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${bundle.slug}.zip"`,
        'X-Bundle-Skills': String(bundle.skills.length),
        'X-Security-Warnings': securityWarnings.length > 0 ? 'true' : 'false',
      },
    });

    if (securityWarnings.length > 0) {
      response.headers.set('X-Security-Warning-Details', securityWarnings.join('; '));
    }

    return response;
  } catch (error) {
    console.error('Bundle download error:', error);
    return NextResponse.json({ error: 'Failed to create bundle download' }, { status: 500 });
  }
}
