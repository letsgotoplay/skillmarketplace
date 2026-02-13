'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MarketplaceSearchProps {
  initialQuery?: string;
  className?: string;
}

export function MarketplaceSearch({ initialQuery = '', className }: MarketplaceSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);

  // Sync with URL
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);

    if (query.trim()) {
      params.set('search', query.trim());
    } else {
      params.delete('search');
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const clearSearch = () => {
    setQuery('');
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  return (
    <form onSubmit={handleSearch} className={cn('relative', className)}>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, description, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button type="submit">Search</Button>
      </div>
      {initialQuery && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Results for:</span>
          <Badge variant="secondary" className="gap-1">
            {initialQuery}
            <button onClick={clearSearch} className="ml-1 hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        </div>
      )}
    </form>
  );
}
