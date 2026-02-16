# SkillHub - Enterprise AI Agent Skills Marketplace

A production-ready marketplace for hosting, managing, and securing AI agent skills.

## Features

- **Skill Hosting** - Upload and manage skill packages (ZIP files with SKILL.md)
- **Security Scanning** - Pattern-based + AI-powered security analysis
- **Skill Evaluation** - Automated test execution with queued processing
- **Team Management** - Collaborate on skills with team members
- **Skill Bundles** - Group related skills together
- **File Preview** - Browse skill contents before download

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Queue**: BullMQ + Redis
- **Storage**: S3/MinIO
- **AI**: Anthropic API (Claude)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Redis
- MinIO (or S3-compatible storage)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/skillmarketplace.git
cd skillmarketplace

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/skillmarketplace
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379

# Storage (MinIO/S3)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=skillmarketplace

# AI Security Analysis (optional)
AI_SECURITY_ENABLED=true
AI_SECURITY_API_KEY=your-anthropic-api-key
AI_SECURITY_BASE_URL=https://api.anthropic.com
AI_SECURITY_MODEL=claude-sonnet-4-20250514
```

## Development

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test                    # Unit tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage
pnpm test:e2e                # E2E tests

# Database
npx prisma studio --port 5556  # Open DB GUI
pnpm db:seed                    # Seed test data

# Storage
pnpm minio:start              # Start MinIO container
pnpm minio:console            # Open MinIO console
```

## Test Accounts

After running `pnpm db:seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | Admin |
| alice@example.com | password123 | User |

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── (dashboard)/      # Protected dashboard
│   ├── (marketplace)/    # Public marketplace
│   ├── api/              # REST API routes
│   └── actions/          # Server actions
├── lib/
│   ├── security/         # Security scanning (pattern + AI)
│   ├── eval/             # Evaluation queue system
│   ├── specification/    # SKILL.md parsing
│   ├── storage/          # S3/MinIO storage
│   └── teams/            # Team management
└── components/           # React components

prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Test data seeding

tests/
├── unit/                 # Jest unit tests
├── integration/          # API integration tests
└── e2e/                  # Playwright E2E tests
```

## Security Analysis

SkillHub provides two-layer security analysis:

1. **Pattern Scanner** - Regex-based detection of:
   - Code injection (eval, Function)
   - Command injection (exec, spawn)
   - Hardcoded credentials
   - Path traversal
   - And more...

2. **AI Analyzer** - Semantic analysis using Claude:
   - Context-aware vulnerability detection
   - Permission mismatch detection
   - Security recommendations

## Skill Package Format

A valid skill package is a ZIP file containing:

```
skill.zip
├── SKILL.md          # Required: Skill definition with frontmatter
├── index.js          # Main entry point
├── package.json      # Dependencies
├── prompts/          # Prompt templates
└── tests/            # Test files (optional)
```

SKILL.md format:

```markdown
---
name: my-skill
description: A helpful skill
version: 1.0.0
---

# My Skill

Detailed skill instructions...
```

## License

MIT
// Test CI/CD
