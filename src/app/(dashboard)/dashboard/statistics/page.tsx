import { redirect } from 'next/navigation';

export default function StatisticsPage() {
  // Redirect to analytics page
  redirect('/dashboard/analytics');
}
