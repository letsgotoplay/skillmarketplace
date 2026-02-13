export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const roleColors: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-gray-100 text-gray-700',
};

export default async function TeamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: {
          user: true,
        },
        orderBy: { joinedAt: 'asc' },
      },
      skills: {
        include: {
          stats: true,
          versions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!team) {
    notFound();
  }

  // Check membership
  const membership = team.members.find((m) => m.userId === session.user?.id);
  if (!membership) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <p className="text-muted-foreground">{team.description || 'No description'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/teams">
            <Button variant="outline">Back to Teams</Button>
          </Link>
          {(membership.role === 'OWNER' || membership.role === 'ADMIN') && (
            <Button>Invite Member</Button>
          )}
        </div>
      </div>

      {/* Members */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Members ({team.members.length})</CardTitle>
          <CardDescription>Team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {(member.user.name || member.user.email || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{member.user.name || member.user.email}</p>
                    <p className="text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                      roleColors[member.role]
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Team Skills ({team.skills.length})</CardTitle>
          <CardDescription>Skills owned by this team</CardDescription>
        </CardHeader>
        <CardContent>
          {team.skills.length === 0 ? (
            <p className="text-muted-foreground">No skills yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {team.skills.map((skill) => (
                <Link key={skill.id} href={`/dashboard/skills/${skill.id}`}>
                  <Card className="h-full hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg">{skill.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {skill.description || 'No description'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>v{skill.versions[0]?.version || '0.0.0'}</span>
                        <span>{skill.stats?.downloadsCount || 0} downloads</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
