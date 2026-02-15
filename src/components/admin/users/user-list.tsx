'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/admin/filters/search-input';
import { RoleFilter } from '@/components/admin/filters/role-filter';
import { DataTable } from '@/components/admin/data-table';
import { UserRoleSelect } from './user-role-select';
import { UserDetailDialog } from './user-detail-dialog';
import { Eye } from 'lucide-react';

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

interface UserListProps {
  initialUsers: User[];
  initialTotal: number;
}

export function UserList({ initialUsers, initialTotal }: UserListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const search = searchParams.get('search') ?? '';
  const role = searchParams.get('role') ?? 'ALL';
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role !== 'ALL') params.set('role', role);
    params.set('limit', pageSize.toString());
    params.set('offset', ((page - 1) * pageSize).toString());

    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setIsLoading(false);
  }, [search, role, page, pageSize]);

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'ALL') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      // Reset to page 1 when filters change
      if (!('page' in updates)) {
        params.delete('page');
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      // Update the user in the local state
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to update role');
    }
  };

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => <span className="font-medium">{user.email}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      render: (user: User) => user.name || '-',
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <UserRoleSelect
          userId={user.id}
          currentRole={user.role as 'USER' | 'TEAM_ADMIN' | 'ADMIN'}
          onRoleChange={handleRoleChange}
        />
      ),
    },
    {
      key: 'skills',
      header: 'Skills',
      render: (user: User) => user._count.skills,
    },
    {
      key: 'teams',
      header: 'Teams',
      render: (user: User) => user._count.teamMembers,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSelectedUserId(user.id);
            setDetailOpen(true);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>Manage user accounts and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <SearchInput
            value={search}
            onChange={(value) => updateParams({ search: value || null })}
            placeholder="Search by email or name..."
            className="w-[300px]"
          />
          <RoleFilter
            value={role}
            onChange={(value) => updateParams({ role: value })}
            className="w-[150px]"
          />
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          pagination={{
            page,
            pageSize,
            total,
            onPageChange: (newPage) => updateParams({ page: newPage }),
            onPageSizeChange: (newSize) => updateParams({ pageSize: newSize, page: 1 }),
          }}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
      </CardContent>

      {/* User Detail Dialog */}
      <UserDetailDialog
        userId={selectedUserId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </Card>
  );
}
