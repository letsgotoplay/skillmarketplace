import { redirect } from 'next/navigation';

export const metadata = {
  title: 'API Tokens | SkillHub',
  description: 'Manage your API tokens for CLI authentication',
};

export default function TokensPage() {
  redirect('/dashboard/settings');
}
