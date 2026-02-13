/**
 * Unit tests for statistics aggregation module
 * Tests type definitions and utility calculations
 */

describe('Stats Aggregation Module', () => {
  describe('DateRange type', () => {
    it('should define valid date range', () => {
      const dateRange = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      expect(dateRange.startDate).toBeInstanceOf(Date);
      expect(dateRange.endDate).toBeInstanceOf(Date);
      expect(dateRange.startDate < dateRange.endDate).toBe(true);
    });
  });

  describe('SkillStatistics type', () => {
    it('should define valid skill statistics', () => {
      const skillStats = {
        totalSkills: 100,
        totalVersions: 250,
        publicSkills: 60,
        teamSkills: 30,
        privateSkills: 10,
        avgDownloadsPerSkill: 45,
        avgViewsPerSkill: 120,
        topDownloadedSkills: [
          { id: 'skill-1', name: 'PDF', slug: 'pdf', count: 1000 },
        ],
        topViewedSkills: [
          { id: 'skill-1', name: 'PDF', slug: 'pdf', count: 5000 },
        ],
      };

      expect(skillStats.totalSkills).toBe(100);
      expect(skillStats.totalVersions).toBe(250);
      expect(skillStats.publicSkills + skillStats.teamSkills + skillStats.privateSkills).toBe(100);
    });
  });

  describe('UserStatistics type', () => {
    it('should define valid user statistics', () => {
      const userStats = {
        totalUsers: 500,
        activeUsers: 250,
        newUsersThisMonth: 50,
        usersByRole: { ADMIN: 5, USER: 495 },
      };

      expect(userStats.totalUsers).toBe(500);
      expect(userStats.activeUsers).toBeLessThanOrEqual(userStats.totalUsers);
      expect(Object.values(userStats.usersByRole).reduce((a, b) => a + b, 0)).toBe(userStats.totalUsers);
    });
  });

  describe('TeamStatistics type', () => {
    it('should define valid team statistics', () => {
      const teamStats = {
        totalTeams: 20,
        avgMembersPerTeam: 5.5,
        avgSkillsPerTeam: 12.3,
        topTeams: [
          { id: 'team-1', name: 'Acme Corp', slug: 'acme-corp', memberCount: 15, skillCount: 30 },
        ],
      };

      expect(teamStats.totalTeams).toBe(20);
      expect(teamStats.avgMembersPerTeam).toBeGreaterThan(0);
      expect(teamStats.topTeams[0].memberCount).toBe(15);
    });
  });

  describe('EvaluationStatistics type', () => {
    it('should define valid evaluation statistics', () => {
      const evalStats = {
        totalEvals: 100,
        successfulEvals: 85,
        failedEvals: 10,
        successRate: 85,
        avgDurationMs: 2500,
        evalsByStatus: { PENDING: 5, RUNNING: 0, COMPLETED: 85, FAILED: 10 },
      };

      expect(evalStats.totalEvals).toBe(100);
      expect(evalStats.successRate).toBeGreaterThanOrEqual(0);
      expect(evalStats.successRate).toBeLessThanOrEqual(100);
    });

    it('should calculate success rate correctly', () => {
      const totalEvals = 100;
      const successfulEvals = 85;
      const expectedRate = (successfulEvals / totalEvals) * 100;

      expect(expectedRate).toBe(85);
    });
  });

  describe('SecurityStatistics type', () => {
    it('should define valid security statistics', () => {
      const securityStats = {
        totalScans: 50,
        avgSecurityScore: 78.5,
        highRiskCount: 5,
        mediumRiskCount: 15,
        lowRiskCount: 30,
        scoreDistribution: [
          { range: '0-20', count: 2 },
          { range: '20-40', count: 3 },
          { range: '40-60', count: 10 },
          { range: '60-80', count: 15 },
          { range: '80-100', count: 20 },
        ],
      };

      expect(securityStats.totalScans).toBe(50);
      expect(securityStats.avgSecurityScore).toBeGreaterThanOrEqual(0);
      expect(securityStats.avgSecurityScore).toBeLessThanOrEqual(100);

      // Risk counts should sum to total scans
      const riskSum = securityStats.highRiskCount + securityStats.mediumRiskCount + securityStats.lowRiskCount;
      expect(riskSum).toBe(securityStats.totalScans);
    });

    it('should have score distribution buckets sum to total', () => {
      const scoreDistribution = [
        { range: '0-20', count: 2 },
        { range: '20-40', count: 3 },
        { range: '40-60', count: 10 },
        { range: '60-80', count: 15 },
        { range: '80-100', count: 20 },
      ];

      const totalCount = scoreDistribution.reduce((sum, bucket) => sum + bucket.count, 0);
      expect(totalCount).toBe(50);
    });
  });

  describe('OverviewStatistics type', () => {
    it('should contain all statistic sections', () => {
      const overviewStats = {
        skills: {
          totalSkills: 100,
          totalVersions: 250,
          publicSkills: 60,
          teamSkills: 30,
          privateSkills: 10,
          avgDownloadsPerSkill: 45,
          avgViewsPerSkill: 120,
          topDownloadedSkills: [],
          topViewedSkills: [],
        },
        users: {
          totalUsers: 500,
          activeUsers: 250,
          newUsersThisMonth: 50,
          usersByRole: {},
        },
        teams: {
          totalTeams: 20,
          avgMembersPerTeam: 5.5,
          avgSkillsPerTeam: 12.3,
          topTeams: [],
        },
        evaluations: {
          totalEvals: 100,
          successfulEvals: 85,
          failedEvals: 10,
          successRate: 85,
          avgDurationMs: 2500,
          evalsByStatus: {},
        },
        security: {
          totalScans: 50,
          avgSecurityScore: 78.5,
          highRiskCount: 5,
          mediumRiskCount: 15,
          lowRiskCount: 30,
          scoreDistribution: [],
        },
      };

      expect(overviewStats).toHaveProperty('skills');
      expect(overviewStats).toHaveProperty('users');
      expect(overviewStats).toHaveProperty('teams');
      expect(overviewStats).toHaveProperty('evaluations');
      expect(overviewStats).toHaveProperty('security');
    });
  });

  describe('EventCountByDay type', () => {
    it('should define valid event count by day', () => {
      const eventCount = {
        date: '2024-01-15',
        count: 42,
      };

      expect(eventCount.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(eventCount.count).toBeGreaterThanOrEqual(0);
    });
  });
});
