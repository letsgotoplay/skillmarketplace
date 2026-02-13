'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signIn, signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Package, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { GlobalSearch } from '@/components/search/global-search';

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/#features', label: 'Features' },
    { href: '/docs', label: 'Docs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">SkillHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center">
          <GlobalSearch />
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="outline" onClick={() => signOut()}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => signIn()}>
                Sign In
              </Button>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <GlobalSearch placeholder="Search skills..." className="w-full" />
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t space-y-2">
              {session ? (
                <>
                  <Link href="/dashboard" className="block">
                    <Button variant="ghost" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => signIn()}>
                    Sign In
                  </Button>
                  <Link href="/register" className="block">
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
