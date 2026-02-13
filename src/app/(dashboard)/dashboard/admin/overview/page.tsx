import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemStats {
  skills: {
    totalSkills: number;
    totalVersions: number;
    publicSkills: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  };
  teams: {
    totalTeams: number;
    avgMembersPerTeam: number;
  };
  evaluations: {
    totalEvals: number;
    successRate: number;
  };
  security: {
    totalScans: number;
    avgSecurityScore: number;
  };
}

async function getSystemStats(): Promise<SystemStats> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/stats/overview`,
    { cache: 'no-store' }
  );
  return res.json();
}

export default async function AdminOverviewPage() {
  const stats = await getSystemStats();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Overview</h1>
        <p className="text-muted-foreground">Monitor system health and performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Skills</CardDescription>
            <CardTitle className="text-3xl">{stats.skills?.totalSkills ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.skills?.totalVersions ?? 0} total versions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{stats.users?.totalUsers ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.users?.activeUsers ?? 0} active (30d)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Teams</CardDescription>
            <CardTitle className="text-3xl">{stats.teams?.totalTeams ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.teams?.avgMembersPerTeam ?? 0} avg members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Evaluation Success</CardDescription>
            <CardTitle className="text-3xl">{(stats.evaluations?.successRate ?? 0).toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {stats.evaluations?.totalEvals ?? 0} total evaluations
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skills Distribution</CardTitle>
            <CardDescription>Visibility breakdown of skills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Public Skills</span>
                <span className="font-semibold">{stats.skills?.publicSkills ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${stats.skills?.totalSkills
                      ? ((stats.skills?.publicSkills ?? 0) / stats.skills.totalSkills) * 100
                      : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
            <CardDescription>Security scan statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total Scans</span>
                <span className="font-semibold">{stats.security?.totalScans ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Average Score</span>
                <span className="font-semibold">{stats.security?.avgSecurityScore ?? 0}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.security?.avgSecurityScore ?? 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
