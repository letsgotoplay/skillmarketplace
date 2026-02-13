import { NextRequest, NextResponse } from 'next/server';
import { getKeyMetricsTrends } from '@/lib/stats';
import { exportTrendToCSV, generateFilename } from '@/lib/stats/export';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') ?? '30', 10);
    const format = searchParams.get('format');

    const trends = await getKeyMetricsTrends(days);

    if (format === 'csv') {
      // Export all trends as a combined CSV
      const csv = Object.entries(trends)
        .map(([, data]) => exportTrendToCSV(data))
        .join('\n\n---\n\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${generateFilename('trends_report', 'csv')}"`,
        },
      });
    }

    return NextResponse.json(trends);
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 }
    );
  }
}
