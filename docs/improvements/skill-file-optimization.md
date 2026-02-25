# Skill File Storage Optimization Plan

## Overview

Three impactful improvements to the skill file storage system:
1. **Full-text Search** - Enable searching within skill file contents
2. **Content Compression** - Reduce database storage by 60-70%
3. **Lazy Loading API** - Improve performance for skills with many files

## Current Architecture

```
Upload Flow:
ZIP File → Parse → S3 (full ZIP) + DB SkillFile (metadata + content if <100KB text)

Key Files:
- prisma/schema.prisma          # SkillFile model
- src/lib/config/file-preview.ts # MAX_CONTENT_SIZE, TEXT_FILE_EXTENSIONS
- src/lib/skills/upload.ts       # processSkillUpload()
- src/components/skill/file-browser.tsx  # UI preview

Database:
- skill_files table: id, skillVersionId, filePath, fileType, sizeBytes, content (TEXT)
```

---

# Task 1: Full-Text Search on File Content

## Goal
Add PostgreSQL full-text search capability to search within skill file contents.

## Files to Touch

| File | Action |
|------|--------|
| `prisma/schema.prisma` | Add tsvector generated column and GIN index |
| `src/lib/search/skill-search.ts` | NEW - Search utility functions |
| `src/app/api/search/route.ts` | NEW - Search API endpoint |
| `tests/unit/lib/search/skill-search.test.ts` | NEW - Unit tests |
| `tests/integration/api/search.test.ts` | NEW - Integration tests |

## Step 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

Find the `SkillFile` model and add:

```prisma
model SkillFile {
  id              String      @id @default(uuid())
  skillVersionId  String
  filePath        String
  fileType        String
  sizeBytes       Int
  content         String?     @db.Text
  createdAt       DateTime    @default(now())

  // NEW: Full-text search generated column
  contentSearch   Unsupported("tsvector")?

  // Relations
  skillVersion    SkillVersion @relation(fields: [skillVersionId], references: [id], onDelete: Cascade)

  @@index([skillVersionId])
  @@map("skill_files")
}
```

**Note:** Prisma doesn't natively support tsvector, so we use `Unsupported` type and manage via raw SQL.

## Step 1.2: Create Database Migration

**Command:**
```bash
npx prisma migrate dev --name add_fulltext_search
```

**Manual SQL (if needed):**
```sql
-- Add tsvector generated column
ALTER TABLE skill_files
ADD COLUMN content_search tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(content, ''))
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX idx_skill_files_content_search ON skill_files USING GIN(content_search);

-- Optional: Create trigram index for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_skill_files_content_trgm ON skill_files USING GIN(content gin_trgm_ops);
```

## Step 1.3: Create Search Utility

**File:** `src/lib/search/skill-search.ts` (NEW)

```typescript
import { prisma } from '@/lib/db';
import { Visibility } from '@prisma/client';

export interface SearchResult {
  skillId: string;
  skillName: string;
  skillSlug: string;
  filePath: string;
  snippet: string;
  rank: number;
}

export interface SearchOptions {
  query: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Escape special characters in search query for tsquery
 */
export function sanitizeTsQuery(query: string): string {
  // Remove special tsquery characters
  return query
    .replace(/[&|!():*<>]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => `${word}:*`)  // Prefix matching
    .join(' & ');  // AND logic
}

/**
 * Search within skill file contents
 */
export async function searchSkillFiles(options: SearchOptions): Promise<SearchResult[]> {
  const { query, userId, limit = 20, offset = 0 } = options;

  const tsQuery = sanitizeTsQuery(query);
  if (!tsQuery) return [];

  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT
      s.id as "skillId",
      s.name as "skillName",
      s."fullSlug" as "skillSlug",
      sf."filePath",
      ts_headline(
        'english',
        sf.content,
        websearch_to_tsquery('english', ${query}),
        'MaxWords=50, MinWords=10, MaxFragments=3'
      ) as snippet,
      ts_rank(sf."contentSearch", websearch_to_tsquery('english', ${query})) as rank
    FROM skill_files sf
    JOIN skill_versions sv ON sf."skillVersionId" = sv.id
    JOIN skills s ON sv."skillId" = s.id
    WHERE
      sf."contentSearch" @@ websearch_to_tsquery('english', ${query})
      AND s.visibility = ${Visibility.PUBLIC}
    ORDER BY rank DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return results;
}

/**
 * Get search suggestions based on prefix
 */
export async function getSearchSuggestions(prefix: string, limit = 5): Promise<string[]> {
  if (prefix.length < 2) return [];

  const results = await prisma.$queryRaw<{ word: string }[]>`
    SELECT DISTINCT word
    FROM ts_stat($$
      SELECT "contentSearch"::text
      FROM skill_files sf
      JOIN skill_versions sv ON sf."skillVersionId" = sv.id
      JOIN skills s ON sv."skillId" = s.id
      WHERE s.visibility = ${Visibility.PUBLIC}
    $$)
    WHERE word LIKE ${prefix + '%'}
    ORDER BY word
    LIMIT ${limit}
  `;

  return results.map(r => r.word);
}
```

## Step 1.4: Create Search API Endpoint

**File:** `src/app/api/search/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchSkillFiles, getSearchSuggestions } from '@/lib/search/skill-search';

/**
 * @openapi
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Search skill file contents
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: suggestions
 *         schema:
 *           type: boolean
 *           default: false
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const suggestionsOnly = searchParams.get('suggestions') === 'true';

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    if (suggestionsOnly) {
      const suggestions = await getSearchSuggestions(query, limit);
      return NextResponse.json({ suggestions });
    }

    const results = await searchSkillFiles({ query, limit, offset });
    return NextResponse.json({ results, query, limit, offset });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

## Step 1.5: Unit Tests

**File:** `tests/unit/lib/search/skill-search.test.ts` (NEW)

```typescript
import { sanitizeTsQuery } from '@/lib/search/skill-search';

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
  });
});
```

## Step 1.6: Integration Tests

**File:** `tests/integration/api/search.test.ts` (NEW)

```typescript
import { Visibility } from '@prisma/client';

// Mock search response types
interface SearchResult {
  skillId: string;
  skillName: string;
  skillSlug: string;
  filePath: string;
  snippet: string;
  rank: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  limit: number;
  offset: number;
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
            filePath: 'SKILL.md',
            snippet: 'A <b>PDF</b> reading skill...',
            rank: 0.5,
          },
        ],
        query: 'pdf',
        limit: 20,
        offset: 0,
      };

      expect(mockResponse.results).toBeInstanceOf(Array);
      expect(mockResponse.query).toBe('pdf');
    });

    it('should return empty results for no matches', () => {
      const mockResponse: SearchResponse = {
        results: [],
        query: 'zzzzzznotfound',
        limit: 20,
        offset: 0,
      };

      expect(mockResponse.results).toHaveLength(0);
    });

    it('should respect limit parameter', () => {
      const limit = 5;
      const mockResponse: SearchResponse = {
        results: Array(limit).fill({} as SearchResult),
        query: 'test',
        limit,
        offset: 0,
      };

      expect(mockResponse.results).toHaveLength(5);
    });

    it('should support pagination with offset', () => {
      const mockResponse: SearchResponse = {
        results: [],
        query: 'test',
        limit: 20,
        offset: 20,
      };

      expect(mockResponse.offset).toBe(20);
    });
  });

  describe('Search Suggestions', () => {
    it('should return suggestions array', () => {
      const mockResponse = {
        suggestions: ['react', 'react-native', 'react-hooks'],
      };

      expect(mockResponse.suggestions).toBeInstanceOf(Array);
      expect(mockResponse.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty for short prefix', () => {
      const suggestions = ['a'].filter(w => w.length >= 2);
      expect(suggestions).toHaveLength(0);
    });
  });
});
```

## Step 1.7: Testing Commands

```bash
# Run unit tests
pnpm test -- tests/unit/lib/search/skill-search.test.ts

# Run integration tests
pnpm test -- tests/integration/api/search.test.ts

# Run all tests
pnpm test

# Apply database migration
npx prisma migrate dev --name add_fulltext_search

# Generate Prisma client
npx prisma generate
```

## Step 1.8: Manual Testing Checklist

- [ ] Search API returns results: `GET /api/search?q=pdf`
- [ ] Empty query returns 400: `GET /api/search`
- [ ] Pagination works: `GET /api/search?q=test&limit=5&offset=10`
- [ ] Suggestions work: `GET /api/search?q=rea&suggestions=true`
- [ ] Results include snippet highlighting
- [ ] Results ranked by relevance

---

# Task 2: Content Compression

## Goal
Compress file content before storing in database to reduce storage by 60-70%.

## Files to Touch

| File | Action |
|------|--------|
| `src/lib/storage/compression.ts` | NEW - Compression utilities |
| `src/lib/config/file-preview.ts` | Modify - Add compression threshold |
| `src/lib/skills/upload.ts` | Modify - Compress content before storing |
| `src/components/skill/file-browser.tsx` | Modify - Decompress for display |
| `tests/unit/lib/storage/compression.test.ts` | NEW - Unit tests |

## Step 2.1: Create Compression Utility

**File:** `src/lib/storage/compression.ts` (NEW)

```typescript
import { gzipSync, gunzipSync, brotliCompressSync, brotliDecompressSync } from 'zlib';

/**
 * Compression methods available
 */
export type CompressionMethod = 'gzip' | 'brotli' | 'none';

/**
 * Metadata header for compressed content
 * Format: [method:1byte][originalSize:4bytes][compressedData]
 */
const HEADER_SIZE = 5;
const GZIP_MARKER = 0x01;
const BROTLI_MARKER = 0x02;

/**
 * Compress content using the best method for the data
 * Returns original content if compression doesn't help
 */
export function compressContent(content: string): Buffer {
  if (!content || content.length < 100) {
    // Too small to benefit from compression
    return Buffer.from(content, 'utf-8');
  }

  const originalBuffer = Buffer.from(content, 'utf-8');
  const originalSize = originalBuffer.length;

  // Try Brotli first (better compression, slightly slower)
  const brotliCompressed = brotliCompressSync(originalBuffer, {
    quality: 4, // Balance between speed and compression
  });

  if (brotliCompressed.length < originalSize * 0.8) {
    // Only use if we save at least 20%
    const header = Buffer.alloc(HEADER_SIZE);
    header.writeUInt8(BROTLI_MARKER, 0);
    header.writeUInt32BE(originalSize, 1);
    return Buffer.concat([header, brotliCompressed]);
  }

  // Try Gzip (faster, slightly worse compression)
  const gzipCompressed = gzipSync(originalBuffer, {
    level: 6, // Default compression level
  });

  if (gzipCompressed.length < originalSize * 0.9) {
    // Only use if we save at least 10%
    const header = Buffer.alloc(HEADER_SIZE);
    header.writeUInt8(GZIP_MARKER, 0);
    header.writeUInt32BE(originalSize, 1);
    return Buffer.concat([header, gzipCompressed]);
  }

  // Compression not beneficial, return original
  return originalBuffer;
}

/**
 * Decompress content, handling both compressed and uncompressed data
 */
export function decompressContent(buffer: Buffer): string {
  if (buffer.length < HEADER_SIZE) {
    return buffer.toString('utf-8');
  }

  const marker = buffer.readUInt8(0);

  // Check if it's compressed
  if (marker === GZIP_MARKER || marker === BROTLI_MARKER) {
    const originalSize = buffer.readUInt32BE(1);
    const compressedData = buffer.subarray(HEADER_SIZE);

    let decompressed: Buffer;
    if (marker === GZIP_MARKER) {
      decompressed = gunzipSync(compressedData);
    } else {
      decompressed = brotliDecompressSync(compressedData);
    }

    // Verify size matches
    if (decompressed.length !== originalSize) {
      throw new Error(
        `Decompression size mismatch: expected ${originalSize}, got ${decompressed.length}`
      );
    }

    return decompressed.toString('utf-8');
  }

  // Not compressed, return as-is
  return buffer.toString('utf-8');
}

/**
 * Check if content appears to be compressed
 */
export function isCompressed(buffer: Buffer): boolean {
  if (buffer.length < HEADER_SIZE) return false;
  const marker = buffer.readUInt8(0);
  return marker === GZIP_MARKER || marker === BROTLI_MARKER;
}

/**
 * Get compression stats for monitoring
 */
export function getCompressionStats(
  originalSize: number,
  compressedBuffer: Buffer
): { method: CompressionMethod; originalSize: number; compressedSize: number; ratio: number } {
  if (!isCompressed(compressedBuffer)) {
    return {
      method: 'none',
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
    };
  }

  const marker = compressedBuffer.readUInt8(0);
  return {
    method: marker === BROTLI_MARKER ? 'brotli' : 'gzip',
    originalSize,
    compressedSize: compressedBuffer.length,
    ratio: compressedBuffer.length / originalSize,
  };
}
```

## Step 2.2: Update Prisma Schema

**File:** `prisma/schema.prisma`

Change the `content` field type from `String?` to `Bytes?`:

```prisma
model SkillFile {
  id              String      @id @default(uuid())
  skillVersionId  String
  filePath        String
  fileType        String
  sizeBytes       Int
  content         Bytes?      // Changed from String? to Bytes? for binary compression
  createdAt       DateTime    @default(now())

  // Full-text search (requires content as text)
  contentSearch   Unsupported("tsvector")?

  // Relations
  skillVersion    SkillVersion @relation(fields: [skillVersionId], references: [id], onDelete: Cascade)

  @@index([skillVersionId])
  @@map("skill_files")
}
```

**Migration SQL:**
```sql
-- Change content column to bytea for binary storage
ALTER TABLE skill_files ALTER COLUMN content TYPE bytea USING
  CASE WHEN content IS NULL THEN NULL
  ELSE decode(content, 'escape')
  END;
```

## Step 2.3: Update File Preview Config

**File:** `src/lib/config/file-preview.ts`

Add at the end:

```typescript
/**
 * Minimum content size for compression (in bytes)
 * Content smaller than this won't be compressed
 */
export const MIN_COMPRESSION_SIZE = 100; // bytes

/**
 * Compression threshold - only compress if savings > this percentage
 */
export const COMPRESSION_THRESHOLD = 0.1; // 10% minimum savings
```

## Step 2.4: Update Upload Logic

**File:** `src/lib/skills/upload.ts`

Add import and modify the `createMany` call:

```typescript
// Add to imports
import { compressContent } from '@/lib/storage/compression';

// Find this section (around line 239-247):
// Create skill files records with content for text files
await prisma.skillFile.createMany({
  data: parsedSkill.files.map((f) => ({
    skillVersionId: skillVersion.id,
    filePath: f.path,
    fileType: f.type,
    sizeBytes: f.size,
    content: getTextContent(f.content, f.path, f.size),
  })),
});

// REPLACE WITH:
// Create skill files records with compressed content for text files
await prisma.skillFile.createMany({
  data: parsedSkill.files.map((f) => {
    const textContent = getTextContent(f.content, f.path, f.size);
    return {
      skillVersionId: skillVersion.id,
      filePath: f.path,
      fileType: f.type,
      sizeBytes: f.size,
      // Compress content before storing
      content: textContent ? compressContent(textContent) : null,
    };
  }),
});
```

## Step 2.5: Update File Browser Component

**File:** `src/components/skill/file-browser.tsx`

The component receives content from server-side. Add a server utility first:

**File:** `src/lib/skills/file-content.ts` (NEW)

```typescript
import { decompressContent } from '@/lib/storage/compression';

/**
 * Decompress file content for display
 * Safe to call on both compressed and uncompressed content
 */
export function getFileContentForDisplay(content: Buffer | null): string | null {
  if (!content) return null;
  return decompressContent(content);
}
```

Then update where files are fetched (in server components or API routes):

```typescript
// In your server-side data fetching, decompress before sending to client
import { getFileContentForDisplay } from '@/lib/skills/file-content';

// When fetching files:
const files = await prisma.skillFile.findMany({
  where: { skillVersionId },
  select: {
    filePath: true,
    fileType: true,
    sizeBytes: true,
    content: true,
  },
});

// Decompress content before sending to client
const filesForDisplay = files.map(f => ({
  ...f,
  content: getFileContentForDisplay(f.content),
}));
```

## Step 2.6: Unit Tests

**File:** `tests/unit/lib/storage/compression.test.ts` (NEW)

```typescript
import {
  compressContent,
  decompressContent,
  isCompressed,
  getCompressionStats,
} from '@/lib/storage/compression';

describe('Compression Utilities', () => {
  describe('compressContent', () => {
    it('should not compress very small content', () => {
      const small = 'hello';
      const compressed = compressContent(small);
      expect(compressed.toString('utf-8')).toBe(small);
    });

    it('should compress repetitive content', () => {
      const repetitive = 'hello world '.repeat(100);
      const compressed = compressContent(repetitive);
      expect(compressed.length).toBeLessThan(repetitive.length);
    });

    it('should handle empty string', () => {
      const compressed = compressContent('');
      expect(compressed.toString('utf-8')).toBe('');
    });

    it('should compress code-like content', () => {
      const code = `
        function example() {
          const data = [];
          for (let i = 0; i < 1000; i++) {
            data.push({ id: i, name: 'item-' + i });
          }
          return data;
        }
      `.repeat(10);

      const compressed = compressContent(code);
      expect(compressed.length).toBeLessThan(Buffer.byteLength(code, 'utf-8'));
    });
  });

  describe('decompressContent', () => {
    it('should decompress compressed content', () => {
      const original = 'hello world '.repeat(100);
      const compressed = compressContent(original);
      const decompressed = decompressContent(compressed);
      expect(decompressed).toBe(original);
    });

    it('should handle uncompressed content', () => {
      const content = 'hello world';
      const result = decompressContent(Buffer.from(content, 'utf-8'));
      expect(result).toBe(content);
    });

    it('should round-trip correctly', () => {
      const testCases = [
        'simple text',
        'unicode: 你好世界 🌍',
        JSON.stringify({ key: 'value', nested: { a: 1, b: 2 } }),
        '<html><body>test</body></html>'.repeat(50),
      ];

      testCases.forEach(original => {
        const compressed = compressContent(original);
        const decompressed = decompressContent(compressed);
        expect(decompressed).toBe(original);
      });
    });
  });

  describe('isCompressed', () => {
    it('should return false for small uncompressed content', () => {
      const buffer = Buffer.from('hello', 'utf-8');
      expect(isCompressed(buffer)).toBe(false);
    });

    it('should return true for compressed content', () => {
      const compressed = compressContent('hello world '.repeat(100));
      expect(isCompressed(compressed)).toBe(true);
    });
  });

  describe('getCompressionStats', () => {
    it('should report stats for compressed content', () => {
      const original = 'hello world '.repeat(100);
      const originalSize = Buffer.byteLength(original, 'utf-8');
      const compressed = compressContent(original);
      const stats = getCompressionStats(originalSize, compressed);

      expect(stats.originalSize).toBe(originalSize);
      expect(stats.compressedSize).toBeLessThan(originalSize);
      expect(stats.ratio).toBeLessThan(1);
      expect(['gzip', 'brotli', 'none']).toContain(stats.method);
    });

    it('should report none for uncompressed content', () => {
      const original = 'hello';
      const buffer = Buffer.from(original, 'utf-8');
      const stats = getCompressionStats(buffer.length, buffer);

      expect(stats.method).toBe('none');
      expect(stats.ratio).toBe(1);
    });
  });
});
```

## Step 2.7: Testing Commands

```bash
# Run compression tests
pnpm test -- tests/unit/lib/storage/compression.test.ts

# Create migration
npx prisma migrate dev --name add_content_compression

# Generate client
npx prisma generate

# Test upload with new compression
# Upload a skill via UI and verify content is compressed in DB
```

## Step 2.8: Manual Testing Checklist

- [ ] Upload a skill with text files
- [ ] Verify content is stored as `bytea` in database
- [ ] Verify file preview still works in UI
- [ ] Check compression ratio in database:
  ```sql
  SELECT
    filePath,
    sizeBytes as original_size,
    LENGTH(content) as stored_size,
    ROUND(LENGTH(content)::numeric / sizeBytes, 2) as ratio
  FROM skill_files
  WHERE content IS NOT NULL
  LIMIT 10;
  ```
- [ ] Verify search still works after compression

---

# Task 3: Lazy Loading API for File Content

## Goal
Load file metadata first, fetch content only when user clicks on a file. Improves initial page load for skills with many/large files.

## Files to Touch

| File | Action |
|------|--------|
| `src/app/api/skills/[...slug]/files/[...filePath]/route.ts` | NEW - File content API |
| `src/components/skill/file-browser.tsx` | Modify - Lazy load content |
| `src/middleware.ts` | Modify - Allow files API path |
| `tests/integration/api/skill-files.test.ts` | NEW - Integration tests |

## Step 3.1: Create File Content API

**File:** `src/app/api/skills/[...slug]/files/[...filePath]/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isUUID } from '@/lib/slug';
import { decompressContent } from '@/lib/storage/compression';

// Helper to resolve skill identifier
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
 * /skills/{id}/files/{filePath}:
 *   get:
 *     tags: [Skills]
 *     summary: Get file content
 *     description: Get content of a specific file within a skill
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  // Extract skill identifier and file path
  // Format: /api/skills/{skillId}/files/{path/to/file}
  const filesIndex = slug.indexOf('files');
  if (filesIndex === -1 || filesIndex === 0 || filesIndex === slug.length - 1) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const identifier = slug.slice(0, filesIndex).join('/');
  const filePath = slug.slice(filesIndex + 1).join('/');

  const skill = await resolveSkill(identifier);

  if (!skill) {
    return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
  }

  // Get the latest version
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
      id: true,
      filePath: true,
      fileType: true,
      sizeBytes: true,
      content: true,
    },
  });

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Decompress content if needed
  const content = file.content ? decompressContent(file.content) : null;

  return NextResponse.json({
    filePath: file.filePath,
    fileType: file.fileType,
    sizeBytes: file.sizeBytes,
    content,
  });
}
```

## Step 3.2: Update Middleware

**File:** `src/middleware.ts`

Find the public API routes section and add the files path:

```typescript
// Public API routes (they handle their own authentication)
if (pathname.startsWith('/api/skills') && pathname.includes('/feedback')) {
  return true;
}

// ADD: Public file content access
if (pathname.startsWith('/api/skills') && pathname.includes('/files')) {
  return true;
}
```

## Step 3.3: Update File Browser Component

**File:** `src/components/skill/file-browser.tsx`

Add lazy loading capability:

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Code, FileText, Download, Copy, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MAX_CONTENT_SIZE, TEXT_FILE_EXTENSIONS, formatFileSize } from '@/lib/config/file-preview';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
  fileType?: string;
  sizeBytes?: number;
  content?: string | null;
  contentLoaded?: boolean; // NEW: Track if content was lazy loaded
}

// ... (keep existing buildFileTree, getFileExtension, getFileIcon, getFileCategory functions)

// NEW: Hook for lazy loading file content
function useLazyLoadContent(skillId: string | undefined) {
  const [loading, setLoading] = useState(false);

  const loadContent = async (filePath: string): Promise<string | null> => {
    if (!skillId) return null;

    setLoading(true);
    try {
      const response = await fetch(`/api/skills/${skillId}/files/${filePath}`);
      if (response.ok) {
        const data = await response.json();
        return data.content;
      }
      return null;
    } catch (error) {
      console.error('Failed to load file content:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loadContent, loading };
}

interface SkillFileBrowserProps {
  files: { filePath: string; fileType: string; sizeBytes: number; content?: string | null }[];
  skillId?: string;
  skillDescription?: string;
  showDownloadButton?: boolean;
  lazyLoad?: boolean; // NEW: Enable lazy loading
}

export function SkillFileBrowser({
  files,
  skillId,
  skillDescription,
  showDownloadButton = true,
  lazyLoad = false // NEW: Default to false for backward compatibility
}: SkillFileBrowserProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | undefined>();
  const [selectedFileContent, setSelectedFileContent] = useState<string | null | undefined>();
  const [selectedFileSize, setSelectedFileSize] = useState<number | undefined>();
  const [isLoadingContent, setIsLoadingContent] = useState(false); // NEW

  const { loadContent } = useLazyLoadContent(skillId);
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

  // NEW: Handle lazy loading
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

    // If content is provided (eager mode), use it
    if (content !== undefined) {
      setSelectedFileContent(content);
      return;
    }

    // If lazy loading enabled and content not provided, fetch it
    if (lazyLoad && skillId) {
      setIsLoadingContent(true);
      const loadedContent = await loadContent(path);
      setSelectedFileContent(loadedContent);
      setIsLoadingContent(false);
    } else {
      setSelectedFileContent(null);
    }
  };

  // ... (rest of component remains similar)

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
```

## Step 3.4: Update Page Component Usage

**File:** `src/app/(marketplace)/marketplace/[...slug]/page.tsx`

Find where `SkillFileBrowser` is used and update:

```typescript
// For skills with many files or large content, enable lazy loading
<SkillFileBrowser
  files={files}
  skillId={skill.id}
  skillDescription={skill.description}
  showDownloadButton={true}
  lazyLoad={files.length > 20} // Enable for skills with many files
/>
```

## Step 3.5: Integration Tests

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

    it('should return 400 for invalid path', () => {
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

    it('should return null content for binary files', () => {
      const mockResponse = {
        filePath: 'images/logo.png',
        fileType: 'image/png',
        sizeBytes: 5000,
        content: null,
      };

      expect(mockResponse.content).toBeNull();
    });
  });

  describe('Lazy Loading Logic', () => {
    it('should enable lazy load for skills with many files', () => {
      const filesCount = 25;
      const lazyLoad = filesCount > 20;
      expect(lazyLoad).toBe(true);
    });

    it('should disable lazy load for skills with few files', () => {
      const filesCount = 10;
      const lazyLoad = filesCount > 20;
      expect(lazyLoad).toBe(false);
    });
  });
});
```

## Step 3.6: Testing Commands

```bash
# Run file API tests
pnpm test -- tests/integration/api/skill-files.test.ts

# Run all integration tests
pnpm test -- tests/integration

# Test manually with curl
curl http://localhost:3000/api/skills/{skillId}/files/SKILL.md
```

## Step 3.7: Manual Testing Checklist

- [ ] File content API returns correct content
- [ ] File content API returns 404 for missing file
- [ ] Lazy loading shows loading spinner
- [ ] Content appears after loading
- [ ] Eager loading still works (backward compatibility)
- [ ] Works with both skill UUID and fullSlug
- [ ] Works with nested file paths (e.g., `scripts/utils/helper.ts`)

---

# Summary: Implementation Order

## Recommended Order

1. **Task 2: Content Compression** - Foundation for storage efficiency
2. **Task 1: Full-Text Search** - Builds on compressed content
3. **Task 3: Lazy Loading** - Performance optimization

## Dependencies

```
Task 2 (Compression)
    │
    ├── Required for ──► Task 1 (Search with compressed content)
    │
    └── Works with ────► Task 3 (Lazy load compressed content)
```

## Quick Reference Commands

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- tests/unit/lib/storage/compression.test.ts

# Create migrations
npx prisma migrate dev --name <migration_name>

# Generate Prisma client
npx prisma generate

# Check database
npx prisma studio
```

## Rollback Plan

If any task causes issues:

1. **Compression rollback:**
   ```sql
   ALTER TABLE skill_files ALTER COLUMN content TYPE text;
   ```
   Revert `src/lib/skills/upload.ts` changes.

2. **Search rollback:**
   ```sql
   DROP INDEX IF EXISTS idx_skill_files_content_search;
   ALTER TABLE skill_files DROP COLUMN IF EXISTS content_search;
   ```

3. **Lazy loading rollback:**
   Remove `lazyLoad` prop usage, delete files API route.
