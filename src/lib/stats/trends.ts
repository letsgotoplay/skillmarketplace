/**
 * Trend Calculation Utilities
 * Calculates trends and comparisons for analytics
 */

import { EventType } from './events';
import { DateRange, getEventCountsByDay } from './aggregation';

// Trend types
export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PeriodComparison {
  period: string;
  data: TrendData;
}

export interface SkillTrendData {
  skillId: string;
  skillName: string;
  downloads: TrendData;
  views: TrendData;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface TrendChartData {
  label: string;
  data: ChartDataPoint[];
  trend: TrendData;
}

/**
 * Calculate trend from current and previous values
 */
export function calculateTrend(current: number, previous: number): TrendData {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : current > 0 ? 100 : 0;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) > 5) {
    trend = change > 0 ? 'up' : 'down';
  }

  return {
    current,
    previous,
    change,
    changePercent: Math.round(changePercent * 10) / 10,
    trend,
  };
}

/**
 * Get date ranges for comparison (current vs previous period)
 */
export function getComparisonPeriods(days: number = 30): {
  current: DateRange;
  previous: DateRange;
} {
  const now = new Date();
  const currentEnd = new Date(now);
  const currentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousEnd = new Date(currentStart.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    current: { startDate: currentStart, endDate: currentEnd },
    previous: { startDate: previousStart, endDate: previousEnd },
  };
}

/**
 * Get event trend for a specific event type
 */
export async function getEventTrend(
  eventType: EventType,
  days: number = 30
): Promise<TrendChartData> {
  const periods = getComparisonPeriods(days);

  const [currentData, previousData] = await Promise.all([
    getEventCountsByDay(eventType, periods.current),
    getEventCountsByDay(eventType, periods.previous),
  ]);

  const currentTotal = currentData.reduce((sum, d) => sum + d.count, 0);
  const previousTotal = previousData.reduce((sum, d) => sum + d.count, 0);

  return {
    label: eventType,
    data: currentData.map((d) => ({ date: d.date, value: d.count })),
    trend: calculateTrend(currentTotal, previousTotal),
  };
}

/**
 * Calculate moving average for a data series
 */
export function calculateMovingAverage(
  data: ChartDataPoint[],
  windowSize: number = 7
): ChartDataPoint[] {
  if (data.length < windowSize) {
    return data;
  }

  const result: ChartDataPoint[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length;

    result.push({
      date: data[i].date,
      value: Math.round(avg * 100) / 100,
    });
  }

  return result;
}

/**
 * Calculate growth rate (compound daily growth rate)
 */
export function calculateGrowthRate(data: ChartDataPoint[]): number {
  if (data.length < 2) return 0;

  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;

  if (firstValue <= 0) return 0;

  const days = data.length - 1;
  const cagr = Math.pow(lastValue / firstValue, 1 / days) - 1;

  return Math.round(cagr * 10000) / 100; // Return as percentage
}

/**
 * Get weekly comparison
 */
export function getWeeklyPeriods(): {
  current: DateRange;
  previous: DateRange;
} {
  return getComparisonPeriods(7);
}

/**
 * Get monthly comparison
 */
export function getMonthlyPeriods(): {
  current: DateRange;
  previous: DateRange;
} {
  return getComparisonPeriods(30);
}

/**
 * Get quarterly comparison
 */
export function getQuarterlyPeriods(): {
  current: DateRange;
  previous: DateRange;
} {
  return getComparisonPeriods(90);
}

/**
 * Format trend data for display
 */
export function formatTrend(trend: TrendData): {
  label: string;
  color: string;
  icon: string;
} {
  if (trend.trend === 'up') {
    return {
      label: `+${trend.changePercent}%`,
      color: 'text-green-600',
      icon: '↑',
    };
  } else if (trend.trend === 'down') {
    return {
      label: `${trend.changePercent}%`,
      color: 'text-red-600',
      icon: '↓',
    };
  }
  return {
    label: '0%',
    color: 'text-gray-600',
    icon: '→',
  };
}

/**
 * Fill missing dates in a date range with zero values
 */
export function fillMissingDates(
  data: ChartDataPoint[],
  startDate: Date,
  endDate: Date
): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  const dataMap = new Map(data.map((d) => [d.date, d.value]));

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      value: dataMap.get(dateStr) ?? 0,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

/**
 * Get all key metrics trends
 */
export async function getKeyMetricsTrends(days: number = 30): Promise<{
  downloads: TrendChartData;
  views: TrendChartData;
  uploads: TrendChartData;
  evaluations: TrendChartData;
}> {
  const [downloads, views, uploads, evaluations] = await Promise.all([
    getEventTrend(EventType.SKILL_DOWNLOADED, days),
    getEventTrend(EventType.SKILL_VIEWED, days),
    getEventTrend(EventType.SKILL_UPLOADED, days),
    getEventTrend(EventType.EVAL_COMPLETED, days),
  ]);

  return { downloads, views, uploads, evaluations };
}
