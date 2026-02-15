# Security Scanner Improvements & Admin Re-Analysis Feature

## Overview

Two features to improve security scanning accuracy and enable admin management:

1. **Fix False Positives** - Pattern scanner flags "Bearer token123" in comments/examples as critical
2. **Admin Re-Analysis** - Allow admins to update AI prompts and re-analyze existing skills

---

## Feature 1: Pattern Scanner Accuracy Fix

### Problem
The `isInComment()` function in `src/lib/security/scanner.ts` only handles:
- Single-line comments (`//`, `#`)
- Basic multi-line comments (`/* */`)

It misses markdown code blocks, documentation sections, and placeholder values.

### Solution
Enhance context detection in `scanner.ts`:

```typescript
// New helper functions to add:
isInMarkdownCodeBlock(content, index)  // Check ``` ... ``` blocks
isInDocumentationSection(content, index) // Detect doc/reference sections
isPlaceholderValue(matchedValue) // Detect token123, xxx, your_token_here, etc.
isInExampleContext(content, index) // Detect "Example:", "e.g.", "Usage:" lines
```

### Placeholder Patterns to Skip
- `token123`, `token456` (token + digits)
- `xxx`, `xxxx` (repeated x)
- `placeholder`, `sample`, `dummy`
- `your_token_here`, `your_key_here`
- `<token>`, `[your-key]` (angle/square brackets)
- `sk-test`, `sk-dummy` (fake OpenAI keys)

### Files to Modify
| File | Changes |
|------|---------|
| `src/lib/security/scanner.ts` | Add 4 new context detection functions, refactor `isInComment()` to use unified check |

---

## Feature 2: Admin Re-Analysis Dashboard

### Database Changes

Add new model to `prisma/schema.prisma`:

```prisma
model ReanalysisJob {
  id              String    @id @default(uuid())
  status          JobStatus @default(PENDING)
  scope           String    // "all", "team:xxx", "bundle:xxx", "skills:xxx,yyy"
  securityConfigId String
  totalSkills     Int       @default(0)
  completedSkills Int       @default(0)
  failedSkills    Int       @default(0)
  startedAt       DateTime?
  completedAt     DateTime?
  error           String?
  createdBy       String
  createdAt       DateTime  @default(now())

  securityConfig  SecurityConfig @relation(fields: [securityConfigId], references: [id])

  @@map("reanalysis_jobs")
}
```

Also add relation to `SecurityConfig` model:
```prisma
model SecurityConfig {
  // ... existing fields
  reanalysisJobs  ReanalysisJob[]
}
```

### New API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/security-config` | GET | Get active security config |
| `/api/admin/security-config` | PUT | Create new config version |
| `/api/admin/security-reanalysis` | POST | Trigger batch re-analysis |
| `/api/admin/security-reanalysis/status` | GET | Get job progress/status |

### New Admin Pages

| Page | Path | Components |
|------|------|------------|
| Security Config | `/dashboard/admin/security` | Prompt editor, rules list, version history |
| Re-Analysis | `/dashboard/admin/security/reanalysis` | Scope selector, progress tracker, results table |

### Scope Selector Options
1. **All Skills** - Re-analyze all skill versions
2. **By Team** - Select team, re-analyze their skills
3. **By Bundle** - Select bundle, re-analyze bundled skills
4. **Specific Skills** - Multi-select individual skills

### New Files to Create

```
src/app/(dashboard)/dashboard/admin/
  security/
    page.tsx                    # Config editor page
    reanalysis/
      page.tsx                  # Re-analysis page
    components/
      prompt-editor.tsx         # System prompt editor
      rules-list.tsx            # Security rules list
      scope-selector.tsx        # Scope selection UI
      progress-tracker.tsx      # Real-time progress

src/app/api/admin/
  security-config/
    route.ts                    # GET/PUT config
  security-reanalysis/
    route.ts                    # POST trigger job
    status/
      route.ts                  # GET job status

src/lib/security/
  reanalysis-queue.ts           # BullMQ queue setup
  reanalysis-worker.ts          # Job processor
```

### Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `ReanalysisJob` model |
| `src/lib/security/ai-analyzer.ts` | Accept optional config parameter |
| `src/app/(dashboard)/dashboard/admin/page.tsx` | Add Security card link |

---

## Implementation Order

### Phase 1: Pattern Scanner Fix (Priority: HIGH)
1. Add context detection helper functions to `scanner.ts`
2. Refactor `isInComment()` to use unified context check
3. Add placeholder pattern detection
4. Test with real skill packages

### Phase 2: Database & API Foundation
1. Add `ReanalysisJob` model to schema
2. Run `prisma migrate dev`
3. Create security config API endpoints
4. Seed default config from existing prompts

### Phase 3: Admin UI
1. Create security config page with prompt editor
2. Create re-analysis page with scope selector
3. Implement progress tracker component
4. Wire up all API calls

### Phase 4: Queue & Worker
1. Create reanalysis queue module (follow `src/lib/eval/queue.ts` pattern)
2. Create worker to process jobs
3. Modify AI analyzer to accept config
4. Test batch processing

---

## Verification

### Pattern Scanner Testing
```bash
# Run unit tests
pnpm test src/lib/security/scanner.test.ts

# Manual test cases:
# - "Bearer token123" in ``` block should NOT be flagged
# - "Example: Bearer your_key_here" should NOT be flagged
# - Real credentials should STILL be detected
```

### Admin Feature Testing
1. Login as admin
2. Navigate to `/dashboard/admin/security`
3. Edit system prompt, save new version
4. Go to `/dashboard/admin/security/reanalysis`
5. Select "All Skills" scope, trigger re-analysis
6. Watch progress updates
7. Verify results stored in database

---

## Critical Files

- `src/lib/security/scanner.ts` - Pattern scanner to enhance
- `src/lib/security/ai-analyzer.ts` - AI analyzer to make configurable
- `prisma/schema.prisma` - Database schema
- `src/lib/eval/queue.ts` - Queue pattern to follow
- `src/lib/security/prompts.ts` - Current prompt definitions
