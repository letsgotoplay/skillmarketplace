import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Providers } from './providers';
import Link from 'next/link';
import { Home, Package, Users, Shield, FlaskConical, Settings, FileText } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: Home },
  { href: '/dashboard/skills', label: 'Skills', icon: FileText },
  { href: '/dashboard/teams', label: 'Teams', icon: Users },
  { href: '/dashboard/bundles', label: 'Bundles', icon: Package },
  { href: '/dashboard/evaluations', label: 'Evaluations', icon: FlaskConical },
  { href: '/dashboard/security', label: 'Security', icon: Shield },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  const isAdmin = session.user.role === 'ADMIN';

  return (
    <Providers>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              {/* Logo and Home Link */}
              <div className="flex items-center gap-6">
                <Link href="/dashboard" className="font-bold text-xl">
                  SkillHub
                </Link>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Home className="h-4 w-4" />
                  Marketplace
                </Link>
              </div>

              {/* Main Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    href="/dashboard/admin"
                    className="px-3 py-2 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}
              </nav>

              {/* User Menu */}
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/settings"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {session.user.email}
                </span>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="text-sm px-3 py-1.5 rounded-md border hover:bg-accent"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Navigation */}
        <nav className="md:hidden border-b bg-card">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 text-sm rounded-md text-muted-foreground hover:text-foreground hover:bg-accent whitespace-nowrap flex items-center gap-1"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="border-t py-4 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Skill Marketplace
            </Link>
            {' • '}
            <Link href="/marketplace" className="hover:text-foreground">
              Browse Skills
            </Link>
            {' • '}
            <Link href="/docs" className="hover:text-foreground">
              Documentation
            </Link>
          </div>
        </footer>
      </div>
    </Providers>
  );
}
