# CLAUDE.md

## Project Overview

SkillHub - AI agent skill marketplace:
- Upload/host skill packages (ZIP with SKILL.md)
- Security scanning (pattern + AI analysis)
- Skill evaluation (BullMQ queue)
- Team management & bundling

## Commands

```bash
# Dev
pnpm dev                    # Start dev server
pnpm build                  # Build for production

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema to database
pnpm db:seed                # Seed test data

# Testing
pnpm test                   # Run unit tests
pnpm test:e2e               # Run E2E tests

# Environment
pnpm env:local              # Switch to local (Docker PostgreSQL + MinIO)
pnpm env:supabase           # Switch to Supabase

# Storage
pnpm minio:start            # Start local MinIO
pnpm minio:stop             # Stop MinIO

# Electron
pnpm electron:dev           # Start Electron + Next.js dev server
```

## Test Credentials

After `pnpm db:seed`:
- Admin: `admin@example.com` / `password123`
- User: `alice@example.com` / `password123`

## Architecture

```
src/
├── app/
│   ├── (auth)/             # Login, register
│   ├── (dashboard)/        # Skills, teams, bundles, admin
│   ├── (marketplace)/      # Public pages
│   ├── api/                # REST API
│   └── actions/            # Server actions
├── lib/
│   ├── security/           # Pattern scanner + AI analyzer
│   ├── eval/               # BullMQ queue & worker
│   ├── specification/      # SKILL.md parsing
│   └── storage/            # S3/MinIO
└── components/             # React components (shadcn/ui)
electron/
└── main.js                 # Electron main process
```

## Deployment

### 环境配置
- `.env.local` - 本地开发 (Docker + MinIO)
- `.env.supabase` - Supabase 生产环境

### 部署流程

```bash
# 1. 本地开发
pnpm env:local && pnpm minio:start && pnpm dev

# 2. Schema 变更
pnpm db:generate

# 3. 推送到 Supabase
pnpm env:supabase && pnpm db:push

# 4. 部署
git push origin master  # Render 自动部署
```

### Render 配置
- 敏感 env vars 用 `sync: false`，在 Dashboard 手动设置

## Package Managers

- JS/TS: `pnpm`
- Python: `uv`

## Skill Specification

### Directory Structure

A skill is a directory containing at minimum a `SKILL.md` file:

```
skill-name/
└── SKILL.md          # Required
```

### SKILL.md Format

The SKILL.md file must contain YAML frontmatter followed by Markdown content.

#### Required Frontmatter

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---
```

#### With Optional Fields

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents.
license: Apache-2.0
metadata:
  author: example-org
  version: "1.0"
---
```

### Field Reference

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | Yes | Max 64 characters. Lowercase letters, numbers, and hyphens only. Cannot start/end with `-`. No consecutive hyphens (`--`). Must match directory name. |
| `description` | Yes | Max 1024 characters. Describes what the skill does and when to use it. |
| `license` | No | License name or reference to a bundled license file. |
| `compatibility` | No | Max 500 characters. Environment requirements. |
| `metadata` | No | Arbitrary key-value mapping for additional metadata. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. (Experimental) |

### Name Field Rules

- Must be 1-64 characters
- May only contain lowercase alphanumeric characters and hyphens (`a-z`, `0-9`, `-`)
- Must not start or end with `-`
- Must not contain consecutive hyphens (`--`)
- Must match the parent directory name

**Invalid Examples:**
```yaml
name: PDF-Processing  # uppercase not allowed
name: -pdf            # cannot start with hyphen
name: pdf--processing # consecutive hyphens not allowed
```

### Optional Directories

- `scripts/` - Contains executable code that agents can run
- `references/` - Contains additional documentation (REFERENCE.md, FORMS.md, etc.)
- `assets/` - Contains static resources: templates, images, data files

### Progressive Disclosure

1. **Metadata (~100 tokens)**: `name` and `description` loaded at startup
2. **Instructions (<5000 tokens recommended)**: Full `SKILL.md` body loaded when activated
3. **Resources (as needed)**: Files in `scripts/`, `references/`, or `assets/` loaded on demand

### Validation

```bash
skills-ref validate ./my-skill
```
