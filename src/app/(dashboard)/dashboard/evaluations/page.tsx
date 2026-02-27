export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default async function EvaluationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Evaluations</h1>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Skill evaluation functionality is currently under development.
            Check back soon for automated testing and validation of your skills.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
