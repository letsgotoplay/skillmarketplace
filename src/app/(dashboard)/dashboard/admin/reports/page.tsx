'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ReportsPage() {
  const downloadReport = (endpoint: string) => {
    window.location.href = `/api/stats/${endpoint}?format=csv`;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and download system reports</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Full Statistics Report</CardTitle>
            <CardDescription>Complete overview of all statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Includes skills, users, teams, evaluations, and security statistics.
            </p>
            <Button onClick={() => downloadReport('overview')} className="w-full">
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Statistics</CardTitle>
            <CardDescription>Detailed skill metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download counts, view counts, and top skills.
            </p>
            <Button onClick={() => downloadReport('skills')} className="w-full">
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trend Analysis</CardTitle>
            <CardDescription>30-day trend data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Daily breakdown of downloads, views, uploads, and evaluations.
            </p>
            <Button onClick={() => downloadReport('trends')} className="w-full">
              Download CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity Report</CardTitle>
            <CardDescription>User engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              User registrations, logins, and activity patterns.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Report</CardTitle>
            <CardDescription>Security scan results</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Vulnerability reports, risk assessments, and recommendations.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Report</CardTitle>
            <CardDescription>Test execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Pass/fail rates, execution times, and error logs.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
