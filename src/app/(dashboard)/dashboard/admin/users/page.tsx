import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserList } from '@/components/admin/users/user-list';
import { prisma } from '@/lib/db';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    skills: number;
    teamMembers: number;
  };
}

async function getUsers(): Promise<{ users: User[]; total: number }> {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            skills: true,
            teamMembers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    }),
    prisma.user.count(),
  ]);

  // Serialize dates to strings for Client Component compatibility
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return { users: serializedUsers, total };
}

function UserListSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-4 mb-6">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminUsersPage() {
  const { users, total } = await getUsers();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{total} total users</p>
        </div>
      </div>

      <Suspense fallback={<UserListSkeleton />}>
        <UserList initialUsers={users} initialTotal={total} />
      </Suspense>
    </div>
  );
}
