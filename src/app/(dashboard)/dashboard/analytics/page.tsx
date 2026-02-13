'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OverviewData {
  skills?: {
    totalSkills: number;
    publicSkills: number;
    topDownloadedSkills: Array<{ id: string; name: string; slug: string; count: number }>;
    topViewedSkills: Array<{ id: string; name: string; slug: string; count: number }>;
  };
  users?: {
    totalUsers: number;
    newUsersThisMonth: number;
  };
  teams?: {
    totalTeams: number;
    avgMembersPerTeam: number;
    topTeams: Array<{ id: string; name: string; slug: string; memberCount: number; skillCount: number }>;
  };
  evaluations?: {
    totalEvals: number;
    successRate: number;
  };
  security?: {
    totalScans: number;
    avgSecurityScore: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
  };
}

interface TrendsData {
  downloads?: { trend: { current: number; changePercent: number; trend: 'up' | 'down' | 'stable' } };
  views?: { trend: { current: number; changePercent: number; trend: 'up' | 'down' | 'stable' } };
  uploads?: { trend: { current: number; changePercent: number; trend: 'up' | 'down' | 'stable' } };
  evaluations?: { trend: { current: number; changePercent: number; trend: 'up' | 'down' | 'stable' } };
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
}

function StatCard({ title, value, description, trend }: StatCardProps) {
  const trendColor =
    trend?.direction === 'up'
      ? 'text-green-600'
      : trend?.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-600';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        {trend && (
          <p className={`text-sm ${trendColor}`}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
            {Math.abs(trend.value)}% from last period
          </p>
        )}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

interface TopSkillItemProps {
  name: string;
  slug: string;
  count: number;
}

function TopSkillItem({ name, slug, count }: TopSkillItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <Link href={`/marketplace/${slug}`} className="hover:underline">
        {name}
      </Link>
      <span className="text-muted-foreground">{count.toLocaleString()}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData>({});
  const [trends, setTrends] = useState<TrendsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, trendsRes] = await Promise.all([
          fetch('/api/stats/overview', { cache: 'no-store' }),
          fetch('/api/stats/trends?days=30', { cache: 'no-store' }),
        ]);

        const overviewData = await overviewRes.json();
        const trendsData = await trendsRes.json();

        setOverview(overviewData);
        setTrends(trendsData);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const downloadCSV = (endpoint: string) => {
    window.location.href = `/api/stats/${endpoint}?format=csv`;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your skill marketplace performance
          </p>
        </div>
        <Button onClick={() => downloadCSV('overview')}>Export Report (CSV)</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Skills"
          value={overview.skills?.totalSkills ?? 0}
          description={`${overview.skills?.publicSkills ?? 0} public`}
        />
        <StatCard
          title="Total Users"
          value={overview.users?.totalUsers ?? 0}
          description={`${overview.users?.newUsersThisMonth ?? 0} new this month`}
        />
        <StatCard
          title="Total Teams"
          value={overview.teams?.totalTeams ?? 0}
          description={`${overview.teams?.avgMembersPerTeam ?? 0} avg members`}
        />
        <StatCard
          title="Evaluation Success Rate"
          value={`${(overview.evaluations?.successRate ?? 0).toFixed(1)}%`}
          description={`${overview.evaluations?.totalEvals ?? 0} total evaluations`}
        />
      </div>

      {/* Trend Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Downloads (30d)"
          value={trends.downloads?.trend?.current ?? 0}
          trend={
            trends.downloads?.trend
              ? {
                  value: trends.downloads.trend.changePercent,
                  direction: trends.downloads.trend.trend,
                }
              : undefined
          }
        />
        <StatCard
          title="Views (30d)"
          value={trends.views?.trend?.current ?? 0}
          trend={
            trends.views?.trend
              ? {
                  value: trends.views.trend.changePercent,
                  direction: trends.views.trend.trend,
                }
              : undefined
          }
        />
        <StatCard
          title="Uploads (30d)"
          value={trends.uploads?.trend?.current ?? 0}
          trend={
            trends.uploads?.trend
              ? {
                  value: trends.uploads.trend.changePercent,
                  direction: trends.uploads.trend.trend,
                }
              : undefined
          }
        />
        <StatCard
          title="Evaluations (30d)"
          value={trends.evaluations?.trend?.current ?? 0}
          trend={
            trends.evaluations?.trend
              ? {
                  value: trends.evaluations.trend.changePercent,
                  direction: trends.evaluations.trend.trend,
                }
              : undefined
          }
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Top Downloaded Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Top Downloaded Skills</CardTitle>
            <CardDescription>Most popular skills by download count</CardDescription>
          </CardHeader>
          <CardContent>
            {(overview.skills?.topDownloadedSkills?.length ?? 0) > 0 ? (
              overview.skills?.topDownloadedSkills?.map((skill) => (
                <TopSkillItem
                  key={skill.id}
                  name={skill.name}
                  slug={skill.slug}
                  count={skill.count}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No skills downloaded yet</p>
            )}
          </CardContent>
        </Card>

        {/* Top Viewed Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Top Viewed Skills</CardTitle>
            <CardDescription>Most viewed skills in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            {(overview.skills?.topViewedSkills?.length ?? 0) > 0 ? (
              overview.skills?.topViewedSkills?.map((skill) => (
                <TopSkillItem
                  key={skill.id}
                  name={skill.name}
                  slug={skill.slug}
                  count={skill.count}
                />
              ))
            ) : (
              <p className="text-muted-foreground">No skills viewed yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security & Evaluation Stats */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
            <CardDescription>Security scan statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Scans</span>
                <span className="font-semibold">{overview.security?.totalScans ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Score</span>
                <span className="font-semibold">{overview.security?.avgSecurityScore ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>High Risk</span>
                <span className="font-semibold text-red-600">{overview.security?.highRiskCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Medium Risk</span>
                <span className="font-semibold text-yellow-600">{overview.security?.mediumRiskCount ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Risk</span>
                <span className="font-semibold text-green-600">{overview.security?.lowRiskCount ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Teams</CardTitle>
            <CardDescription>Teams with most members</CardDescription>
          </CardHeader>
          <CardContent>
            {(overview.teams?.topTeams?.length ?? 0) > 0 ? (
              overview.teams?.topTeams?.slice(0, 5).map((team) => (
                <div key={team.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <Link href={`/teams/${team.slug}`} className="hover:underline">
                    {team.name}
                  </Link>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>{team.memberCount} members</div>
                    <div>{team.skillCount} skills</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No teams created yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download statistics in various formats</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Button variant="outline" onClick={() => downloadCSV('skills')}>
            Skills Report
          </Button>
          <Button variant="outline" onClick={() => downloadCSV('trends')}>
            Trends Report
          </Button>
          <Button variant="outline" onClick={() => downloadCSV('overview')}>
            Full Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
