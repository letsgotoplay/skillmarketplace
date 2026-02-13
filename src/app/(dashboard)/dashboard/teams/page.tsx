export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserTeams } from '@/lib/teams';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Package } from 'lucide-react';

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const teams = await getUserTeams();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Teams</h1>
        <Link href="/dashboard/teams/create">
          <Button>Create Team</Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              You&apos;re not a member of any teams yet.
            </p>
            <Link href="/dashboard/teams/create">
              <Button>Create Your First Team</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/dashboard/teams/${team.id}`}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>{team.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {team.memberCount} members
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {team.skillCount} skills
                    </div>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        team.role === 'OWNER'
                          ? 'bg-purple-100 text-purple-700'
                          : team.role === 'ADMIN'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {team.role.toLowerCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
