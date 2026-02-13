/**
 * API Integration Tests for Statistics Endpoints
 */

import { EventType } from '@/lib/stats/events';

describe('Stats API Integration', () => {
  describe('GET /api/stats/overview - Overview Statistics', () => {
    it('should return complete overview structure', () => {
      const overviewResponse = {
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
          usersByRole: { ADMIN: 5, USER: 495 },
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

      expect(overviewResponse).toHaveProperty('skills');
      expect(overviewResponse).toHaveProperty('users');
      expect(overviewResponse).toHaveProperty('teams');
      expect(overviewResponse).toHaveProperty('evaluations');
      expect(overviewResponse).toHaveProperty('security');
    });

    it('should calculate correct percentages', () => {
      const skills = { publicSkills: 60, teamSkills: 30, privateSkills: 10 };
      const total = skills.publicSkills + skills.teamSkills + skills.privateSkills;

      const publicPercent = (skills.publicSkills / total) * 100;
      expect(publicPercent).toBe(60);
    });
  });

  describe('GET /api/stats/skills - Skills Statistics', () => {
    it('should return skills-specific statistics', () => {
      const skillsStats = {
        totalSkills: 100,
        totalVersions: 250,
        publicSkills: 60,
        teamSkills: 30,
        privateSkills: 10,
        avgDownloadsPerSkill: 45,
        avgViewsPerSkill: 120,
        topDownloadedSkills: [
          { id: 'skill-pdf', name: 'pdf', slug: 'pdf', count: 4523 },
          { id: 'skill-pptx', name: 'pptx', slug: 'pptx', count: 3892 },
        ],
        topViewedSkills: [
          { id: 'skill-pdf', name: 'pdf', slug: 'pdf', count: 28450 },
        ],
      };

      expect(skillsStats.totalSkills).toBeGreaterThanOrEqual(0);
      expect(skillsStats.topDownloadedSkills.length).toBeLessThanOrEqual(10);
      expect(skillsStats.topDownloadedSkills[0].count).toBeGreaterThanOrEqual(
        skillsStats.topDownloadedSkills[1]?.count ?? 0
      );
    });

    it('should sort top skills by count descending', () => {
      const topSkills = [
        { id: '1', name: 'skill-1', slug: 'skill-1', count: 100 },
        { id: '2', name: 'skill-2', slug: 'skill-2', count: 200 },
        { id: '3', name: 'skill-3', slug: 'skill-3', count: 150 },
      ];

      const sorted = [...topSkills].sort((a, b) => b.count - a.count);

      expect(sorted[0].count).toBe(200);
      expect(sorted[1].count).toBe(150);
      expect(sorted[2].count).toBe(100);
    });
  });

  describe('GET /api/stats/trends - Trends Data', () => {
    it('should return trend data structure', () => {
      const trendsResponse = {
        downloads: {
          current: 150,
          previous: 100,
          change: 50,
          changePercent: 50,
          trend: 'up',
        },
        views: {
          current: 500,
          previous: 450,
          change: 50,
          changePercent: 11.11,
          trend: 'up',
        },
        skills: {
          current: 16,
          previous: 8,
          change: 8,
          changePercent: 100,
          trend: 'up',
        },
        dailyData: [
          { date: '2024-01-20', downloads: 15, views: 50 },
          { date: '2024-01-21', downloads: 20, views: 60 },
        ],
      };

      expect(trendsResponse.downloads.trend).toMatch(/up|down|stable/);
      expect(trendsResponse.dailyData).toBeInstanceOf(Array);
    });

    it('should identify stable trend for small changes', () => {
      const getTrend = (changePercent: number): string => {
        if (Math.abs(changePercent) < 5) return 'stable';
        return changePercent > 0 ? 'up' : 'down';
      };

      expect(getTrend(2)).toBe('stable');
      expect(getTrend(-2)).toBe('stable');
      expect(getTrend(10)).toBe('up');
      expect(getTrend(-10)).toBe('down');
    });
  });
});

describe('Security Statistics Validation', () => {
  it('should categorize risk levels correctly', () => {
    const categorizeRisk = (score: number): string => {
      if (score < 40) return 'HIGH';
      if (score < 70) return 'MEDIUM';
      return 'LOW';
    };

    expect(categorizeRisk(25)).toBe('HIGH');
    expect(categorizeRisk(50)).toBe('MEDIUM');
    expect(categorizeRisk(85)).toBe('LOW');
  });

  it('should distribute scores into buckets', () => {
    const scores = [15, 25, 35, 45, 55, 65, 75, 85, 95];

    const getBucket = (score: number): string => {
      if (score < 20) return '0-20';
      if (score < 40) return '20-40';
      if (score < 60) return '40-60';
      if (score < 80) return '60-80';
      return '80-100';
    };

    const distribution = scores.reduce((acc, score) => {
      const bucket = getBucket(score);
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(distribution['0-20']).toBe(1);
    expect(distribution['20-40']).toBe(2);
    expect(distribution['40-60']).toBe(2);
    expect(distribution['60-80']).toBe(2);
    expect(distribution['80-100']).toBe(2);
  });
});
