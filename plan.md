# Enterprise Agent Skill Marketplace - Grand Plan

> This document is immutable. Do not modify after initial creation.

## Vision
Build a production-ready enterprise skill marketplace for AI agents, similar to skills.sh but with enterprise-grade features: security scanning, automated evaluations, team management, skill bundles, and comprehensive analytics.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (Docker container)
- **Auth**: NextAuth.js with credentials provider
- **Validation**: skills-ref CLI tool (https://agentskills.io/integrate-skills)
- **Queue**: BullMQ + Redis (for async evals and security scans)
- **Sandbox**: Docker containers for isolated skill evaluation
- **Storage**: Local filesystem with S3-ready abstraction

## Core Features

### 1. Authentication & Authorization
- Email/password registration and login
- Secure session management with NextAuth.js
- Password reset via email (optional for MVP)
- Role-based access control (user, team admin, system admin)

### 2. Skill Management
- Upload skills as zip files
- Download skills from marketplace
- Skill spec validation using skills-ref CLI
- Follow Claude Code skills format (SKILL.md with frontmatter)
- Version management with semantic versioning
- Changelog tracking between versions

### 3. Automated Evaluation System
- Queue-based evaluation using BullMQ
- Docker sandbox for isolated skill execution
- Predefined test cases per skill
- Pass/fail results with detailed logs
- Evaluation history and trends

### 4. Security Scanner
- Code injection and malware detection
- Data exfiltration risk analysis
- Dependency vulnerability scanning
- Network behavior analysis
- Security score and detailed reports

### 5. Team Management
- Create and manage teams
- Invite team members via email
- Role assignment within teams
- Shared skill libraries per team
- Team-level permissions

### 6. Skill Bundles
- Create bundles for specific roles/use cases
- Group multiple skills into a bundle
- One-click bundle installation
- Bundle versioning
- Public/private bundle visibility

### 7. Statistics & Analytics
- Download counts per skill
- Usage metrics and trends
- Evaluation success rates
- Security score distributions
- Team usage statistics

### 8. Report Dashboard
- Admin overview dashboard
- Team performance reports
- Skill health monitoring
- Security incident reports
- Export reports as PDF/CSV

## Database Schema

### Users & Teams
```sql
users (id, email, password_hash, name, role, created_at, updated_at)
teams (id, name, slug, description, created_by, created_at)
team_members (id, team_id, user_id, role, joined_at)
```

### Skills & Versions
```sql
skills (id, name, slug, description, author_id, team_id, visibility, created_at, updated_at)
skill_versions (id, skill_id, version, changelog, file_path, created_at, created_by)
skill_files (id, skill_version_id, file_path, file_type, size_bytes)
```

### Evaluation & Security
```sql
eval_queues (id, skill_version_id, status, priority, created_at, started_at, completed_at)
eval_results (id, eval_queue_id, test_name, status, output, duration_ms, created_at)
security_scans (id, skill_version_id, status, score, report_json, created_at, completed_at)
```

### Bundles & Stats
```sql
skill_bundles (id, name, slug, description, team_id, visibility, created_at)
bundle_skills (id, bundle_id, skill_id)
skill_stats (id, skill_id, downloads_count, last_downloaded_at)
```

## Project Structure

```
skillmarketplace/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── (marketplace)/     # Public marketplace pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── skills/           # Skill-related components
│   ├── teams/            # Team management components
│   └── dashboard/        # Dashboard components
├── lib/                   # Utilities and helpers
│   ├── db/               # Database client and queries
│   ├── auth/             # Auth configuration
│   ├── skills/           # Skill validation and processing
│   ├── eval/             # Evaluation system
│   └── security/         # Security scanner
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── docker/               # Docker configurations
│   ├── postgres/         # PostgreSQL setup
│   ├── redis/            # Redis setup
│   └── sandbox/          # Evaluation sandbox
├── scripts/              # Utility scripts
├── plan.md               # This file (immutable)
└── progress.md           # Progress tracking (updated continuously)
```

## Development Phases

### Phase 1: Foundation
- Project setup with Next.js, Tailwind, shadcn/ui
- Docker PostgreSQL and Redis setup
- Database schema with Prisma

### Phase 2: Authentication
- User registration and login
- Session management
- Protected routes

### Phase 3: Core Skill Features
- Skill upload with zip extraction
- Skill validation using skills-ref
- Skill download endpoint
- Basic marketplace UI

### Phase 4: Version Management
- Semantic versioning support
- Version history
- Chelog generation
- Version comparison

### Phase 5: Evaluation System
- BullMQ queue setup
- Docker sandbox configuration
- Test case execution
- Result storage and display

### Phase 6: Security Scanner
- Code analysis module
- Dependency scanner
- Network behavior checker
- Security scoring

### Phase 7: Team Features
- Team CRUD operations
- Member management
- Team skill libraries
- Permissions system

### Phase 8: Skill Bundles
- Bundle creation and management
- Skill grouping
- Bundle installation workflow
- Bundle discovery

### Phase 9: Statistics
- Event tracking system
- Analytics dashboard
- Trend calculations
- Export functionality

### Phase 10: Admin Dashboard
- System overview
- User management
- Report generation
- Audit logs

### Phase 11: Polish & Production
- UI/UX refinements
- Error handling
- Performance optimization
- Deployment configuration

## Security Considerations

1. **Authentication**: Secure password hashing (bcrypt), JWT tokens, CSRF protection
2. **Authorization**: Row-level security, team-based permissions
3. **Skill Execution**: Docker sandbox isolation, resource limits, timeout enforcement
4. **File Upload**: Size limits, type validation, virus scanning
5. **API Security**: Rate limiting, input validation, SQL injection prevention
6. **Data Protection**: Encryption at rest, secure backups, GDPR compliance

## Success Metrics

- [ ] Users can register and login securely
- [ ] Skills can be uploaded, validated, and downloaded
- [ ] Evaluations run in isolated Docker containers
- [ ] Security scans produce actionable reports
- [ ] Teams can collaborate on skills
- [ ] Bundles simplify skill deployment
- [ ] Statistics provide actionable insights
- [ ] Admin dashboard shows system health
- [ ] Production deployment is automated

---

*This plan should not be modified.*
