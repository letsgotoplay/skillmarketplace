# Developer Guide: Local Setup & Operations

> A comprehensive guide for developers to set up, run, and operate the SkillHub marketplace locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Database (Prisma)](#database-prisma)
- [MinIO Object Storage](#minio-object-storage)
- [Redis & Job Queues](#redis--job-queues)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Quick Command Reference](#quick-command-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Docker & Docker Compose** | Latest | PostgreSQL, Redis, and sandbox containers |
| **Node.js** | 18+ | Runtime environment for Next.js |
| **pnpm** | 8+ | Package manager (required) |
| **Prisma CLI** | 5+ | Database ORM (installed via pnpm) |

### Verify Installation

```bash
docker --version
node --version
pnpm --version
npx prisma --version
```

---

## Local Setup

### Step 1: Clone & Install

```bash
git clone <repository-url>
cd skillmarketplace
pnpm install
```

### Step 2: Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

#### Key Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://skillmarket:skillmarket123@localhost:5432/skillmarketplace` |
| `REDIS_URL` | Redis connection for BullMQ queues | `redis://localhost:6379` |
| `S3_ENDPOINT` | MinIO/S3 endpoint | `http://localhost:9000` |
| `S3_ACCESS_KEY` | MinIO access key | `minioadmin` |
| `S3_SECRET_KEY` | MinIO secret key | `minioadmin123` |
| `S3_BUCKET` | Storage bucket name | `skillmarketplace` |
| `AI_SECURITY_API_KEY` | AI model API key for security analysis | - |
| `AI_SECURITY_MODEL` | AI model to use | `GLM-4` |

### Step 3: Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Sandbox containers
docker-compose up -d

# Start MinIO (separate command for local storage)
pnpm minio:start
```

### Step 4: Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed sample data
pnpm db:seed
```

### Step 5: Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database (Prisma)

Prisma is our ORM for PostgreSQL. Here's how to work with it effectively.

### Prisma Studio (GUI)

Visual database browser and editor:

```bash
# Open Prisma Studio on custom port (recommended: 5556)
npx prisma studio --port 5556
```

Opens a web GUI at `http://localhost:5556` where you can:

- Browse all tables and records
- Edit, create, and delete records
- Filter and sort data
- View relationships between models

### Common Commands

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate Prisma client after schema changes |
| `pnpm db:migrate` | Create & run migrations |
| `pnpm db:push` | Push schema without migrations (dev only) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed database with sample data |
| `npx prisma migrate reset` | Reset database (destructive!) |

### Querying with Prisma Client

```typescript
import { prisma } from '@/lib/prisma';

// Find all skills with filtering
const skills = await prisma.skill.findMany({
  where: { visibility: 'PUBLIC' },
  include: { author: true, versions: true },
  orderBy: { createdAt: 'desc' },
  take: 10,
});

// Create a new skill
const skill = await prisma.skill.create({
  data: {
    name: 'My Skill',
    slug: 'my-skill',
    authorId: userId,
    visibility: 'PUBLIC',
  },
});

// Update with relations
await prisma.skill.update({
  where: { id: skillId },
  data: { description: 'Updated description' },
});

// Transaction example
await prisma.$transaction([
  prisma.skill.create({ data: skillData }),
  prisma.skillStat.create({ data: { skillId: skill.id } }),
]);
```

### Schema Overview

The database schema is defined in `prisma/schema.prisma`:

| Domain | Models |
|--------|--------|
| **User & Auth** | User, UserRole |
| **Skills** | Skill, SkillVersion, SkillFile |
| **Teams** | Team, TeamMember, TeamRole |
| **Security** | SecurityScan, SecurityConfig |
| **Evaluation** | EvalQueue, EvalResult |
| **Bundles** | SkillBundle, BundleSkill, BundleStat |
| **Stats & Audit** | SkillStat, AuditLog, DownloadRecord |

### Creating a Migration

1. Modify `prisma/schema.prisma`
2. Run `pnpm db:migrate` (prompts for migration name)
3. Migration file created in `prisma/migrations/`
4. Prisma client auto-regenerated

---

## MinIO Object Storage

MinIO provides S3-compatible local storage for skill files and uploads.

### Managing MinIO

```bash
# Start MinIO container
pnpm minio:start

# Open MinIO Console in browser
pnpm minio:console
# Or visit: http://localhost:9001

# View MinIO logs
pnpm minio:logs

# Stop and remove MinIO container
pnpm minio:stop
```

### MinIO Console Credentials

| Field | Value |
|-------|-------|
| **Access Key** | `minioadmin` |
| **Secret Key** | `minioadmin123` |
| **Console URL** | `http://localhost:9001` |
| **API URL** | `http://localhost:9000` |

### Using MinIO Console

1. **Buckets**: Create/view S3 buckets (default: `skillmarketplace`)
2. **Browse**: Navigate uploaded skill ZIP files
3. **Upload/Download**: Manually manage stored files
4. **Access Policy**: Set bucket visibility settings

### Storage Architecture

```
skillmarketplace bucket/
├── skills/
│   ├── {skillId}/
│   │   └── {version}/
│   │       └── skill.zip
│   └── ...
└── temp/
    └── uploads/
```

---

## Redis & Job Queues

BullMQ with Redis handles async processing for evaluations and security scans.

### Queue System

| Queue | Purpose | Trigger |
|-------|---------|---------|
| **Security Scans** | Pattern-based + AI security analysis | Skill upload |
| **Evaluations** | Execute test cases in sandbox | Skill upload with tests |

### Redis Commands

```bash
# Check Redis connection
docker exec -it skillmarketplace-redis redis-cli ping
# Should return: PONG

# Monitor Redis commands (debugging)
docker exec -it skillmarketplace-redis redis-cli monitor

# View all keys
docker exec -it skillmarketplace-redis redis-cli KEYS "*"

# Clear all queue data (careful!)
docker exec -it skillmarketplace-redis redis-cli FLUSHDB
```

### Queue Architecture

```typescript
// Queue definitions in src/lib/queues/
import { Queue, Worker } from 'bullmq';

// Security scan queue
const securityQueue = new Queue('security-scan', {
  connection: redis,
});

// Evaluation queue
const evalQueue = new Queue('skill-evaluation', {
  connection: redis,
});
```

---

## Testing

### Unit & Integration Tests (Jest)

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

### E2E Tests (Agent Browser CLI)

E2E tests are documented as step-by-step test plans in markdown format, executed using the agent-browser CLI skill.

```bash
# Run agent-browser E2E tests
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" <commands>

# Test plans are documented in tests/e2e/*.md files
# Follow the step-by-step instructions in each test plan
```

#### Test Plan Structure

| File | Description | Priority |
|------|-------------|----------|
| `00-overview.md` | Test plan overview | - |
| `01-skill-upload-security.md` | Skill upload & security scan | P0 |
| `02-skill-search-discovery.md` | Skill search & discovery | P0 |
| `03-team-management.md` | Team management | P0 |
| `04-bundle-management.md` | Bundle management | P0-P1 |
| `05-skill-evaluation.md` | Skill evaluation tests | P0-P1 |
| `06-auth-authorization.md` | Authentication & authorization | P0 |
| `07-dashboard-analytics.md` | Dashboard & analytics | P1-P2 |
| `08-admin-operations.md` | Admin operations | P0-P2 |
| `14-summary-and-execution.md` | Summary & execution guide | - |

### Test Data & Fixtures

Test data is available in `tests/e2e/`:

**Test Users:**
| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@example.com | password123 | Admin |
| Team Owner | alice@example.com | password123 | Team Owner |
| Team Member | bob@example.com | password123 | Team Member |

**Skill Fixtures (`tests/e2e/fixtures/`):**
- `test-skill-secure.zip` - Clean skill for normal testing
- `malicious-skill.zip` - Skill with security issues
- `skill-with-tests.zip` - Skill with test cases
- `test-skill-1.zip` through `test-skill-4.zip` - For concurrent testing

---

## Project Structure

```
skillmarketplace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (marketplace)/     # Main marketplace pages
│   │   │   ├── blog/          # Blog pages
│   │   │   ├── docs/          # Documentation pages
│   │   │   ├── marketplace/   # Skill browsing
│   │   │   └── skills/        # Skill detail pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   └── ui/                # shadcn/ui components
│   ├── lib/                   # Core libraries
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── skills/           # Skill handling logic
│   │   ├── security/         # Security scanning
│   │   └── queues/           # BullMQ queue setup
│   └── types/                 # TypeScript types
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Database seeding
│   └── migrations/           # Migration history
├── tests/
│   ├── e2e/                  # Agent Browser E2E test plans
│   │   ├── fixtures/         # Test skill zip files
│   │   ├── 00-overview.md    # Test plan overview
│   │   └── *.md              # Step-by-step test scenarios
│   └── unit/                 # Jest unit tests
├── docs/
│   ├── developer-guide.md    # This file
│   └── features/             # Feature documentation
│       └── eval-framework.md # Evaluation system design
├── docker/
│   └── sandbox/              # Sandbox container for evals
├── docker-compose.yml        # Development infrastructure
├── .env.example              # Environment template
└── package.json              # Scripts and dependencies
```

---

## Quick Command Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migration |
| `pnpm db:push` | Push schema (dev) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:seed` | Seed sample data |
| `pnpm minio:start` | Start MinIO storage |
| `pnpm minio:stop` | Stop MinIO |
| `pnpm minio:console` | Open MinIO Console |
| `pnpm test` | Run unit tests |
| `agent-browser ...` | Run E2E tests (agent-browser CLI) |
| `docker-compose up -d` | Start all infrastructure |
| `docker-compose down` | Stop all infrastructure |

---

## Troubleshooting

### Database Connection Error

**Symptom**: `Can't reach database server at localhost:5432`

**Solution**:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start if not running
docker-compose up -d postgres

# Check logs
docker logs skillmarketplace-postgres
```

### Prisma Client Not Generated

**Symptom**: `Cannot find module '@prisma/client'` or type errors

**Solution**:
```bash
# Regenerate the client
pnpm db:generate

# If still failing, reinstall
rm -rf node_modules/.prisma
pnpm db:generate
```

### MinIO Bucket Not Found

**Symptom**: `NoSuchBucket: The specified bucket does not exist`

**Solution**:
1. Open MinIO Console at http://localhost:9001
2. Login with `minioadmin` / `minioadmin123`
3. Create bucket named `skillmarketplace`
4. Set bucket policy to allow uploads

### Queue Jobs Not Processing

**Symptom**: Skills stuck in "PENDING" or "SCANNING" status

**Solution**:
```bash
# Check Redis connection
docker exec -it skillmarketplace-redis redis-cli ping

# Restart Redis
docker-compose restart redis

# Check queue health
docker exec -it skillmarketplace-redis redis-cli KEYS "bull:*"
```

### Port Already in Use

**Symptom**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### E2E Tests Failing

**Symptom**: Agent browser tests timing out or failing

**Solution**:
```bash
# Ensure dev server is running
pnpm dev

# Check test plan steps in tests/e2e/*.md files
# Verify test fixtures exist in tests/e2e/fixtures/

# Ensure database is seeded
pnpm db:seed
```

---

## Additional Resources

- [Skill Specification](/docs/specification) - Learn the skill format
- [API Reference](/docs/api) - Full API documentation
- [Getting Started](/docs/getting-started) - User guide
- [Evaluation Framework](/docs/features/eval-framework.md) - Test system design

---

*Last updated: February 2026*
