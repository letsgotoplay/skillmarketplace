/**
 * Export Functionality
 * Export analytics data to CSV and other formats
 */

import { OverviewStatistics, SkillStatistics, UserStatistics, TeamStatistics } from './aggregation';
import { TrendChartData } from './trends';

// CSV export utilities
export function toCSV(data: Record<string, unknown>[], headers?: string[]): string {
  if (data.length === 0) return '';

  const keys = headers ?? Object.keys(data[0]);

  const headerRow = keys.join(',');
  const dataRows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Skill statistics export
export function exportSkillStatisticsToCSV(stats: SkillStatistics): string {
  const skillData = [
    { metric: 'Total Skills', value: stats.totalSkills },
    { metric: 'Total Versions', value: stats.totalVersions },
    { metric: 'Public Skills', value: stats.publicSkills },
    { metric: 'Team Skills', value: stats.teamSkills },
    { metric: 'Private Skills', value: stats.privateSkills },
    { metric: 'Avg Downloads/Skill', value: stats.avgDownloadsPerSkill },
    { metric: 'Avg Views/Skill', value: stats.avgViewsPerSkill },
  ];

  const topDownloaded = stats.topDownloadedSkills.map((s, i) => ({
    rank: i + 1,
    name: s.name,
    downloads: s.count,
  }));

  const csv1 = toCSV(skillData, ['metric', 'value']);
  const csv2 = '\n\nTop Downloaded Skills\n' + toCSV(topDownloaded, ['rank', 'name', 'downloads']);

  return csv1 + csv2;
}

// User statistics export
export function exportUserStatisticsToCSV(stats: UserStatistics): string {
  const userData = [
    { metric: 'Total Users', value: stats.totalUsers },
    { metric: 'Active Users (30d)', value: stats.activeUsers },
    { metric: 'New Users This Month', value: stats.newUsersThisMonth },
  ];

  const roleData = Object.entries(stats.usersByRole).map(([role, count]) => ({
    role,
    count,
  }));

  const csv1 = toCSV(userData, ['metric', 'value']);
  const csv2 = '\n\nUsers by Role\n' + toCSV(roleData, ['role', 'count']);

  return csv1 + csv2;
}

// Team statistics export
export function exportTeamStatisticsToCSV(stats: TeamStatistics): string {
  const teamData = [
    { metric: 'Total Teams', value: stats.totalTeams },
    { metric: 'Avg Members/Team', value: stats.avgMembersPerTeam },
    { metric: 'Avg Skills/Team', value: stats.avgSkillsPerTeam },
  ];

  const topTeams = stats.topTeams.map((t, i) => ({
    rank: i + 1,
    name: t.name,
    members: t.memberCount,
    skills: t.skillCount,
  }));

  const csv1 = toCSV(teamData, ['metric', 'value']);
  const csv2 = '\n\nTop Teams\n' + toCSV(topTeams, ['rank', 'name', 'members', 'skills']);

  return csv1 + csv2;
}

// Overview statistics export
export function exportOverviewToCSV(stats: OverviewStatistics): string {
  const sections = [
    '# Skill Marketplace Statistics Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Skill Statistics',
    exportSkillStatisticsToCSV(stats.skills),
    '',
    '## User Statistics',
    exportUserStatisticsToCSV(stats.users),
    '',
    '## Team Statistics',
    exportTeamStatisticsToCSV(stats.teams),
    '',
    '## Evaluation Statistics',
    toCSV(
      [
        { metric: 'Total Evaluations', value: stats.evaluations.totalEvals },
        { metric: 'Successful', value: stats.evaluations.successfulEvals },
        { metric: 'Failed', value: stats.evaluations.failedEvals },
        { metric: 'Success Rate (%)', value: stats.evaluations.successRate.toFixed(1) },
        { metric: 'Avg Duration (ms)', value: stats.evaluations.avgDurationMs },
      ],
      ['metric', 'value']
    ),
    '',
    '## Security Statistics',
    toCSV(
      [
        { metric: 'Total Scans', value: stats.security.totalScans },
        { metric: 'Avg Security Score', value: stats.security.avgSecurityScore },
        { metric: 'High Risk (<40)', value: stats.security.highRiskCount },
        { metric: 'Medium Risk (40-70)', value: stats.security.mediumRiskCount },
        { metric: 'Low Risk (>=70)', value: stats.security.lowRiskCount },
      ],
      ['metric', 'value']
    ),
  ];

  return sections.join('\n');
}

// Trend data export
export function exportTrendToCSV(trend: TrendChartData): string {
  const header = `# ${trend.label} Trend`;
  const summary = toCSV(
    [
      { metric: 'Current Period', value: trend.trend.current },
      { metric: 'Previous Period', value: trend.trend.previous },
      { metric: 'Change', value: trend.trend.change },
      { metric: 'Change (%)', value: trend.trend.changePercent },
      { metric: 'Trend', value: trend.trend.trend },
    ],
    ['metric', 'value']
  );

  const dataPoints = toCSV(
    trend.data.map((d) => ({ date: d.date, value: d.value })),
    ['date', 'value']
  );

  return `${header}\n\n${summary}\n\nDaily Data\n${dataPoints}`;
}

// JSON export (alternative format)
export function exportToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

// Generate filename with timestamp
export function generateFilename(prefix: string, format: 'csv' | 'json'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${prefix}_${timestamp}.${format}`;
}
