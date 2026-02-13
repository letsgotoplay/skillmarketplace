import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your skill marketplace</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>View system health and statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/overview">
              <Button className="w-full">View Overview</Button>
            </Link>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>View system activity logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/audit-logs">
              <Button className="w-full">View Logs</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Generate and download reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/reports">
              <Button className="w-full">Generate Reports</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Skills Management */}
        <Card>
          <CardHeader>
            <CardTitle>Skills Management</CardTitle>
            <CardDescription>Review and moderate skills</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/skills">
              <Button className="w-full">Manage Skills</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/settings">
              <Button className="w-full">View Settings</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
