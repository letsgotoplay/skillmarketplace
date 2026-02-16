'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Key, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNav = [
  {
    title: 'Profile',
    href: '/dashboard/settings/profile',
    icon: User,
  },
  {
    title: 'API Tokens',
    href: '/dashboard/settings',
    icon: Key,
  },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1">
      {settingsNav.map((item) => {
        const isActive = item.href === '/dashboard/settings'
          ? pathname === '/dashboard/settings' || pathname === '/dashboard/settings/tokens'
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
