import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
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

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Skills</th>
                  <th className="text-left py-3 px-4">Teams</th>
                  <th className="text-left py-3 px-4">Joined</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.name ?? '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.role === 'ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : user.role === 'TEAM_ADMIN'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user._count.skills}</td>
                    <td className="py-3 px-4">{user._count.teamMembers}</td>
                    <td className="py-3 px-4">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
