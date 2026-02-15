'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SCOPES = [
  { id: 'SKILL_READ', label: 'Read Skills', description: 'View and download skills' },
  { id: 'SKILL_WRITE', label: 'Write Skills', description: 'Upload and update skills' },
  { id: 'SKILL_DELETE', label: 'Delete Skills', description: 'Delete skills you own' },
  { id: 'BUNDLE_READ', label: 'Read Bundles', description: 'View skill bundles' },
  { id: 'BUNDLE_WRITE', label: 'Write Bundles', description: 'Create and update bundles' },
  { id: 'TEAM_READ', label: 'Read Teams', description: 'View team information' },
] as const;

export function CreateTokenForm() {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['SKILL_READ']);
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  async function handleCreateToken(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a token name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedScopes.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one scope',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          scopes: selectedScopes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create token');
      }

      setCreatedToken(data.token);
      toast({
        title: 'Success',
        description: 'Token created successfully',
      });
    } catch (error) {
      console.error('Failed to create token:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create token',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    );
  }

  async function copyToken() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    setCopied(true);
    toast({
      title: 'Copied',
      description: 'Token copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdToken) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Token created successfully!
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mb-3">
            Copy your token now. You won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border overflow-x-auto">
              {createdToken}
            </code>
            <Button variant="outline" size="icon" onClick={copyToken}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreateToken} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Token Name</Label>
        <Input
          id="name"
          placeholder="e.g., CI/CD, Development Laptop"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          A descriptive name to help you identify this token
        </p>
      </div>

      <div className="space-y-2">
        <Label>Scopes</Label>
        <div className="grid gap-2">
          {SCOPES.map((scope) => (
            <div key={scope.id} className="flex items-start space-x-3 space-y-0">
              <Checkbox
                id={scope.id}
                checked={selectedScopes.includes(scope.id)}
                onCheckedChange={() => toggleScope(scope.id)}
              />
              <div className="grid gap-1 leading-none">
                <Label htmlFor={scope.id} className="cursor-pointer">
                  {scope.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {scope.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Token'}
        </Button>
      </DialogFooter>
    </form>
  );
}
