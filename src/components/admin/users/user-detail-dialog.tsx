'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  skills: Array<{
    id: string;
    name: string;
    slug: string;
    visibility: string;
    createdAt: string;
  }>;
  teamMembers: Array<{
    id: string;
    role: string;
    joinedAt: string;
    team: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    skills: number;
    teamMembers: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  metadata: unknown;
  createdAt: string;
}

interface UserDetailDialogProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  TEAM_ADMIN: 'bg-blue-100 text-blue-800',
  USER: 'bg-gray-100 text-gray-800',
};

const VISIBILITY_COLORS: Record<string, string> = {
  PUBLIC: 'bg-green-100 text-green-800',
  TEAM_ONLY: 'bg-yellow-100 text-yellow-800',
  PRIVATE: 'bg-gray-100 text-gray-800',
};

export function UserDetailDialog({ userId, open, onOpenChange }: UserDetailDialogProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId && open) {
      setIsLoading(true);
      Promise.all([
        fetch(`/api/admin/users/${userId}`).then((r) => r.json()),
        fetch(`/api/admin/users/${userId}/activity`).then((r) => r.json()),
      ])
        .then(([userData, activityData]) => {
          setUser(userData);
          setActivity(activityData.logs || []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [userId, open]);

  if (!userId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View user information and activity
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{user.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge className={ROLE_COLORS[user.role] || ''}>{user.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Skills</p>
                    <p className="font-medium">{user._count.skills}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teams</p>
                    <p className="font-medium">{user._count.teamMembers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Skills, Teams, Activity */}
            <Tabs defaultValue="skills">
              <TabsList>
                <TabsTrigger value="skills">Skills ({user.skills.length})</TabsTrigger>
                <TabsTrigger value="teams">Teams ({user.teamMembers.length})</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="skills" className="mt-4">
                <div className="space-y-2">
                  {user.skills.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No skills yet</p>
                  ) : (
                    user.skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <Link
                            href={`/skills/${skill.id}`}
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {skill.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(skill.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={VISIBILITY_COLORS[skill.visibility] || ''}>
                          {skill.visibility}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="teams" className="mt-4">
                <div className="space-y-2">
                  {user.teamMembers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No team memberships</p>
                  ) : (
                    user.teamMembers.map((tm) => (
                      <div
                        key={tm.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <Link
                            href={`/teams/${tm.team.slug}`}
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {tm.team.name}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Joined {new Date(tm.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{tm.role}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <div className="space-y-2">
                  {activity.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No recent activity</p>
                  ) : (
                    activity.map((log) => (
                      <div key={log.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{log.action}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">
                          Resource: {log.resource}
                          {log.resourceId && ` (${log.resourceId.slice(0, 8)}...)`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <p className="text-muted-foreground">User not found</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
