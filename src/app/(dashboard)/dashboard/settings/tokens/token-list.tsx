'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Token {
  id: string;
  name: string;
  tokenPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function TokenList() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    try {
      const response = await fetch('/api/tokens');
      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tokens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function revokeToken(tokenId: string) {
    setRevokingId(tokenId);
    try {
      const response = await fetch(`/api/tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke token');
      }

      toast({
        title: 'Success',
        description: 'Token revoked successfully',
      });
      setTokens(tokens.filter((t) => t.id !== tokenId));
    } catch (error) {
      console.error('Failed to revoke token:', error);
      toast({
        title: 'Error',
        description: 'Failed to revoke token',
        variant: 'destructive',
      });
    } finally {
      setRevokingId(null);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatScope(scope: string) {
    return scope.replace(/_/g, ' ').toLowerCase();
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading tokens...</div>;
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No API tokens yet.</p>
        <p className="text-sm">Create a token to use the SkillHub CLI.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Token</TableHead>
          <TableHead>Scopes</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-[70px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tokens.map((token) => (
          <TableRow key={token.id}>
            <TableCell className="font-medium">{token.name}</TableCell>
            <TableCell>
              <code className="text-sm bg-muted px-2 py-1 rounded">
                {token.tokenPrefix}...
              </code>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {token.scopes.slice(0, 2).map((scope) => (
                  <Badge key={scope} variant="secondary" className="text-xs">
                    {formatScope(scope)}
                  </Badge>
                ))}
                {token.scopes.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{token.scopes.length - 2}
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(token.lastUsedAt)}
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(token.createdAt)}
            </TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={revokingId === token.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Token</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to revoke &quot;{token.name}&quot;?
                      This action cannot be undone. Any applications using this
                      token will lose access.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => revokeToken(token.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
