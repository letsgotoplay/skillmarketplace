'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type UserRole = 'USER' | 'TEAM_ADMIN' | 'ADMIN';

interface RoleFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'USER', label: 'User' },
  { value: 'TEAM_ADMIN', label: 'Team Admin' },
  { value: 'ADMIN', label: 'Admin' },
];

export function RoleFilter({ value, onChange, className }: RoleFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Filter by role" />
      </SelectTrigger>
      <SelectContent>
        {ROLE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type { UserRole };
