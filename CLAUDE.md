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
