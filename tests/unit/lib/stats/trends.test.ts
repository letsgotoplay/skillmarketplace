import { calculateTrend, calculateMovingAverage, calculateGrowthRate, formatTrend, fillMissingDates } from '@/lib/stats/trends';

describe('Trends Utilities', () => {
  describe('calculateTrend', () => {
    it('should calculate upward trend correctly', () => {
      const trend = calculateTrend(150, 100);
      expect(trend.current).toBe(150);
      expect(trend.previous).toBe(100);
      expect(trend.change).toBe(50);
      expect(trend.changePercent).toBe(50);
      expect(trend.trend).toBe('up');
    });

    it('should calculate downward trend correctly', () => {
      const trend = calculateTrend(50, 100);
      expect(trend.current).toBe(50);
      expect(trend.previous).toBe(100);
      expect(trend.change).toBe(-50);
      expect(trend.changePercent).toBe(-50);
      expect(trend.trend).toBe('down');
    });

    it('should identify stable trend when change is small', () => {
      const trend = calculateTrend(102, 100);
      expect(trend.changePercent).toBe(2);
      expect(trend.trend).toBe('stable');
    });

    it('should handle zero previous value', () => {
      const trend = calculateTrend(100, 0);
      expect(trend.changePercent).toBe(100);
      expect(trend.trend).toBe('up');
    });

    it('should handle both values being zero', () => {
      const trend = calculateTrend(0, 0);
      expect(trend.changePercent).toBe(0);
      expect(trend.trend).toBe('stable');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate 7-day moving average', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 20 },
        { date: '2024-01-03', value: 30 },
        { date: '2024-01-04', value: 40 },
        { date: '2024-01-05', value: 50 },
        { date: '2024-01-06', value: 60 },
        { date: '2024-01-07', value: 70 },
      ];

      const result = calculateMovingAverage(data, 7);
      expect(result).toHaveLength(7);
      // Last value should be average of all 7 values
      expect(result[6].value).toBe(40);
    });

    it('should return original data if less than window size', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 20 },
      ];

      const result = calculateMovingAverage(data, 7);
      expect(result).toEqual(data);
    });
  });

  describe('calculateGrowthRate', () => {
    it('should calculate positive growth rate', () => {
      const data = [
        { date: '2024-01-01', value: 100 },
        { date: '2024-01-02', value: 110 },
        { date: '2024-01-03', value: 121 },
      ];

      const growthRate = calculateGrowthRate(data);
      expect(growthRate).toBeGreaterThan(0);
    });

    it('should return 0 for insufficient data', () => {
      const data = [{ date: '2024-01-01', value: 100 }];
      expect(calculateGrowthRate(data)).toBe(0);
    });

    it('should return 0 when first value is 0', () => {
      const data = [
        { date: '2024-01-01', value: 0 },
        { date: '2024-01-02', value: 100 },
      ];
      expect(calculateGrowthRate(data)).toBe(0);
    });
  });

  describe('formatTrend', () => {
    it('should format upward trend', () => {
      const trend = { current: 150, previous: 100, change: 50, changePercent: 50, trend: 'up' as const };
      const formatted = formatTrend(trend);
      expect(formatted.label).toBe('+50%');
      expect(formatted.color).toBe('text-green-600');
      expect(formatted.icon).toBe('↑');
    });

    it('should format downward trend', () => {
      const trend = { current: 50, previous: 100, change: -50, changePercent: -50, trend: 'down' as const };
      const formatted = formatTrend(trend);
      expect(formatted.label).toBe('-50%');
      expect(formatted.color).toBe('text-red-600');
      expect(formatted.icon).toBe('↓');
    });

    it('should format stable trend', () => {
      const trend = { current: 100, previous: 100, change: 0, changePercent: 0, trend: 'stable' as const };
      const formatted = formatTrend(trend);
      expect(formatted.label).toBe('0%');
      expect(formatted.color).toBe('text-gray-600');
      expect(formatted.icon).toBe('→');
    });
  });

  describe('fillMissingDates', () => {
    it('should fill missing dates with zero values', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-03', value: 30 },
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      const result = fillMissingDates(data, startDate, endDate);
      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(0);
      expect(result[2].value).toBe(30);
    });

    it('should preserve existing values', () => {
      const data = [
        { date: '2024-01-01', value: 10 },
        { date: '2024-01-02', value: 20 },
        { date: '2024-01-03', value: 30 },
      ];

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03');

      const result = fillMissingDates(data, startDate, endDate);
      expect(result).toEqual(data);
    });
  });
});
