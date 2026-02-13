export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserBundles } from '@/lib/bundles';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package } from 'lucide-react';

export default async function BundlesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const bundles = await getUserBundles();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Skill Bundles</h1>
        <Link href="/dashboard/bundles/create">
          <Button>Create Bundle</Button>
        </Link>
      </div>

      {bundles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No bundles created yet.
            </p>
            <Link href="/dashboard/bundles/create">
              <Button>Create Your First Bundle</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <Link key={bundle.id} href={`/dashboard/bundles/${bundle.id}`}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardHeader>
                  <CardTitle>{bundle.name}</CardTitle>
                  <CardDescription>{bundle.description || 'No description'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    {bundle._count.skills} skills
                  </div>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                        bundle.visibility === 'PUBLIC'
                          ? 'bg-green-100 text-green-700'
                          : bundle.visibility === 'TEAM_ONLY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {bundle.visibility.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
