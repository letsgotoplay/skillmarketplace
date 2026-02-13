import { toCSV, exportSkillStatisticsToCSV, exportUserStatisticsToCSV, generateFilename } from '@/lib/stats/export';
import { SkillStatistics, UserStatistics } from '@/lib/stats/aggregation';

describe('Export Utilities', () => {
  describe('toCSV', () => {
    it('should convert array of objects to CSV string', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];

      const csv = toCSV(data);
      expect(csv).toContain('name,age');
      expect(csv).toContain('Alice,30');
      expect(csv).toContain('Bob,25');
    });

    it('should handle custom headers', () => {
      const data = [{ a: 1, b: 2 }];
      const csv = toCSV(data, ['b', 'a']);
      expect(csv.startsWith('b,a')).toBe(true);
    });

    it('should escape commas in values', () => {
      const data = [{ name: 'John, Doe', value: 100 }];
      const csv = toCSV(data);
      expect(csv).toContain('"John, Doe"');
    });

    it('should escape quotes in values', () => {
      const data = [{ name: 'John "The Rock" Doe', value: 100 }];
      const csv = toCSV(data);
      expect(csv).toContain('"John ""The Rock"" Doe"');
    });

    it('should handle null and undefined values', () => {
      const data = [{ name: 'Test', value: null, other: undefined }];
      const csv = toCSV(data);
      expect(csv).toContain('Test,,');
    });

    it('should return empty string for empty array', () => {
      expect(toCSV([])).toBe('');
    });
  });

  describe('exportSkillStatisticsToCSV', () => {
    it('should export skill statistics to CSV', () => {
      const stats: SkillStatistics = {
        totalSkills: 100,
        totalVersions: 250,
        publicSkills: 80,
        teamSkills: 15,
        privateSkills: 5,
        avgDownloadsPerSkill: 50,
        avgViewsPerSkill: 200,
        topDownloadedSkills: [
          { id: '1', name: 'Skill 1', slug: 'skill-1', count: 1000 },
          { id: '2', name: 'Skill 2', slug: 'skill-2', count: 500 },
        ],
        topViewedSkills: [
          { id: '1', name: 'Skill 1', slug: 'skill-1', count: 5000 },
        ],
      };

      const csv = exportSkillStatisticsToCSV(stats);
      expect(csv).toContain('Total Skills,100');
      expect(csv).toContain('Total Versions,250');
      expect(csv).toContain('Top Downloaded Skills');
      expect(csv).toContain('Skill 1');
    });
  });

  describe('exportUserStatisticsToCSV', () => {
    it('should export user statistics to CSV', () => {
      const stats: UserStatistics = {
        totalUsers: 500,
        activeUsers: 300,
        newUsersThisMonth: 50,
        usersByRole: {
          USER: 450,
          TEAM_ADMIN: 40,
          ADMIN: 10,
        },
      };

      const csv = exportUserStatisticsToCSV(stats);
      expect(csv).toContain('Total Users,500');
      expect(csv).toContain('Active Users (30d),300');
      expect(csv).toContain('Users by Role');
      expect(csv).toContain('USER,450');
    });
  });

  describe('generateFilename', () => {
    it('should generate filename with current date', () => {
      const filename = generateFilename('report', 'csv');
      const today = new Date().toISOString().split('T')[0];
      expect(filename).toBe(`report_${today}.csv`);
    });

    it('should support json format', () => {
      const filename = generateFilename('data', 'json');
      expect(filename.endsWith('.json')).toBe(true);
    });
  });
});
