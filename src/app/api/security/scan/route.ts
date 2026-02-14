import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { scanSkill, storeSecurityScan, getSecurityScan } from '@/lib/security';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/db';

/**
 * @openapi
 * /security/scan:
 *   post:
 *     tags: [Security]
 *     summary: Trigger security scan
 *     description: Run a security scan on a skill version (owner only)
 *     security:
 *       - session: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - skillVersionId
 *             properties:
 *               skillVersionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Scan completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 report:
 *                   type: object
 *       400:
 *         description: Missing skillVersionId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Skill version not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   get:
 *     tags: [Security]
 *     summary: Get scan results
 *     description: Retrieve security scan results for a skill version
 *     parameters:
 *       - in: query
 *         name: skillVersionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Skill version ID
 *     responses:
 *       200:
 *         description: Scan results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 score:
 *                   type: integer
 *                 findings:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing skillVersionId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Scan not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { skillVersionId } = body;

    if (!skillVersionId) {
      return NextResponse.json(
        { error: 'skillVersionId is required' },
        { status: 400 }
      );
    }

    // Get skill version
    const skillVersion = await prisma.skillVersion.findUnique({
      where: { id: skillVersionId },
      include: { skill: true },
    });

    if (!skillVersion) {
      return NextResponse.json({ error: 'Skill version not found' }, { status: 404 });
    }

    // Check permission
    if (skillVersion.skill.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Read skill file
    const skillBuffer = await readFile(skillVersion.filePath);

    // Run security scan
    const report = await scanSkill(skillBuffer);

    // Store results
    await storeSecurityScan(skillVersionId, report);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Security scan error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Scan failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const skillVersionId = searchParams.get('skillVersionId');

  if (!skillVersionId) {
    return NextResponse.json(
      { error: 'skillVersionId is required' },
      { status: 400 }
    );
  }

  const scan = await getSecurityScan(skillVersionId);

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  return NextResponse.json(scan);
}
