import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserList } from '@/components/admin/users/user-list';

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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/users`,
    { cache: 'no-store' }
  );
  return res.json();
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
