# Skill Marketplace Enhancement Plan - Technical Implementation

## Executive Summary

This plan addresses core feature enhancements for the skill marketplace:
1. **Upload Flow Automation** - Automatic spec check, AI security analysis, and evaluation queue (with warnings, not rejection)
2. **Download Enhancements** - Multiple download types (ZIP, MD, scripts) with security warnings
3. **Team Improvements** - Member contribution tracking and activity feeds
4. **Bundle Features** - Bundle download and analytics
5. **Public Analytics** - Transparent statistics with charts (including team stats)

### Key Design Decisions
- **AI Provider**: Anthropic Claude for security analysis
- **Approval Model**: No auto-rejection - skills are always approved but show security warnings on download
- **Analytics Scope**: Platform-wide + public team statistics

---

## Current State Analysis

### What Exists
- **Upload**: Basic upload at `src/app/actions/skills.ts:121` auto-approves without validation
- **Security Scanner**: Pattern-based at `src/lib/security/scanner.ts` - **manual trigger only**
- **Evaluation Queue**: BullMQ + Docker sandbox at `src/lib/eval/` - **manual trigger only**
- **Download**: ZIP only at `src/app/api/skills/[id]/download/route.ts`
- **Teams**: Complete CRUD at `src/lib/teams/index.ts`
- **Bundles**: Complete at `src/lib/bundles/index.ts`
- **Analytics**: Dashboard at `src/app/(dashboard)/dashboard/analytics/` - **behind auth**

### Gaps
- No automatic security scanning on upload
- No AI-powered security analysis
- No automatic evaluation when tests detected
- No single-file download options
- No security warnings on download
- No team contribution tracking
- No public analytics page

---

## Implementation Plan

### Phase 1: Upload Flow Automation (Critical Priority)

#### 1.1 Database Schema Changes
**File**: `prisma/schema.prisma`

Add to `SkillVersion` model:
```prisma
model SkillVersion {
  // ... existing fields
  specValidationPassed  Boolean?    @default(false)
  specValidationErrors  Json?
  aiSecurityAnalyzed    Boolean?    @default(false)
  aiSecurityReport      Json?
  processingComplete    Boolean?    @default(false)
}
```

Add new models:
```prisma
model SkillSpecification {
  id          String   @id @default(uuid())
  version     String
  schema      Json
  description String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  @@map("skill_specifications")
}

model TeamContribution {
  id              String            @id @default(uuid())
  teamId          String
  userId          String
  contributionType ContributionType
  resourceId      String?
  points          Int               @default(1)
  createdAt       DateTime          @default(now())
  team            Team              @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user            User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([teamId, userId])
  @@map("team_contributions")
}

model TeamActivity {
  id          String   @id @default(uuid())
  teamId      String
  userId      String?
  action      String
  description String
  metadata    Json?
  createdAt   DateTime @default(now())
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  @@index([teamId])
  @@map("team_activities")
}

model DownloadRecord {
  id            String        @id @default(uuid())
  skillId       String
  userId        String?
  version       String
  downloadType  DownloadType
  createdAt     DateTime      @default(now())
  skill         Skill         @relation(fields: [skillId], references: [id], onDelete: Cascade)
  @@index([skillId])
  @@map("download_records")
}

model BundleStat {
  id                String      @id @default(uuid())
  bundleId          String      @unique
  downloadsCount    Int         @default(0)
  viewsCount        Int         @default(0)
  lastDownloadedAt  DateTime?
  lastViewedAt      DateTime?
  bundle            SkillBundle @relation(fields: [bundleId], references: [id], onDelete: Cascade)
  @@map("bundle_stats")
}

enum ContributionType {
  SKILL_UPLOADED
  SKILL_DOWNLOADED
  EVAL_RUN
  SECURITY_SCAN
  BUNDLE_CREATED
  MEMBER_ADDED
}

enum DownloadType {
  FULL_ZIP
  SKILL_MD
  SCRIPTS_ZIP
  BUNDLE_ZIP
}
```

#### 1.2 New Modules

**A. Specification Checker** - `src/lib/specification/index.ts` (NEW)
```typescript
export interface SpecValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metadata: SkillMetadata;
}

export async function validateSpecification(skillBuffer: Buffer): Promise<SpecValidationResult>
export async function getActiveSpecification(): Promise<SkillSpecification | null>
```
- Validate SKILL.md structure against JSON schema
- Check required fields (name, description, version)
- Validate file structure requirements

**B. AI Security Analyzer** - `src/lib/security/ai-analyzer.ts` (NEW)
```typescript
export interface AISecurityReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: Array<{
    type: string;
    description: string;
    file?: string;
    remediation: string;
  }>;
  recommendations: string[];
  confidence: number;
}

export async function analyzeWithAI(skillBuffer: Buffer, parsedSkill: ParsedSkill): Promise<AISecurityReport>
```
- Use Anthropic Claude API for semantic threat detection
- Analyze code intent beyond pattern matching
- Provide remediation suggestions

#### 1.3 Modified Upload Flow
**File**: `src/app/actions/skills.ts`

Key changes at line 121:
```typescript
// Keep APPROVED status but trigger async processing for security/eval info
status: SkillStatus.APPROVED,

// After creating skillVersion, trigger async pipeline:
await triggerProcessingPipeline(skillVersion.id, buffer, parsedSkill, session.user.id, teamId);
```

Processing Pipeline Steps (async, non-blocking):
1. **Spec Validation** - Store results in specValidationPassed/specValidationErrors
2. **Pattern Security Scan** (existing scanner) - Store in SecurityScan
3. **AI Security Analysis** - Store in aiSecurityReport
4. **Evaluation Queue** (if tests.json exists) - Queue evaluation
5. **Mark processingComplete = true** when done

#### 1.4 New API Endpoints

- `GET /api/skills/[id]/security-status` - Returns security info for warning display

---

### Phase 2: Download Enhancements with Security Warnings

**File**: `src/app/api/skills/[id]/download/route.ts`

Add query parameter support:
- `?type=full` - Complete ZIP (default)
- `?type=md` - SKILL.md only
- `?type=scripts` - All .js/.py/.sh/.ts files as ZIP

**Security Warning Response Header**:
```typescript
// Add security warning header to all download responses
headers: {
  'X-Security-Score': String(securityScore),
  'X-Security-Risk-Level': riskLevel,
  'X-Security-Warning': riskLevel === 'critical' ? 'true' : 'false',
}
```

Implementation:
```typescript
async function downloadSkillMd(skillVersion): Promise<NextResponse>
async function downloadScriptsZip(skillVersion): Promise<NextResponse>
async function getSecurityWarningHeaders(skillVersionId): Promise<Headers>
async function trackDownload(skillId: string, type: DownloadType): Promise<void>
```

**Frontend Warning Modal** - Before download, show modal if:
- Security score < 70
- AI risk level = 'high' or 'critical'
- User must acknowledge before download proceeds

**New**: `src/app/api/bundles/[id]/download/route.ts`
- Download all skills in bundle as combined ZIP
- Aggregate security warnings for all skills
- Track bundle downloads to BundleStat

---

### Phase 3: Team Improvements

**New**: `src/lib/teams/contributions.ts`
```typescript
export async function recordContribution(teamId, userId, type, resourceId?): Promise<void>
export async function getTeamMemberStats(teamId, userId): Promise<MemberStats>
export async function getTeamLeaderboard(teamId, limit?): Promise<LeaderboardEntry[]>
```

Integration points:
- `src/app/actions/skills.ts` - Record SKILL_UPLOADED after upload
- `src/app/api/skills/[id]/download/route.ts` - Record SKILL_DOWNLOADED
- `src/lib/eval/queue.ts` - Record EVAL_RUN after completion

**New**: `src/app/api/teams/[id]/activity/route.ts`
- GET: Return paginated team activity feed

**Modified**: `src/app/(dashboard)/dashboard/teams/[id]/page.tsx`
- Add member contribution cards
- Add leaderboard table
- Add activity feed (recent 20)

---

### Phase 4: Bundle Improvements

**New**: `src/lib/bundles/analytics.ts`
```typescript
export async function getBundleAnalytics(bundleId): Promise<BundleAnalytics>
```

**Modified**: `src/lib/bundles/index.ts`
- Add bundle stats tracking on create/view

---

### Phase 5: Public Analytics Page (with Team Stats)

**New**: `src/app/analytics/page.tsx` (outside dashboard, no auth)
- Key metrics cards (total skills, downloads, teams, avg security score)
- Upload/download trend charts (30 days)
- Category distribution pie chart
- Security score distribution bar chart
- **Top Teams** section with:
  - Most skills uploaded
  - Most downloads received
  - Highest avg security score

**New**: `src/app/api/public/stats/route.ts`
- Returns public statistics (no auth required)
- Aggregates: skills, downloads, teams, security scores, categories
- **Team stats** (public teams only or teams with public stats enabled)

**New Dependency**: Add `recharts` to package.json for charts

---

## Critical Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add SpecValidation, AI fields, Contributions, Activities, DownloadRecords, BundleStats |
| `src/app/actions/skills.ts:121` | Add pipeline trigger (keep APPROVED status) |
| `src/lib/security/scanner.ts` | Reference for AI analyzer pattern |
| `src/app/api/skills/[id]/download/route.ts` | Add type parameter, security warning headers |
| `src/lib/teams/index.ts` | Add contributions relation |
| `src/lib/bundles/index.ts` | Add stats relation |

## New Files to Create

| File | Purpose |
|------|---------|
| `src/lib/specification/index.ts` | Spec validation logic |
| `src/lib/security/ai-analyzer.ts` | AI security analysis (Claude) |
| `src/lib/teams/contributions.ts` | Contribution tracking service |
| `src/lib/bundles/analytics.ts` | Bundle analytics |
| `src/app/api/skills/[id]/security-status/route.ts` | Security status API |
| `src/app/api/bundles/[id]/download/route.ts` | Bundle download |
| `src/app/api/teams/[id]/activity/route.ts` | Team activity API |
| `src/app/api/public/stats/route.ts` | Public statistics API |
| `src/app/analytics/page.tsx` | Public analytics page |
| `src/components/download/SecurityWarningModal.tsx` | Download warning modal |

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "recharts": "^2.12.0"
  }
}
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Test Plan

### Unit Tests (New)
- `tests/unit/lib/specification/index.test.ts` - Spec validation
- `tests/unit/lib/security/ai-analyzer.test.ts` - AI analysis
- `tests/unit/lib/teams/contributions.test.ts` - Contribution tracking
- `tests/unit/lib/download/index.test.ts` - Download types and security headers

### Integration Tests (Update)
- `tests/integration/api/skills.test.ts` - Upload flow with all checks
- `tests/integration/api/download.test.ts` - All download types with security headers

### E2E Tests (agent-browser)
1. **Upload Flow**
   - Upload valid skill → verify processing completes
   - Upload skill with security issues → verify APPROVED but security info stored
   - Upload skill with tests → verify evaluation queued
2. **Downloads with Warnings**
   - Download skill with low security → verify warning modal appears
   - Download skill with high security → verify no warning
   - Verify security headers in response
3. **Team Features**
   - Upload skill to team → verify contribution recorded
   - View team dashboard → verify leaderboard shows contribution
4. **Public Analytics**
   - Visit /analytics without auth → verify page loads
   - Verify charts render with data
   - Verify team stats displayed

---

## Implementation Order

1. **Week 1**: Database schema + Specification checker + AI security analyzer
2. **Week 2**: Processing pipeline + Security status API + Download warning modal
3. **Week 3**: Download enhancements + Bundle download
4. **Week 4**: Team contributions + Activity tracking
5. **Week 5**: Public analytics page (with team stats) + E2E testing

---

## Verification Steps

1. Run `pnpm prisma migrate dev` after schema changes
2. Run `pnpm test` after each module
3. Run `pnpm build` to verify no type errors
4. Use agent-browser skill for E2E verification:
   ```
   /agent-browser navigate to /analytics and verify charts and team stats render
   ```
5. Manual verification:
   - Upload a test skill with security issues → verify APPROVED status + security info stored
   - Download skill → verify security warning modal if issues exist
   - Check team contribution after upload
   - View public analytics page
