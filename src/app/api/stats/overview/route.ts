import { NextRequest, NextResponse } from 'next/server';
import { getOverviewStatistics } from '@/lib/stats';
import { exportOverviewToCSV, generateFilename } from '@/lib/stats/export';

/**
 * @openapi
 * /stats/overview:
 *   get:
 *     tags: [Statistics]
 *     summary: Get overview statistics
 *     description: Get overall marketplace statistics including totals by category, downloads, and security scores
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Output format (defaults to JSON)
 *     responses:
 *       200:
 *         description: Overview statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OverviewStats'
 *           text/csv:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to fetch statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');

    const stats = await getOverviewStatistics();

    if (format === 'csv') {
      const csv = exportOverviewToCSV(stats);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${generateFilename('statistics_report', 'csv')}"`,
        },
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch overview statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
