import { NextRequest, NextResponse } from 'next/server';
import { getOverviewStatistics } from '@/lib/stats';
import { exportOverviewToCSV, generateFilename } from '@/lib/stats/export';

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
