import { NextRequest, NextResponse } from 'next/server';
import { getSkillStatistics } from '@/lib/stats';
import { exportSkillStatisticsToCSV, generateFilename } from '@/lib/stats/export';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format');

    const stats = await getSkillStatistics();

    if (format === 'csv') {
      const csv = exportSkillStatisticsToCSV(stats);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${generateFilename('skill_statistics', 'csv')}"`,
        },
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch skill statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch skill statistics' },
      { status: 500 }
    );
  }
}
