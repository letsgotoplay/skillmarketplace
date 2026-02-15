'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type UserRole = 'USER' | 'TEAM_ADMIN' | 'ADMIN';

interface UserRoleSelectProps {
  userId: string;
  currentRole: UserRole;
  onRoleChange: (userId: string, newRole: UserRole) => Promise<void>;
  disabled?: boolean;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-red-100 text-red-800' },
  TEAM_ADMIN: { label: 'Team Admin', color: 'bg-blue-100 text-blue-800' },
  USER: { label: 'User', color: 'bg-gray-100 text-gray-800' },
};

export function UserRoleSelect({ userId, currentRole, onRoleChange, disabled }: UserRoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (value: UserRole) => {
    if (value !== currentRole) {
      setSelectedRole(value);
    }
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await onRoleChange(userId, selectedRole);
    } catch (error) {
      console.error('Failed to change role:', error);
    } finally {
      setIsLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <>
      <Select
        value={currentRole}
        onValueChange={handleSelect}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="w-[130px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((role) => (
            <SelectItem key={role} value={role}>
              <Badge className={ROLE_CONFIG[role].color} variant="secondary">
                {ROLE_CONFIG[role].label}
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={!!selectedRole} onOpenChange={() => setSelectedRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to change this user&apos;s role from{' '}
              <strong>{currentRole}</strong> to <strong>{selectedRole}</strong>?
              This action may affect their permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRole(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isLoading}>
              {isLoading ? 'Changing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
