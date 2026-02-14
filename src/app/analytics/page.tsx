import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Package, Users, Shield, TrendingUp } from 'lucide-react';
import { Charts } from '@/components/analytics/Charts';

// Force dynamic rendering
export const revalidate = 60; // Revalidate every 60 seconds

interface TrendDataPoint {
  date: string;
  count: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface SecurityData {
  range: string;
  count: number;
}

interface TopTeam {
  id: string;
  name: string;
  slug: string;
  skillCount: number;
  memberCount: number;
  totalDownloads: number;
}

interface Stats {
  overview: {
    totalSkills: number;
    publicSkills: number;
    totalDownloads: number;
    totalTeams: number;
    totalUsers: number;
    avgSecurityScore: number | null;
  };
  categoryDistribution: CategoryData[];
  securityDistribution: SecurityData[];
  uploadTrend: TrendDataPoint[];
  downloadTrend: TrendDataPoint[];
  topTeams: TopTeam[];
}

async function getStats(): Promise<Stats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/public/stats`, {
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function MetricCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

export default async function PublicAnalyticsPage() {
  const stats = await getStats();

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">Skill Marketplace Analytics</h1>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">
              Unable to load analytics data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, categoryDistribution, securityDistribution, uploadTrend, downloadTrend, topTeams } = stats;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Skill Marketplace Analytics</h1>
        <p className="text-gray-600 mt-2">
          Public statistics and trends for the skill marketplace
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <MetricCard
          title="Total Skills"
          value={overview.totalSkills.toLocaleString()}
          icon={Package}
          description={`${overview.publicSkills.toLocaleString()} public`}
        />
        <MetricCard
          title="Total Downloads"
          value={overview.totalDownloads.toLocaleString()}
          icon={Download}
          description="All time downloads"
        />
        <MetricCard
          title="Active Teams"
          value={overview.totalTeams.toLocaleString()}
          icon={Users}
          description="Contributing teams"
        />
        <MetricCard
          title="Total Users"
          value={overview.totalUsers.toLocaleString()}
          icon={Users}
          description="Registered users"
        />
        <MetricCard
          title="Avg Security Score"
          value={overview.avgSecurityScore !== null ? `${overview.avgSecurityScore}/100` : 'N/A'}
          icon={Shield}
          description="Average scan score"
        />
      </div>

      {/* Charts */}
      <Charts
        uploadTrend={uploadTrend}
        downloadTrend={downloadTrend}
        categoryDistribution={categoryDistribution}
        securityDistribution={securityDistribution}
      />

      {/* Top Teams */}
      <Card>
        <CardHeader>
          <CardTitle>Top Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Team</th>
                  <th className="text-right py-3 px-4">Skills</th>
                  <th className="text-right py-3 px-4">Members</th>
                  <th className="text-right py-3 px-4">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {topTeams.map((team, index) => (
                  <tr key={team.id} className="border-b">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-gray-400">#{index + 1}</span>
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4">{team.skillCount}</td>
                    <td className="text-right py-3 px-4">{team.memberCount}</td>
                    <td className="text-right py-3 px-4 font-medium">
                      {team.totalDownloads.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {topTeams.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">
                      No teams found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Data is refreshed every 60 seconds. Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
