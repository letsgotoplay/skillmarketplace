'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({
  className,
  placeholder = 'Search skills...'
}: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      inputRef.current?.blur();
    }
  };

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <form onSubmit={handleSearch} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 w-full md:w-64"
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
    </form>
  );
}
