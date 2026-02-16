import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, AlertTriangle } from 'lucide-react';
import { TokenList } from './tokens/token-list';
import { CreateTokenForm } from './tokens/create-token-form';

export const metadata = {
  title: 'API Tokens | SkillHub',
  description: 'Manage your API tokens for CLI authentication',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Tokens</CardTitle>
          <CardDescription>
            API tokens allow you to authenticate with the SkillHub CLI. Keep your
            tokens secure - they provide access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Security Notice
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  API tokens are only shown once when created. Store them securely.
                  Never share your tokens or commit them to version control.
                </p>
              </div>
            </div>
          </div>

          <TokenList />

          <div className="mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Token
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <CreateTokenForm />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Using the CLI</CardTitle>
          <CardDescription>
            How to authenticate with the SkillHub CLI using your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">1. Install the CLI:</p>
            <code className="block rounded bg-muted p-3 text-sm font-mono">
              npm install -g @skillhub/cli
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">2. Login with your token:</p>
            <code className="block rounded bg-muted p-3 text-sm font-mono">
              skillhub login
            </code>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">3. Or set environment variable:</p>
            <code className="block rounded bg-muted p-3 text-sm font-mono">
              SKILLHUB_TOKEN=sh_your_token skillhub search "pdf"
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
