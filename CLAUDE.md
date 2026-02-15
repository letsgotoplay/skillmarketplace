# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SkillHub - An enterprise AI agent skill marketplace. Key features:
- Upload/host skill packages (ZIP files with SKILL.md)
- Security scanning (pattern-based + AI analysis via Anthropic API)
- Skill evaluation/test execution (BullMQ queue)
- Team management and skill bundling
- File preview and download

## Commands

```bash
# Development
pnpm dev                    # Start Next.js dev server
pnpm build                  # Build for production

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema to database
pnpm db:migrate             # Create and run migrations
pnpm db:seed                # Seed test data
npx prisma studio --port 5556  # Open database GUI

# Testing
pnpm test                   # Run all unit tests
pnpm test tests/unit/lib/security/scanner.test.ts  # Run single test file
pnpm test:watch             # Watch mode
pnpm test:coverage          # With coverage report
pnpm test:e2e               # Run Playwright E2E tests

# Storage (MinIO)
pnpm minio:start            # Start local MinIO container
pnpm minio:stop             # Stop MinIO
pnpm minio:console          # Open MinIO console (localhost:9001)
```

## Test Credentials

After running `pnpm db:seed`:
- Admin: `admin@example.com` / `password123`
- User: `alice@example.com` / `password123`

## Architecture

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected dashboard pages
│   │   └── dashboard/
│   │       ├── skills/   # Skill management
│   │       ├── teams/    # Team management
│   │       ├── bundles/  # Skill bundles
│   │       ├── admin/    # Admin panel
│   │       └── security/ # Security scans overview
│   ├── (marketplace)/    # Public marketplace
│   ├── api/              # REST API routes
│   └── actions/          # Server actions (e.g., skill upload)
├── lib/
│   ├── security/         # Security scanning
│   │   ├── scanner.ts    # Pattern-based scanner
│   │   ├── ai-analyzer.ts # AI-powered analysis (Anthropic)
│   │   └── prompts.ts    # AI prompt templates
│   ├── eval/             # Evaluation system
│   │   ├── queue.ts      # BullMQ job queue
│   │   └── worker.ts     # Test execution worker
│   ├── specification/    # SKILL.md parsing & validation
│   ├── storage/          # S3/MinIO file storage
│   └── teams/            # Team & contribution logic
└── components/           # React components (shadcn/ui)

prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Test data seeding
└── seed-data/            # Seed data definitions

tests/
├── unit/                 # Jest unit tests
├── integration/          # API integration tests
└── e2e/                  # Playwright E2E tests
    └── fixtures/         # Test skill ZIP files
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379

# Optional - AI Security Analysis
AI_SECURITY_ENABLED=true              # Feature flag (default: true)
AI_SECURITY_API_KEY=...               # Anthropic API key
AI_SECURITY_BASE_URL=https://api.anthropic.com
AI_SECURITY_MODEL=claude-sonnet-4-20250514
```

## Key Flows

### Skill Upload
1. POST to `/api/skills` with ZIP file
2. Extract and validate SKILL.md (specification validation)
3. Run pattern-based security scan (`scanner.ts`)
4. If AI enabled, run AI security analysis (`ai-analyzer.ts`)
5. If tests included, queue evaluation job
6. Store files in S3/MinIO

### Security Analysis
- Pattern scanner: Regex-based detection of eval(), exec(), hardcoded credentials, etc.
- AI analyzer: Uses Anthropic API for semantic security analysis
- Results stored in `SecurityScan` table with `reportJson`

### Test Fixtures
See `tests/e2e/fixtures/`:
- `test-skill-secure.zip` - Clean skill
- `malicious-skill.zip` - Contains vulnerabilities for scanner testing
- `skill-with-tests.zip` - Has test suite for eval testing
- `large-skill.zip` - For performance testing

## Package Managers

- JavaScript/TypeScript: `pnpm`
- Python (if needed): `uv`
