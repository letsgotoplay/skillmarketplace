import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  FileText,
  Users,
  Package,
  BarChart3,
  Shield,
  FlaskConical,
  TrendingUp,
  Download,
  Eye,
  Plus
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Fetch quick stats
  const [
    skillCount,
    teamCount,
    evalCount,
    scanCount,
    totalDownloads,
    totalViews,
    recentSkills,
  ] = await Promise.all([
    prisma.skill.count({
      where: { authorId: session.user.id },
    }),
    prisma.teamMember.count({
      where: { userId: session.user.id },
    }),
    prisma.evalQueue.count(),
    prisma.securityScan.count(),
    prisma.skillStat.aggregate({
      _sum: { downloadsCount: true },
    }),
    prisma.skillStat.aggregate({
      _sum: { viewsCount: true },
    }),
    prisma.skill.findMany({
      where: { visibility: 'PUBLIC' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, slug: true, description: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Console</h1>
          <p className="text-muted-foreground">
            Welcome back, {session.user.name || session.user.email}
          </p>
        </div>
        <Link href="/dashboard/skills/upload">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Upload Skill
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Skills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillCount}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/skills" className="hover:underline">
                Manage skills →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamCount}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/teams" className="hover:underline">
                View teams →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDownloads._sum.downloadsCount?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total skill downloads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews._sum.viewsCount?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total skill views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Skills */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Public Skills
            </CardTitle>
            <CardDescription>
              Latest skills added to the marketplace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills yet</p>
              ) : (
                recentSkills.map((skill: { id: string; name: string; slug: string; description: string | null }) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <Link
                        href={`/marketplace/${skill.id}`}
                        className="font-medium hover:underline"
                      >
                        {skill.name}
                      </Link>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {skill.description}
                      </p>
                    </div>
                    <Link href={`/marketplace/${skill.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <Link href="/marketplace">
                <Button variant="outline" className="w-full">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/bundles" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Package className="h-4 w-4 mr-2" />
                Manage Bundles
              </Button>
            </Link>
            <Link href="/dashboard/analytics" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
            <Link href="/dashboard/evaluations" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FlaskConical className="h-4 w-4 mr-2" />
                Evaluations ({evalCount})
              </Button>
            </Link>
            <Link href="/dashboard/security" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Security Scans ({scanCount})
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
