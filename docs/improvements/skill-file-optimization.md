# Skill File Optimization Plan

## Overview

Two impactful improvements to the skill file storage system:
1. **Full-Text Search** - Enable searching within skill file contents
2. **Lazy Loading API** - Improve performance for skills with many files

## Current Architecture

```
Upload Flow:
ZIP File → Parse → S3 (full ZIP) + DB SkillFile (metadata + content if <100KB text)

Key Files:
- prisma/schema.prisma          # SkillFile model
- src/lib/config/file-preview.ts # MAX_CONTENT_SIZE, TEXT_FILE_EXTENSIONS
- src/lib/skills/upload.ts       # processSkillUpload()
- src/components/skill/file-browser.tsx  # UI preview
- src/app/actions/skills.ts      # getSkills() with current search

Current Search (actions/skills.ts:369-376):
- Only searches: name, description, tags
- Uses SQL LIKE (contains) - no indexing
- No file content search
- No relevance ranking

Database:
- skill_files table: id, skillVersionId, filePath, fileType, sizeBytes, content (TEXT)
```

---

# Task 1: Full-Text Search on File Content

## Goal

Add PostgreSQL full-text search to search within skill file contents (code, documentation, config files).

## What This Enables

| Before | After |
|--------|-------|
| Search "pdf" → finds skills with "pdf" in name/description | Search "pdf" → also finds skills containing `parsePDF()` in code |
| No relevance ranking | Results ranked by relevance |
| No snippet preview | Shows matching code snippets highlighted |
| O(n) table scan | O(log n) index lookup |

## Files to Touch

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add tsvector generated column and GIN index |
| `src/lib/search/index.ts` | NEW - Search utility functions |
| `src/app/api/search/route.ts` | NEW - Search API endpoint |
| `src/components/search/search-results.tsx` | NEW - Search results UI component |
| `tests/unit/lib/search/index.test.ts` | NEW - Unit tests |
| `tests/integration/api/search.test.ts` | NEW - Integration tests |

## Step 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

Find the `SkillFile` model and add the search column:

```prisma
model SkillFile {
  id              String      @id @default(uuid())
  skillVersionId  String
  filePath        String
  fileType        String
  sizeBytes       Int
  content         String?     @db.Text
  createdAt       DateTime    @default(now())

  // Relations
  skillVersion    SkillVersion @relation(fields: [skillVersionId], references: [id], onDelete: Cascade)

  @@index([skillVersionId])
  @@map("skill_files")
}
```

**Note:** We'll add the tsvector column via raw SQL migration since Prisma doesn't natively support it.

## Step 1.2: Create Database Migration

**Command:**
```bash
npx prisma migrate dev --name add_fulltext_search --create-only
```

**Edit the generated migration file to add:**

```sql
-- Add tsvector generated column for full-text search
-- This column is automatically updated when content changes
ALTER TABLE skill_files
ADD COLUMN content_search tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(content, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_skill_files_content_search ON skill_files USING GIN(content_search);

-- Optional: Add trigram extension for fuzzy/typo-tolerant search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create trigram index on skill name and description for better matching
CREATE INDEX idx_skills_name_trgm ON skills USING GIN(name gin_trgm_ops);
CREATE INDEX idx_skills_description_trgm ON skills USING GIN(description gin_trgm_ops);
```

**Then run:**
```bash
npx prisma migrate dev
```

## Step 1.3: Create Search Utility

**File:** `src/lib/search/index.ts` (NEW)

```typescript
import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';

export interface SearchResult {
  skillId: string;
  skillName: string;
  skillSlug: string;
  description: string | null;
  author: {
    name: string | null;
    emailPrefix: string;
  };
  // Where the match was found
  matchType: 'name' | 'description' | 'tags' | 'file_content';
  // File path if match was in file content
  filePath?: string;
  // Highlighted snippet showing the match
  snippet?: string;
  // Relevance score (higher = better match)
  rank: number;
}

export interface SearchOptions {
  query: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Sanitize and prepare search query for PostgreSQL full-text search
 * Converts user input to tsquery format
 */
export function sanitizeTsQuery(query: string): string {
  return query
    // Remove special tsquery characters
    .replace(/[&|!():*<>]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    // Add prefix matching for partial words
    .map(word => `${word}:*`)
    // Combine with AND logic (all terms must match)
    .join(' & ');
}

/**
 * Perform full-text search across skills and file contents
 */
export async function searchSkills(options: SearchOptions): Promise<{
  results: SearchResult[];
  total: number;
  query: string;
}> {
  const { query, userId, limit = 20, offset = 0 } = options;

  if (!query || query.trim().length === 0) {
    return { results: [], total: 0, query };
  }

  const searchQuery = query.trim();

  // Search in skill metadata (name, description, tags)
  const skillResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      s.id as "skillId",
      s.name as "skillName",
      s."fullSlug" as "skillSlug",
      s.description,
      json_build_object('name', u.name, 'emailPrefix', u."emailPrefix") as author,
      'skill' as "matchType",
      NULL as "filePath",
      ts_headline(
        'english',
        coalesce(s.name, '') || ' ' || coalesce(s.description, ''),
        websearch_to_tsquery('english', ${searchQuery}),
        'MaxWords=35, MinWords=10, MaxFragments=1'
      ) as snippet,
      ts_rank(
        setweight(to_tsvector('english', coalesce(s.name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(s.description, '')), 'B'),
        websearch_to_tsquery('english', ${searchQuery})
      ) as rank
    FROM skills s
    JOIN users u ON s."authorId" = u.id
    WHERE s.visibility = ${Visibility.PUBLIC}
    AND (
      setweight(to_tsvector('english', coalesce(s.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(s.description, '')), 'B')
    ) @@ websearch_to_tsquery('english', ${searchQuery})
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Search in file contents
  const fileResults = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      s.id as "skillId",
      s.name as "skillName",
      s."fullSlug" as "skillSlug",
      s.description,
      json_build_object('name', u.name, 'emailPrefix', u."emailPrefix") as author,
      'file_content' as "matchType",
      sf."filePath" as "filePath",
      ts_headline(
        'english',
        sf.content,
        websearch_to_tsquery('english', ${searchQuery}),
        'MaxWords=35, MinWords=10, MaxFragments=2'
      ) as snippet,
      ts_rank(sf."contentSearch", websearch_to_tsquery('english', ${searchQuery})) as rank
    FROM skill_files sf
    JOIN skill_versions sv ON sf."skillVersionId" = sv.id
    JOIN skills s ON sv."skillId" = s.id
    JOIN users u ON s."authorId" = u.id
    WHERE s.visibility = ${Visibility.PUBLIC}
    AND sf."contentSearch" @@ websearch_to_tsquery('english', ${searchQuery})
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  // Combine and deduplicate results
  const seenSkills = new Set<string>();
  const combinedResults: SearchResult[] = [];

  // Add skill results first (higher priority)
  for (const result of skillResults) {
    if (!seenSkills.has(result.skillId)) {
      seenSkills.add(result.skillId);
      result.matchType = 'name';
      combinedResults.push(result);
    }
  }

  // Add file content results
  for (const result of fileResults) {
    if (!seenSkills.has(result.skillId)) {
      seenSkills.add(result.skillId);
      combinedResults.push(result);
    }
  }

  // Sort by rank and limit
  combinedResults.sort((a, b) => b.rank - a.rank);
  const limitedResults = combinedResults.slice(0, limit);

  // Get total count
  const totalResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(DISTINCT s.id) as count
    FROM skills s
    LEFT JOIN skill_versions sv ON sv."skillId" = s.id
    LEFT JOIN skill_files sf ON sf."skillVersionId" = sv.id
    WHERE s.visibility = ${Visibility.PUBLIC}
    AND (
      to_tsvector('english', coalesce(s.name, '') || ' ' || coalesce(s.description, '')) @@ websearch_to_tsquery('english', ${searchQuery})
      OR sf."contentSearch" @@ websearch_to_tsquery('english', ${searchQuery})
    )
  `;

  return {
    results: limitedResults,
    total: Number(totalResult[0].count),
    query: searchQuery,
  };
}

/**
 * Get search suggestions based on prefix
 * Useful for autocomplete
 */
export async function getSearchSuggestions(prefix: string, limit = 5): Promise<string[]> {
  if (prefix.length < 2) return [];

  // Get suggestions from skill names
  const skills = await prisma.skill.findMany({
    where: {
      visibility: Visibility.PUBLIC,
      name: {
        startsWith: prefix,
        mode: 'insensitive',
      },
    },
    select: { name: true },
    take: limit,
  });

  return skills.map(s => s.name);
}
```

## Step 1.4: Create Search API Endpoint

**File:** `src/app/api/search/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchSkills, getSearchSuggestions } from '@/lib/search';

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search skills and file contents
 *     description: Full-text search across skill metadata and file contents
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Maximum number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *       - in: query
 *         name: suggestions
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return autocomplete suggestions instead of search results
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                 total:
 *                   type: integer
 *                 query:
 *                   type: string
 *       400:
 *         description: Missing or invalid query parameter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const suggestionsOnly = searchParams.get('suggestions') === 'true';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Return autocomplete suggestions
    if (suggestionsOnly) {
      const suggestions = await getSearchSuggestions(query, limit);
      return NextResponse.json({ suggestions, query });
    }

    // Perform full search
    const results = await searchSkills({ query, limit, offset });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
```

## Step 1.5: Update Middleware for Public Access

**File:** `src/middleware.ts`

Add the search API to public routes:

```typescript
// Find this section in the authorized callback:

// Public API routes (they handle their own authentication)
if (pathname.startsWith('/api/skills') && pathname.includes('/feedback')) {
  return true;
}

// ADD: Public search API
if (pathname === '/api/search') {
  return true;
}
```

## Step 1.6: Create Search Results Component

**File:** `src/components/search/search-results.tsx` (NEW)

```typescript
'use client';

import Link from 'next/link';
import { FileText, Code, Tag, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SearchResult } from '@/lib/search';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No results found</h3>
        <p className="text-muted-foreground mt-1">
          No skills matched "{query}". Try different keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => (
        <Link
          key={`${result.skillId}-${result.filePath || 'skill'}`}
          href={`/marketplace/${result.skillSlug}`}
          className="block"
        >
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Skill name and author */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{result.skillName}</h3>
                    <Badge variant="outline" className="shrink-0">
                      {result.author.name || result.author.emailPrefix}
                    </Badge>
                  </div>

                  {/* Match type indicator */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    {result.matchType === 'file_content' ? (
                      <>
                        <Code className="h-3 w-3" />
                        <span>Found in {result.filePath}</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3 w-3" />
                        <span>Matched in {result.matchType}</span>
                      </>
                    )}
                  </div>

                  {/* Snippet with highlighted match */}
                  {result.snippet && (
                    <div
                      className="text-sm text-muted-foreground line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: result.snippet.replace(
                          /<b>/g,
                          '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">'
                        ).replace(/<\/b>/g, '</mark>'),
                      }}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

## Step 1.7: Update Global Search to Use New API

**File:** `src/components/search/global-search.tsx`

Replace the current implementation to use the search API:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced suggestions fetch
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(query)}&suggestions=true&limit=5`
          );
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Failed to fetch suggestions:', error);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/marketplace?search=${encodeURIComponent(suggestion)}`);
    setShowSuggestions(false);
  };

  // Keyboard shortcut (Cmd/Ctrl + K)
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
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 w-full md:w-64"
        />
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !loading && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
          >
            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
```

## Step 1.8: Unit Tests

**File:** `tests/unit/lib/search/index.test.ts` (NEW)

```typescript
import { sanitizeTsQuery } from '@/lib/search';

describe('Search Utilities', () => {
  describe('sanitizeTsQuery', () => {
    it('should handle simple word', () => {
      expect(sanitizeTsQuery('hello')).toBe('hello:*');
    });

    it('should handle multiple words with AND logic', () => {
      expect(sanitizeTsQuery('hello world')).toBe('hello:* & world:*');
    });

    it('should escape special tsquery characters', () => {
      expect(sanitizeTsQuery('test & | ! ( )')).toBe('test:*');
    });

    it('should handle empty query', () => {
      expect(sanitizeTsQuery('')).toBe('');
    });

    it('should handle whitespace-only query', () => {
      expect(sanitizeTsQuery('   ')).toBe('');
    });

    it('should normalize multiple spaces', () => {
      expect(sanitizeTsQuery('hello    world')).toBe('hello:* & world:*');
    });

    it('should add prefix matching for partial matches', () => {
      expect(sanitizeTsQuery('react')).toBe('react:*');
    });

    it('should handle code-like terms', () => {
      expect(sanitizeTsQuery('parsePDF')).toBe('parsePDF:*');
    });
  });
});
```

## Step 1.9: Integration Tests

**File:** `tests/integration/api/search.test.ts` (NEW)

```typescript
import { Visibility } from '@prisma/client';

interface SearchResult {
  skillId: string;
  skillName: string;
  skillSlug: string;
  matchType: 'name' | 'description' | 'tags' | 'file_content';
  filePath?: string;
  snippet?: string;
  rank: number;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

describe('Search API Integration', () => {
  describe('GET /api/search', () => {
    it('should return 400 for missing query', () => {
      const response = { error: 'Query parameter "q" is required', status: 400 };
      expect(response.status).toBe(400);
    });

    it('should return results structure', () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            skillId: 'skill-1',
            skillName: 'PDF Reader',
            skillSlug: 'alice/pdf-reader',
            description: 'A PDF reading skill',
            author: { name: 'Alice', emailPrefix: 'alice' },
            matchType: 'name',
            rank: 0.5,
          },
        ],
        total: 1,
        query: 'pdf',
      };

      expect(mockResponse.results).toBeInstanceOf(Array);
      expect(mockResponse.total).toBe(1);
      expect(mockResponse.query).toBe('pdf');
    });

    it('should return empty results for no matches', () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 0,
        query: 'zzzzzznotfound',
      };

      expect(mockResponse.results).toHaveLength(0);
      expect(mockResponse.total).toBe(0);
    });

    it('should respect limit parameter', () => {
      const limit = 5;
      const mockResponse: SearchResponse = {
        results: Array(limit).fill({} as SearchResult),
        total: 100,
        query: 'test',
      };

      expect(mockResponse.results).toHaveLength(5);
    });

    it('should support pagination with offset', () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 100,
        query: 'test',
      };

      // Offset doesn't change response structure
      expect(mockResponse).toHaveProperty('results');
      expect(mockResponse).toHaveProperty('total');
    });

    it('should include file content matches', () => {
      const mockResponse: SearchResponse = {
        results: [
          {
            skillId: 'skill-1',
            skillName: 'Code Utils',
            skillSlug: 'bob/code-utils',
            description: 'Utility functions',
            author: { name: 'Bob', emailPrefix: 'bob' },
            matchType: 'file_content',
            filePath: 'src/parser.ts',
            snippet: 'export function <b>parsePDF</b>(buffer: Buffer) {',
            rank: 0.3,
          },
        ],
        total: 1,
        query: 'parsepdf',
      };

      expect(mockResponse.results[0].matchType).toBe('file_content');
      expect(mockResponse.results[0].filePath).toBe('src/parser.ts');
      expect(mockResponse.results[0].snippet).toContain('parsePDF');
    });

    it('should include relevance ranking', () => {
      const mockResponse: SearchResponse = {
        results: [
          { skillId: '1', skillName: 'A', skillSlug: 'a', rank: 0.8 } as SearchResult,
          { skillId: '2', skillName: 'B', skillSlug: 'b', rank: 0.5 } as SearchResult,
          { skillId: '3', skillName: 'C', skillSlug: 'c', rank: 0.2 } as SearchResult,
        ],
        total: 3,
        query: 'test',
      };

      // Results should be sorted by rank descending
      const ranks = mockResponse.results.map(r => r.rank);
      expect(ranks).toEqual([0.8, 0.5, 0.2]);
    });
  });

  describe('GET /api/search?suggestions=true', () => {
    it('should return suggestions array', () => {
      const mockResponse = {
        suggestions: ['react', 'react-native', 'react-hooks'],
        query: 'rea',
      };

      expect(mockResponse.suggestions).toBeInstanceOf(Array);
      expect(mockResponse.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty for short prefix', () => {
      const mockResponse = {
        suggestions: [],
        query: 'a',
      };

      expect(mockResponse.suggestions).toHaveLength(0);
    });
  });
});
```

## Step 1.10: Testing Commands

```bash
# Run unit tests
pnpm test -- tests/unit/lib/search/index.test.ts

# Run integration tests
pnpm test -- tests/integration/api/search.test.ts

# Create and apply migration
npx prisma migrate dev --name add_fulltext_search

# Generate Prisma client
npx prisma generate

# Test search API manually
curl "http://localhost:3000/api/search?q=pdf"
curl "http://localhost:3000/api/search?q=rea&suggestions=true"
```

## Step 1.11: E2E Tests (Playwright)

**File:** `e2e/search.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Full-Text Search', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
  });

  test('should display search results for valid query', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'pdf');
    await page.press('input[placeholder*="Search"]', 'Enter');

    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Verify results are displayed
    const results = page.locator('[data-testid="search-result-item"]');
    await expect(results.first()).toBeVisible();
  });

  test('should show autocomplete suggestions', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');

    // Type partial query
    await searchInput.fill('rea');
    await searchInput.focus();

    // Wait for suggestions dropdown
    await page.waitForSelector('[data-testid="search-suggestions"]', { timeout: 5000 });

    // Verify suggestions appear
    const suggestions = page.locator('[data-testid="search-suggestion-item"]');
    await expect(suggestions.first()).toBeVisible();
  });

  test('should highlight search term in snippets', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'parse');
    await page.press('input[placeholder*="Search"]', 'Enter');

    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Check for highlighted text (mark tag)
    const highlight = page.locator('mark').first();
    await expect(highlight).toBeVisible();
  });

  test('should show file content match indicator', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'function');
    await page.press('input[placeholder*="Search"]', 'Enter');

    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Look for "Found in" text indicating file content match
    const fileMatch = page.locator('text=/Found in|Matched in/');
    await expect(fileMatch.first()).toBeVisible();
  });

  test('should focus search input with keyboard shortcut', async ({ page }) => {
    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    await page.keyboard.press('Meta+k');

    // Verify search input is focused
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeFocused();
  });

  test('should clear search and show all skills', async ({ page }) => {
    // Perform search
    await page.fill('input[placeholder*="Search"]', 'pdf');
    await page.press('input[placeholder*="Search"]', 'Enter');
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Clear search
    await page.click('[data-testid="clear-search"]');
    await page.waitForLoadState('networkidle');

    // Verify URL no longer has search param
    expect(page.url()).not.toContain('search=');
  });

  test('should show empty state for no results', async ({ page }) => {
    // Search for something unlikely to exist
    await page.fill('input[placeholder*="Search"]', 'zzzzzznotfound12345');
    await page.press('input[placeholder*="Search"]', 'Enter');

    await page.waitForSelector('text=/No results found/', { timeout: 10000 });
  });

  test('should navigate to skill detail on result click', async ({ page }) => {
    await page.fill('input[placeholder*="Search"]', 'pdf');
    await page.press('input[placeholder*="Search"]', 'Enter');

    await page.waitForSelector('[data-testid="search-result-item"]', { timeout: 10000 });

    // Click first result
    await page.click('[data-testid="search-result-item"] >> nth=0');

    // Verify navigation to skill detail page
    await page.waitForURL(/\/marketplace\//);
    expect(page.url()).toMatch(/\/marketplace\//);
  });
});

test.describe('Search API Direct Tests', () => {
  test('should return 400 for missing query', async ({ request }) => {
    const response = await request.get('/api/search');
    expect(response.status()).toBe(400);
  });

  test('should return results for valid query', async ({ request }) => {
    const response = await request.get('/api/search?q=pdf&limit=5');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('query');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should return suggestions', async ({ request }) => {
    const response = await request.get('/api/search?q=rea&suggestions=true');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('suggestions');
    expect(Array.isArray(data.suggestions)).toBe(true);
  });

  test('should respect limit parameter', async ({ request }) => {
    const response = await request.get('/api/search?q=test&limit=3');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.results.length).toBeLessThanOrEqual(3);
  });
});
```

**Test Data Setup (add to seed.ts or test fixture):**
```typescript
// Ensure test skills exist with searchable content
const testSkills = [
  {
    name: 'PDF Parser',
    description: 'Parse PDF documents',
    files: [
      { path: 'SKILL.md', content: '# PDF Parser\n\nA skill for parsing PDF files.' },
      { path: 'src/parser.ts', content: 'export function parsePDF(buffer: Buffer) { ... }' },
    ],
  },
  {
    name: 'React Utils',
    description: 'React utility functions',
    files: [
      { path: 'SKILL.md', content: '# React Utils\n\nUtility hooks for React.' },
      { path: 'src/hooks.ts', content: 'export function useReactState() { ... }' },
    ],
  },
];
```

**Run E2E Tests:**
```bash
# Run all e2e tests
pnpm test:e2e

# Run specific test file
pnpm playwright test e2e/search.spec.ts

# Run with UI for debugging
pnpm playwright test --ui e2e/search.spec.ts
```

---

# Task 2: Lazy Loading API for File Content

## Goal

Load file metadata first, fetch content only when user clicks on a file. Improves initial page load for skills with many or large files.

## When This Helps

| Scenario | Before | After |
|----------|--------|-------|
| Skill with 50 files | Load all 50 contents upfront | Load 0 contents, fetch on click |
| Skill with 200KB total content | 200KB initial payload | ~5KB metadata only |
| User only views 2 files | Wastes 196KB of data | Only loads what's needed |

## Files to Touch

| File | Action |
|------|--------|
| `src/app/api/skills/[...slug]/files/route.ts` | NEW - File content API |
| `src/middleware.ts` | Modify - Allow files API path |
| `src/components/skill/file-browser.tsx` | Modify - Lazy load content |
| `src/lib/skills/file-content.ts` | NEW - File content fetching utility |
| `tests/integration/api/skill-files.test.ts` | NEW - Integration tests |

## Step 2.1: Create File Content API

**File:** `src/app/api/skills/[...slug]/files/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isUUID } from '@/lib/slug';

/**
 * Helper to resolve skill identifier (UUID or fullSlug)
 */
async function resolveSkill(identifier: string) {
  if (isUUID(identifier)) {
    return prisma.skill.findUnique({
      where: { id: identifier },
    });
  }
  return prisma.skill.findUnique({
    where: { fullSlug: identifier },
  });
}

/**
 * @openapi
 * /skills/{id}/files:
 *   get:
 *     tags: [Skills]
 *     summary: Get file content
 *     description: Get content of a specific file within a skill's latest version
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Skill ID (UUID) or fullSlug (e.g., alice/pdf-reader)
 *       - in: path
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to the file within the skill
 *     responses:
 *       200:
 *         description: File content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 filePath:
 *                   type: string
 *                 fileType:
 *                   type: string
 *                 sizeBytes:
 *                   type: integer
 *                 content:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Skill or file not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  // Parse URL: /api/skills/{skillId}/files/{path/to/file}
  const filesIndex = slug.indexOf('files');

  if (filesIndex === -1 || filesIndex === 0 || filesIndex === slug.length - 1) {
    return NextResponse.json(
      { error: 'Invalid file path. Use /api/skills/{id}/files/{path}' },
      { status: 400 }
    );
  }

  const identifier = slug.slice(0, filesIndex).join('/');
  const filePath = slug.slice(filesIndex + 1).join('/');

  // Resolve skill
  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Get latest version
  const latestVersion = await prisma.skillVersion.findFirst({
    where: { skillId: skill.id },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  if (!latestVersion) {
    return NextResponse.json({ error: 'No versions found' }, { status: 404 });
  }

  // Find the specific file
  const file = await prisma.skillFile.findFirst({
    where: {
      skillVersionId: latestVersion.id,
      filePath,
    },
    select: {
      filePath: true,
      fileType: true,
      sizeBytes: true,
      content: true,
    },
  });

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  return NextResponse.json({
    filePath: file.filePath,
    fileType: file.fileType,
    sizeBytes: file.sizeBytes,
    content: file.content,
  });
}
```

## Step 2.2: Update Middleware

**File:** `src/middleware.ts`

Add the files API to public routes:

```typescript
// Find this section:

// Public API routes (they handle their own authentication)
if (pathname.startsWith('/api/skills') && pathname.includes('/feedback')) {
  return true;
}

// ADD: Public file content access
if (pathname.startsWith('/api/skills') && pathname.includes('/files')) {
  return true;
}
```

## Step 2.3: Create File Content Utility

**File:** `src/lib/skills/file-content.ts` (NEW)

```typescript
/**
 * Utility for fetching skill file content
 * Used by components for lazy loading
 */

export interface FileContentResponse {
  filePath: string;
  fileType: string;
  sizeBytes: number;
  content: string | null;
}

/**
 * Fetch file content from the API
 * Can be used client-side or server-side
 */
export async function fetchFileContent(
  skillId: string,
  filePath: string
): Promise<FileContentResponse | null> {
  try {
    const response = await fetch(
      `/api/skills/${skillId}/files/${filePath}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`File not found: ${filePath}`);
        return null;
      }
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
}

/**
 * Check if a file is likely to have previewable content
 */
export function isPreviewable(
  fileType: string,
  sizeBytes: number,
  maxPreviewSize = 100 * 1024 // 100KB default
): boolean {
  // Check size
  if (sizeBytes > maxPreviewSize) {
    return false;
  }

  // Check file type (text-based)
  const previewableTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/typescript',
    'application/xml',
    'application/yaml',
  ];

  return previewableTypes.some(type => fileType.startsWith(type));
}
```

## Step 2.4: Update File Browser Component

**File:** `src/components/skill/file-browser.tsx`

Add lazy loading support. Find and update the component:

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Code,
  FileText,
  Download,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MAX_CONTENT_SIZE, TEXT_FILE_EXTENSIONS, formatFileSize } from '@/lib/config/file-preview';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { fetchFileContent } from '@/lib/skills/file-content';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
  fileType?: string;
  sizeBytes?: number;
  content?: string | null;
}

// ... (keep existing buildFileTree, getFileExtension, getFileIcon, getFileCategory functions unchanged)

interface SkillFileBrowserProps {
  files: { filePath: string; fileType: string; sizeBytes: number; content?: string | null }[];
  skillId?: string;
  skillDescription?: string;
  showDownloadButton?: boolean;
  /**
   * Enable lazy loading - fetch file content only when clicked
   * Default: true for skills with >20 files, false otherwise
   */
  lazyLoad?: boolean;
}

export function SkillFileBrowser({
  files,
  skillId,
  skillDescription,
  showDownloadButton = true,
  lazyLoad: lazyLoadProp,
}: SkillFileBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | undefined>();
  const [selectedFileContent, setSelectedFileContent] = useState<string | null | undefined>();
  const [selectedFileSize, setSelectedFileSize] = useState<number | undefined>();
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Auto-enable lazy load for skills with many files
  const lazyLoad = lazyLoadProp ?? files.length > 20;

  const tree = buildFileTree(files);

  const handleToggle = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelectFile = async (
    path: string,
    name: string,
    fileType?: string,
    content?: string | null,
    sizeBytes?: number
  ) => {
    setSelectedFile(path);
    setSelectedFileName(name);
    setSelectedFileType(fileType);
    setSelectedFileSize(sizeBytes);

    // If content is provided and not empty, use it (eager mode)
    if (content !== undefined && content !== null) {
      setSelectedFileContent(content);
      return;
    }

    // If lazy loading enabled and skillId available, fetch content
    if (lazyLoad && skillId) {
      setIsLoadingContent(true);
      setSelectedFileContent(undefined); // Clear previous content

      const result = await fetchFileContent(skillId, path);
      setSelectedFileContent(result?.content ?? null);
      setIsLoadingContent(false);
    } else {
      // No content available and can't lazy load
      setSelectedFileContent(null);
    }
  };

  // ... (keep rest of component unchanged until the return statement)

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* File Tree */}
      <div className="bg-muted/30 p-2 max-h-[400px] overflow-auto">
        {tree.children?.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            level={0}
            expandedFolders={expandedFolders}
            onToggle={handleToggle}
            selectedFile={selectedFile}
            onSelectFile={handleSelectFile}
          />
        ))}
      </div>

      {/* File Preview */}
      {selectedFile && selectedFileName && (
        <div className="border-t p-4 bg-card">
          {isLoadingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading content...</span>
            </div>
          ) : (
            <FilePreview
              filename={selectedFileName}
              fileType={selectedFileType}
              filePath={selectedFile}
              fileSize={selectedFileSize}
              skillId={skillId}
              skillDescription={skillDescription}
              fileContent={selectedFileContent}
              showDownloadButton={showDownloadButton}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ... (keep FileTreeNode and FilePreview components unchanged)
```

## Step 2.5: Update Page to Use Lazy Loading

**File:** `src/app/(marketplace)/marketplace/[...slug]/page.tsx`

Find where `SkillFileBrowser` is used and update:

```typescript
// Before (loads all content upfront)
<SkillFileBrowser
  files={files}
  skillId={skill.id}
  skillDescription={skill.description}
  showDownloadButton={true}
/>

// After (lazy loads content)
<SkillFileBrowser
  files={files.map(f => ({
    filePath: f.filePath,
    fileType: f.fileType,
    sizeBytes: f.sizeBytes,
    // Don't include content - will be lazy loaded
    content: undefined,
  }))}
  skillId={skill.id}
  skillDescription={skill.description}
  showDownloadButton={true}
  lazyLoad={true}  // Explicitly enable lazy loading
/>
```

## Step 2.6: Integration Tests

**File:** `tests/integration/api/skill-files.test.ts` (NEW)

```typescript
describe('Skill Files API Integration', () => {
  describe('GET /api/skills/:id/files/:path', () => {
    it('should return file content structure', () => {
      const mockResponse = {
        filePath: 'SKILL.md',
        fileType: 'text/markdown',
        sizeBytes: 1234,
        content: '# My Skill\n\nDescription here',
      };

      expect(mockResponse).toHaveProperty('filePath');
      expect(mockResponse).toHaveProperty('fileType');
      expect(mockResponse).toHaveProperty('sizeBytes');
      expect(mockResponse).toHaveProperty('content');
    });

    it('should return 404 for non-existent skill', () => {
      const response = { error: 'Skill not found', status: 404 };
      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent file', () => {
      const response = { error: 'File not found', status: 404 };
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid path format', () => {
      const response = { error: 'Invalid file path', status: 400 };
      expect(response.status).toBe(400);
    });

    it('should handle nested file paths', () => {
      const filePath = 'scripts/utils/helper.ts';
      const expectedPath = filePath;
      expect(expectedPath).toBe('scripts/utils/helper.ts');
    });

    it('should handle skill with no versions', () => {
      const response = { error: 'No versions found', status: 404 };
      expect(response.status).toBe(404);
    });

    it('should return null content for files without stored content', () => {
      const mockResponse = {
        filePath: 'images/logo.png',
        fileType: 'image/png',
        sizeBytes: 5000,
        content: null,
      };

      expect(mockResponse.content).toBeNull();
    });

    it('should support both UUID and fullSlug identifiers', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const fullSlugPattern = /^[a-z0-9-]+\/[a-z0-9-]+$/;

      const uuid = '6ba9c581-bc1f-4287-aa20-6650b7fcb352';
      const fullSlug = 'alice/pdf-reader';

      expect(uuidPattern.test(uuid)).toBe(true);
      expect(fullSlugPattern.test(fullSlug)).toBe(true);
    });
  });

  describe('Lazy Loading Logic', () => {
    it('should auto-enable lazy load for skills with many files', () => {
      const filesCount = 25;
      const lazyLoad = filesCount > 20;
      expect(lazyLoad).toBe(true);
    });

    it('should auto-disable lazy load for skills with few files', () => {
      const filesCount = 10;
      const lazyLoad = filesCount > 20;
      expect(lazyLoad).toBe(false);
    });

    it('should respect explicit lazyLoad prop', () => {
      const filesCount = 10;
      const lazyLoadProp = true;
      const lazyLoad = lazyLoadProp ?? filesCount > 20;
      expect(lazyLoad).toBe(true);
    });
  });
});
```

## Step 2.7: Testing Commands

```bash
# Run file API tests
pnpm test -- tests/integration/api/skill-files.test.ts

# Run all integration tests
pnpm test -- tests/integration

# Test manually with curl
curl http://localhost:3000/api/skills/6ba9c581-bc1f-4287-aa20-6650b7fcb352/files/SKILL.md
curl http://localhost:3000/api/skills/alice/pdf-reader/files/src/index.ts
```

## Step 2.8: E2E Tests (Playwright)

**File:** `e2e/skill-files.spec.ts` (NEW)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Skill File Browser - Lazy Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a skill detail page
    // Replace with actual skill slug from test data
    await page.goto('/marketplace/alice/pdf-reader');
  });

  test('should display file tree on load', async ({ page }) => {
    // File tree should be visible
    const fileTree = page.locator('[data-testid="file-tree"]');
    await expect(fileTree).toBeVisible();

    // At least one file should be shown
    const fileNode = page.locator('[data-testid="file-node"]');
    await expect(fileNode.first()).toBeVisible();
  });

  test('should show loading spinner when clicking file', async ({ page }) => {
    // Click on a file in the tree
    const fileNode = page.locator('[data-testid="file-node"] >> text=.ts').first();
    await fileNode.click();

    // Loading spinner should appear briefly
    const spinner = page.locator('[data-testid="file-loading-spinner"]');
    // Spinner may appear and disappear quickly, so we check if it existed
    // or wait for content to appear
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
  });

  test('should display file content after loading', async ({ page }) => {
    // Click on SKILL.md
    await page.click('[data-testid="file-node"] >> text=SKILL.md');

    // Wait for file preview
    const preview = page.locator('[data-testid="file-preview"]');
    await expect(preview).toBeVisible({ timeout: 10000 });

    // Content should be displayed
    const content = page.locator('[data-testid="file-content"]');
    await expect(content).toBeVisible();
  });

  test('should handle nested file paths', async ({ page }) => {
    // Expand folder if exists
    const folder = page.locator('[data-testid="folder-node"]').first();
    if (await folder.isVisible()) {
      await folder.click();

      // Click on nested file
      const nestedFile = page.locator('[data-testid="file-node"]').first();
      await nestedFile.click();

      // Verify preview appears
      await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });
    }
  });

  test('should show file size in tree', async ({ page }) => {
    const fileSize = page.locator('[data-testid="file-size"]').first();
    await expect(fileSize).toBeVisible();

    // Should show size in KB or B
    const text = await fileSize.textContent();
    expect(text).toMatch(/\d+(\.\d+)?\s*(B|KB)/);
  });

  test('should support markdown rendering', async ({ page }) => {
    // Click on a markdown file
    const mdFile = page.locator('[data-testid="file-node"] >> text=.md').first();
    await mdFile.click();

    // Wait for preview
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });

    // Markdown should be rendered (look for prose class or rendered elements)
    const renderedMd = page.locator('.prose, [data-testid="markdown-content"]');
    // At minimum, content should be visible
    const content = page.locator('[data-testid="file-content"]');
    await expect(content).toBeVisible();
  });

  test('should show copy button for code files', async ({ page }) => {
    // Click on a code file
    const codeFile = page.locator('[data-testid="file-node"] >> text=.ts, [data-testid="file-node"] >> text=.js').first();
    await codeFile.click();

    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });

    // Copy button should be visible
    const copyButton = page.locator('button:has-text("Copy")');
    await expect(copyButton).toBeVisible();
  });

  test('should copy content to clipboard', async ({ page }) => {
    // Click on a file
    await page.click('[data-testid="file-node"] >> text=SKILL.md');
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Should show "Copied" feedback
    await page.waitForSelector('text=Copied', { timeout: 5000 });
  });

  test('should handle large file message', async ({ page }) => {
    // Find and click a file that might be too large
    // This depends on test data having a large file
    const largeFileIndicator = page.locator('text=/too large for preview/i');

    // If exists, verify message is shown
    if (await largeFileIndicator.isVisible()) {
      await expect(largeFileIndicator).toBeVisible();
    }
  });
});

test.describe('File Content API Direct Tests', () => {
  const testSkillId = '6ba9c581-bc1f-4287-aa20-6650b7fcb352'; // Replace with actual test skill ID

  test('should return file content', async ({ request }) => {
    const response = await request.get(`/api/skills/${testSkillId}/files/SKILL.md`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('filePath');
    expect(data).toHaveProperty('fileType');
    expect(data).toHaveProperty('sizeBytes');
    expect(data).toHaveProperty('content');
  });

  test('should return 404 for non-existent file', async ({ request }) => {
    const response = await request.get(`/api/skills/${testSkillId}/files/nonexistent.txt`);
    expect(response.status()).toBe(404);
  });

  test('should return 404 for non-existent skill', async ({ request }) => {
    const response = await request.get('/api/skills/00000000-0000-0000-0000-000000000000/files/SKILL.md');
    expect(response.status()).toBe(404);
  });

  test('should support fullSlug identifier', async ({ request }) => {
    // Replace with actual fullSlug from test data
    const response = await request.get('/api/skills/alice/pdf-reader/files/SKILL.md');
    // May be 200 or 404 depending on test data
    expect([200, 404]).toContain(response.status());
  });

  test('should handle nested paths', async ({ request }) => {
    const response = await request.get(`/api/skills/${testSkillId}/files/src/utils/helper.ts`);
    // May be 200 or 404 depending on test data
    expect([200, 404]).toContain(response.status());
  });
});

test.describe('Performance - Lazy Loading', () => {
  test('should not load all file contents on initial page load', async ({ page }) => {
    // Track network requests
    const fileApiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/files/')) {
        fileApiRequests.push(request.url());
      }
    });

    // Navigate to skill page
    await page.goto('/marketplace/alice/pdf-reader');
    await page.waitForLoadState('networkidle');

    // Should NOT have made file content requests yet
    // (files are loaded lazily on click)
    expect(fileApiRequests.length).toBe(0);
  });

  test('should load file content only when clicked', async ({ page }) => {
    let fileApiCalled = false;
    page.on('request', (request) => {
      if (request.url().includes('/files/')) {
        fileApiCalled = true;
      }
    });

    await page.goto('/marketplace/alice/pdf-reader');
    await page.waitForLoadState('networkidle');

    // Reset flag
    fileApiCalled = false;

    // Click on a file
    await page.click('[data-testid="file-node"] >> nth=0');
    await page.waitForSelector('[data-testid="file-preview"]', { timeout: 10000 });

    // NOW file API should have been called
    expect(fileApiCalled).toBe(true);
  });
});
```

**Required Test Attributes:**

Add `data-testid` attributes to components for reliable E2E testing:

**File:** `src/components/skill/file-browser.tsx`

```typescript
// Add these data-testid attributes to the component JSX:

// File tree container
<div className="bg-muted/30 p-2 max-h-[400px] overflow-auto" data-testid="file-tree">

// File node button
<button data-testid="file-node" ...>

// Folder node button
<button data-testid="folder-node" ...>

// File size span
<span data-testid="file-size" ...>

// Loading spinner
<Loader2 data-testid="file-loading-spinner" ...>

// File preview container
<div className="border-t p-4 bg-card" data-testid="file-preview">

// File content area
<div data-testid="file-content" ...>
```

**Run E2E Tests:**
```bash
# Run all e2e tests
pnpm test:e2e

# Run specific test file
pnpm playwright test e2e/skill-files.spec.ts

# Run with UI for debugging
pnpm playwright test --ui e2e/skill-files.spec.ts

# Run performance tests
pnpm playwright test e2e/skill-files.spec.ts --grep "Performance"
```

---

# E2E Testing with Agent-Browser

## Overview

The `agent-browser` skill can automate browser testing for these features. Use it to run interactive E2E tests without writing Playwright code manually.

## How to Use Agent-Browser

Invoke the skill to run browser-based tests:

```
/agent-browser
```

Then provide prompts like:

### Task 1: Full-Text Search E2E Tests

```
Navigate to http://localhost:3000/marketplace
Find the search input in the header
Type "pdf" and press Enter
Wait for results to load
Verify that search results are displayed
Take a screenshot of the results
Click on the first result
Verify we navigated to a skill detail page
```

```
Navigate to http://localhost:3000/marketplace
Click on the search input
Type "rea" slowly (character by character)
Wait 500ms between characters
Check if autocomplete suggestions appear
Take a screenshot of the suggestions dropdown
```

```
Navigate to http://localhost:3000/marketplace
Press Cmd+K (or Ctrl+K on Linux)
Verify the search input is focused
Type "test" and press Enter
Verify URL contains ?search=test
```

### Task 2: Lazy Loading E2E Tests

```
Navigate to http://localhost:3000/marketplace/alice/pdf-reader
Wait for the page to load
Take a screenshot of the file browser
Check that no file content is visible yet (only file tree)
Click on "SKILL.md" in the file tree
Wait for loading spinner to appear and disappear
Verify the file content is now displayed
Take a screenshot of the file preview
```

```
Navigate to http://localhost:3000/marketplace/alice/pdf-reader
Open browser DevTools Network tab
Refresh the page
Wait for page to fully load
Check that no /api/skills/*/files/* requests were made
Click on any file in the tree
Verify a /api/skills/*/files/* request is now made
```

## Agent-Browser Test Scenarios

### Scenario 1: Search Flow
```yaml
name: Search Flow E2E
steps:
  - action: navigate
    url: http://localhost:3000/marketplace
  - action: fill
    selector: input[placeholder*="Search"]
    value: pdf
  - action: press
    key: Enter
  - action: wait_for_selector
    selector: [data-testid="search-results"]
    timeout: 10000
  - action: assert_visible
    selector: [data-testid="search-result-item"]
  - action: screenshot
    filename: search-results.png
```

### Scenario 2: File Lazy Loading
```yaml
name: File Lazy Loading E2E
steps:
  - action: navigate
    url: http://localhost:3000/marketplace/alice/pdf-reader
  - action: wait_for_selector
    selector: [data-testid="file-tree"]
  - action: click
    selector: [data-testid="file-node"] >> nth=0
  - action: wait_for_selector
    selector: [data-testid="file-preview"]
    timeout: 10000
  - action: assert_visible
    selector: [data-testid="file-content"]
  - action: screenshot
    filename: file-preview.png
```

### Scenario 3: Keyboard Shortcut
```yaml
name: Search Keyboard Shortcut E2E
steps:
  - action: navigate
    url: http://localhost:3000/marketplace
  - action: press
    key: Meta+k  # or Ctrl+k
  - action: assert_focused
    selector: input[placeholder*="Search"]
```

## Verifying E2E Tests with Agent-Browser

After implementation, run these verification prompts:

```
Test the search feature:
1. Go to marketplace
2. Search for "parse"
3. Verify results show "Found in" indicators for file content matches
4. Click a result and verify navigation
5. Report any errors or issues found
```

```
Test the file lazy loading:
1. Go to a skill detail page
2. Check network requests - verify no /files/ API calls on load
3. Click a file in the tree
4. Verify /files/ API call is made
5. Verify content displays correctly
6. Report any issues found
```

---

# Summary

## Implementation Order

1. **Task 1: Full-Text Search** - Enables searching within file contents
2. **Task 2: Lazy Loading** - Improves performance for large skills

## No Dependencies

These tasks can be implemented independently in any order.

## Quick Reference Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- tests/unit/lib/search/index.test.ts
pnpm test -- tests/integration/api/search.test.ts
pnpm test -- tests/integration/api/skill-files.test.ts

# Create migrations
npx prisma migrate dev --name add_fulltext_search

# Generate Prisma client
npx prisma generate

# Check database
npx prisma studio
```

## Rollback Plan

**Full-Text Search:**
```sql
DROP INDEX IF EXISTS idx_skill_files_content_search;
ALTER TABLE skill_files DROP COLUMN IF EXISTS content_search;
DROP INDEX IF EXISTS idx_skills_name_trgm;
DROP INDEX IF EXISTS idx_skills_description_trgm;
```

**Lazy Loading:**
- Remove `lazyLoad` prop from `SkillFileBrowser` usage
- Delete `/api/skills/[...slug]/files/route.ts`
- Revert `file-browser.tsx` changes
