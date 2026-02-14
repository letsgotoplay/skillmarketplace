# E2E Test Plan - SkillHub Enterprise Marketplace

**Total Tests:** 55
**Long-Step Tests:** 12 (marked with ⭐)
**Complete Series:** 1 (Skill Upload with Security Scan - Full Lifecycle)

---

## Test Categories

| Category | Count | Long-Step |
|----------|-------|-----------|
| 1. Skill Upload & Security | 10 | 3 |
| 2. Skill Search & Discovery | 8 | 2 |
| 3. Team Management | 8 | 2 |
| 4. Bundle Management | 6 | 2 |
| 5. Skill Evaluation | 6 | 2 |
| 6. Authentication & Authorization | 5 | 0 |
| 7. Dashboard & Analytics | 4 | 0 |
| 8. Admin Operations | 4 | 1 |
| 9. Feedback & Ratings | 3 | 0 |
| 10. API & Integration | 1 | 0 |

---

# COMPLETE SERIES: Skill Upload with Security Scan Full Lifecycle

## ⭐ TC-1.1: Complete Skill Upload Flow with Security Analysis (LONG)

**Priority:** P0
**Estimated Steps:** 35+
**Type:** End-to-End Lifecycle Test

### Prerequisites
- Server running at http://localhost:3002
- Admin user logged in (admin@example.com / password123)
- Test skill zip file prepared: `test-skill-secure.zip`
- Browser: Chrome

### Test Data
```
Skill Name: test-secure-skill
Version: 1.0.0
Description: A test skill for security validation
Files: SKILL.md, index.js, package.json, test/test.js
```

### Step-by-Step Execution

```bash
# ============================================
# STEP 1-5: Initial Setup and Login
# ============================================

# Step 1: Open browser and navigate to login
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" open http://localhost:3002/login
agent-browser wait 2000
agent-browser screenshot e2e-01-login-page.png

# Step 2: Verify login page elements
agent-browser snapshot -i
# Verify: Email input, Password input, Sign in button present

# Step 3: Enter credentials
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"

# Step 4: Submit login
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000

# Step 5: Verify dashboard loaded
agent-browser snapshot -i
agent-browser screenshot e2e-02-dashboard-loaded.png
# Verify: User name "Admin User" visible, navigation menu present

# ============================================
# STEP 6-10: Navigate to Upload Page
# ============================================

# Step 6: Navigate to Skills (in dashboard nav)
agent-browser find text "Skills" click
agent-browser wait --url "**/dashboard/skills" 3000
agent-browser screenshot e2e-03-my-skills.png

# Step 7: Verify My Skills page
agent-browser snapshot -i
# Verify: Skills list, Upload button present

# Step 8: Click Upload Skill button
agent-browser find text "Upload Skill" click
agent-browser wait 2000
agent-browser screenshot e2e-04-upload-page.png

# Step 9: Verify upload form
agent-browser snapshot -i
# Verify: File upload input, Name field, Description field, Visibility toggle

# Step 10: Prepare upload form
agent-browser find 'input[name="name"]' fill "test-secure-skill"
agent-browser find 'textarea[name="description"]' fill "A test skill for security validation"

# ============================================
# STEP 11-15: Upload Skill File
# ============================================

# Step 11: Upload skill zip file
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-secure.zip"
agent-browser wait 1000

# Step 12: Verify visibility is set to Public (default)
agent-browser find 'select[name="visibility"]' snapshot
# Note: Default is already PUBLIC, no need to change

# Step 13: Submit upload form
agent-browser find 'button[type="submit"]' click
agent-browser wait 5000
agent-browser screenshot e2e-05-upload-submitted.png

# Step 14: Verify upload processing
agent-browser snapshot -i
# Verify: Upload progress indicator or success message

# Step 15: Wait for redirect to skill detail (UUID-based URL)
agent-browser wait --url "**/dashboard/skills/*" 10000
agent-browser screenshot e2e-06-skill-created.png

# ============================================
# STEP 16-20: Verify Skill Creation
# ============================================

# Step 16: Verify skill detail page
agent-browser snapshot -i
# Verify: Skill name "test-secure-skill", version 1.0.0, files tab

# Step 17: Check skill files preview
agent-browser find text "Files" click
agent-browser wait 1000
agent-browser screenshot e2e-07-files-tab.png

# Step 18: Verify file tree structure
agent-browser snapshot -i
# Verify: SKILL.md, index.js, package.json, test/test.js displayed

# Step 19: Expand and view file content
agent-browser find text "SKILL.md" click
agent-browser wait 500
agent-browser snapshot -i
# Verify: File content displayed in viewer

# Step 20: Check skill metadata (Overview tab shows details)
agent-browser find text "Overview" click
agent-browser wait 500
# Verify: Version, Author, Created date, Visibility: Public

# ============================================
# STEP 21-25: Security Scan Triggered
# ============================================

# Step 21: Navigate to Security tab
agent-browser find text "Security" click
agent-browser wait 1000
agent-browser screenshot e2e-08-security-tab.png

# Step 22: Verify security scan status
agent-browser snapshot -i
# Verify: Scan status (pending/running/completed)

# Step 23: Wait for security scan to complete (poll every 5s for max 60s)
agent-browser wait --text "Security Analysis" 60000
agent-browser screenshot e2e-09-security-completed.png

# Step 24: Verify security findings displayed
agent-browser snapshot -i
# Verify: Risk level badge, Findings count, Severity breakdown

# Step 25: Check security score
agent-browser find text "Security Score"
agent-browser snapshot -i
# Verify: Score displayed (0-100)

# ============================================
# STEP 26-30: Security Findings Details
# ============================================

# Step 26: Verify pattern scan findings section exists
agent-browser find text "Pattern Scan Results" snapshot
agent-browser screenshot e2e-10-pattern-findings.png

# Step 27: Verify pattern findings content
agent-browser snapshot -i
# Verify: Finding type, Severity, File location, Code snippet

# Step 28: Verify AI Security Analysis section exists
agent-browser find text "AI Security Analysis" snapshot
agent-browser screenshot e2e-11-ai-findings.png

# Step 29: Verify AI recommendations
agent-browser snapshot -i
# Verify: AI recommendations list, Confidence score

# Step 30: Expand a specific finding (click on finding card)
# Note: Findings are clickable cards that expand to show details
agent-browser find text "CRITICAL" click || agent-browser find text "HIGH" click || agent-browser find text "No security issues" snapshot
agent-browser wait 500
agent-browser screenshot e2e-12-finding-detail.png

# ============================================
# STEP 31-35: Evaluation Triggered (if test cases present)
# ============================================

# Step 31: Check for evaluation status
agent-browser find text "Evaluations" click
agent-browser wait 1000
agent-browser screenshot e2e-13-evaluations-tab.png

# Step 32: Verify evaluation queue
agent-browser snapshot -i
# Verify: Evaluation status (queued/running/completed/skipped)

# Step 33: If evaluation running, wait for completion
agent-browser wait --text "COMPLETED" 120000 || echo "No evaluation or still running"

# Step 34: Verify evaluation results displayed (results shown inline)
agent-browser snapshot -i
# Verify: Test results with pass/fail status displayed
agent-browser screenshot e2e-14-eval-results.png

# Step 35: Verify final skill status
agent-browser find text "Overview" click
agent-browser wait 500
agent-browser snapshot -i
# Verify: All status indicators (Upload: Complete, Security: Complete, Eval: Complete/Skipped)
```

### Expected Results

| Checkpoint | Expected Result |
|------------|-----------------|
| Login | Dashboard loads with admin name |
| Upload Page | Upload form with all required fields |
| File Upload | File accepted, progress shown |
| Skill Created | Redirect to skill detail page |
| Files Preview | File tree and content viewer working |
| Security Tab | Scan triggered automatically |
| Pattern Scan | Findings displayed with severity |
| AI Analysis | Recommendations with confidence |
| Evaluation | Triggered if test cases present |
| Final Status | All checks complete |

### Cleanup
```bash
# Delete test skill after test
# Can be done via API or admin panel
```

---

## ⭐ TC-1.2: Skill Upload with Malicious Code Detection (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Upload a skill containing intentionally malicious patterns and verify security scanner detects all threats.

### Test Data
```
Skill Name: malicious-skill-test
Files: SKILL.md, exploit.js (contains eval, exec, SQL injection patterns)
```

### Steps

```bash
# Step 1-5: Login and Navigate (same as TC-1.1)
# ... (abbreviated)

# Step 6: Upload malicious skill
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "malicious-skill-test"
agent-browser find 'input[type="file"]' set-file "./fixtures/malicious-skill.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 5000

# Step 7: Navigate to security tab
agent-browser wait --url "**/dashboard/skills/malicious-skill-test"
agent-browser find text "Security" click
agent-browser wait 3000

# Step 8: Verify HIGH severity findings
agent-browser wait --text "High Risk" 30000
agent-browser screenshot e2e-malicious-high-risk.png

# Step 9: Verify specific detection patterns
# - eval() detected
# - child_process.exec detected
# - SQL injection pattern detected
agent-browser snapshot -i
# Verify: Multiple HIGH/CRITICAL findings

# Step 10: Verify AI analysis flagged
agent-browser find text "AI Analysis" click
agent-browser wait 500
# Verify: AI detected malicious intent with high confidence

# Step 11: Verify skill status is BLOCKED or WARNING
agent-browser find text "Overview" click
# Verify: Warning banner or blocked status

# Step 12: Attempt to download blocked skill
agent-browser find text "Download" click
agent-browser wait 1000
# Verify: Download blocked with security message
```

### Expected Results
- HIGH/CRITICAL severity findings detected
- eval(), exec(), SQL injection patterns flagged
- AI analysis confirms malicious intent
- Skill marked as blocked/warning
- Download restricted

---

## TC-1.3: Skill Update with Re-scan

**Priority:** P1
**Estimated Steps:** 20+

### Description
Update an existing skill and verify security re-scan triggers.

### Steps (TBD)
1. Login and navigate to existing skill
2. Click "Update" or "Upload New Version"
3. Select updated zip file
4. Submit update
5. Verify new version created
6. Verify security re-scan triggered
7. Compare old vs new security results

---

## TC-1.4: Skill Security Status API Verification

**Priority:** P1
**Estimated Steps:** 15+

### Description
Verify security status API returns correct data after scan.

### Steps (TBD)
1. Upload skill
2. Wait for scan completion
3. Call GET /api/skills/{id}/security-status
4. Verify response schema
5. Verify findings array
6. Verify risk score calculation

---

## TC-1.5: Batch Skill Upload with Security Queue

**Priority:** P2
**Estimated Steps:** 25+

### Description
Upload multiple skills and verify security queue processes them sequentially.

### Steps (TBD)
1. Upload skill A
2. Immediately upload skill B
3. Immediately upload skill C
4. Verify all queued
5. Verify processing order
6. Verify all complete with results

---

## TC-1.6: Skill Upload with Large File

**Priority:** P2
**Estimated Steps:** 20+

### Description
Upload skill with large file size (50MB+) and verify handling.

### Steps (TBD)
1. Prepare large skill zip (50MB+)
2. Upload skill
3. Verify progress indicator
4. Wait for completion
5. Verify timeout handling
6. Verify security scan completes

---

## TC-1.7: Skill Upload Cancel/Resume

**Priority:** P3
**Estimated Steps:** 20+

### Description
Test cancel and resume during upload.

### Steps (TBD)
1. Start upload
2. Cancel mid-upload
3. Verify partial cleanup
4. Resume upload
5. Verify completion

---

## TC-1.8: Skill Security Scan Retry

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test retry mechanism for failed security scans.

### Steps (TBD)
1. Mock scan failure
2. Verify retry button appears
3. Click retry
4. Verify re-scan initiates
5. Verify completion

---

## TC-1.9: Skill with Nested Directories

**Priority:** P2
**Estimated Steps:** 20+

### Description
Upload skill with deeply nested directory structure.

### Steps (TBD)
1. Upload skill with nested dirs (5+ levels)
2. Verify file tree renders correctly
3. Verify all files scanned
4. Verify navigation in file viewer

---

## TC-1.10: Skill Security False Positive Handling

**Priority:** P3
**Estimated Steps:** 15+

### Description
Test false positive marking and handling.

### Steps (TBD)
1. Upload skill with known false positive
2. View security findings
3. Mark finding as false positive
4. Verify status update
5. Verify risk score recalculation

---

# SERIES 2: Skill Search & Discovery

## ⭐ TC-2.1: Advanced Skill Search with Filters (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Test comprehensive search functionality with multiple filters.

### Steps

```bash
# Step 1-3: Login and Navigate
agent-browser open http://localhost:3002/marketplace
agent-browser wait 2000
agent-browser screenshot e2e-marketplace.png

# Step 4: Verify initial skill grid
agent-browser snapshot -i
# Verify: Skills displayed in grid format

# Step 5: Test text search
agent-browser find 'input[placeholder*="Search"]' fill "pdf"
agent-browser wait 1500
agent-browser screenshot e2e-search-pdf.png

# Step 6: Verify search results
agent-browser snapshot -i
# Verify: Only PDF-related skills shown

# Step 7: Clear search
agent-browser find 'input[placeholder*="Search"]' fill ""
agent-browser wait 1000

# Step 8: Test category filter
agent-browser find text "Category" click
agent-browser wait 500
agent-browser find text "Document Processing" click
agent-browser wait 1500
agent-browser screenshot e2e-filter-category.png

# Step 9: Verify category filter results
agent-browser snapshot -i
# Verify: Only document processing skills

# Step 10: Test security filter - Low Risk only
agent-browser find text "Security Level" click
agent-browser wait 500
agent-browser find text "Low Risk" click
agent-browser wait 1500
agent-browser screenshot e2e-filter-security.png

# Step 11: Verify combined filters
agent-browser snapshot -i
# Verify: Skills matching both category AND security level

# Step 12: Test sort by rating
agent-browser find text "Sort by" click
agent-browser wait 500
agent-browser find text "Highest Rated" click
agent-browser wait 1500

# Step 13: Verify sort order
agent-browser snapshot -i
# Verify: Skills sorted by rating descending

# Step 14: Test sort by downloads
agent-browser find text "Sort by" click
agent-browser wait 500
agent-browser find text "Most Downloaded" click
agent-browser wait 1500

# Step 15: Test pagination
agent-browser find text "Next" click
agent-browser wait 1500
agent-browser snapshot -i
# Verify: Page 2 results

# Step 16: Test page size change
agent-browser find text "Per page" click
agent-browser wait 500
agent-browser find text "50" click
agent-browser wait 1500
# Verify: 50 skills per page

# Step 17: Clear all filters
agent-browser find text "Clear Filters" click
agent-browser wait 1500
# Verify: All skills shown, filters reset

# Step 18: Test search with special characters
agent-browser find 'input[placeholder*="Search"]' fill "skill+test"
agent-browser wait 1500
# Verify: No error, results or empty state

# Step 19: Test empty search results
agent-browser find 'input[placeholder*="Search"]' fill "zzzznonexistent"
agent-browser wait 1500
agent-browser snapshot -i
# Verify: "No results found" message

# Step 20: Verify search history (if implemented)
agent-browser find 'input[placeholder*="Search"]' fill ""
agent-browser click 'input[placeholder*="Search"]'
agent-browser wait 500
# Verify: Recent searches shown
```

---

## ⭐ TC-2.2: Skill Detail Page Full Navigation (LONG)

**Priority:** P0
**Estimated Steps:** 25+

### Description
Test all tabs and interactions on skill detail page.

### Steps

```bash
# Step 1-2: Navigate to skill
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser screenshot e2e-skill-detail.png

# Step 3: Verify overview tab (default)
agent-browser snapshot -i
# Verify: Skill name, description, stats, version selector

# Step 4: Check skill stats
agent-browser find text "Downloads"
agent-browser find text "Rating"
# Verify: Stats visible

# Step 5: Navigate to Files tab
agent-browser find text "Files" click
agent-browser wait 1000
agent-browser screenshot e2e-skill-files.png

# Step 6: Verify file tree
agent-browser snapshot -i
# Verify: Directory tree with expandable folders

# Step 7: Expand a folder
agent-browser find text "scripts" click
agent-browser wait 500
# Verify: Files inside shown

# Step 8: View file content
agent-browser find text "SKILL.md" click
agent-browser wait 1000
agent-browser screenshot e2e-file-content.png
# Verify: File content in viewer

# Step 9: Copy file content
agent-browser find text "Copy" click
agent-browser wait 500
# Verify: Copied notification

# Step 10: Download single file
agent-browser find text "Download File" click
agent-browser wait 1000
# Verify: Download started

# Step 11: Navigate to Security tab
agent-browser find text "Security" click
agent-browser wait 1000
agent-browser screenshot e2e-skill-security.png

# Step 12: Verify security summary
agent-browser snapshot -i
# Verify: Risk level, score, findings count

# Step 13: Filter by severity
agent-browser find text "high" click
agent-browser wait 500
# Verify: Only high severity shown

# Step 14: Reset filter
agent-browser find text "Show all" click
agent-browser wait 500

# Step 15: Navigate to Reviews tab
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser screenshot e2e-skill-reviews.png

# Step 16: Verify reviews display
agent-browser snapshot -i
# Verify: Rating breakdown, review list

# Step 17: Write a review (if logged in)
agent-browser find text "Write a Review" click
agent-browser wait 500
# Verify: Review form appears

# Step 18: Navigate to Versions tab
agent-browser find text "Versions" click
agent-browser wait 1000
agent-browser screenshot e2e-skill-versions.png

# Step 19: Verify version history
agent-browser snapshot -i
# Verify: Version list with dates

# Step 20: Select different version
agent-browser find text "1.0.0" click
agent-browser wait 1000
# Verify: Page updates to show v1.0.0

# Step 21: Download specific version
agent-browser find text "Download v1.0.0" click
agent-browser wait 1000
# Verify: Correct version downloaded
```

---

## TC-2.3: Marketplace Pagination

**Priority:** P1
**Estimated Steps:** 15+

### Description
Test pagination controls and behavior.

### Steps (TBD)
1. Navigate to marketplace
2. Verify page 1 of N
3. Click next page
4. Verify page 2 content
5. Test page input jump
6. Test per-page selector
7. Verify URL params update

---

## TC-2.4: Skill Search API Direct Test

**Priority:** P1
**Estimated Steps:** 10+

### Description
Test search API endpoint directly.

### Steps (TBD)
1. GET /api/skills?search=pdf
2. Verify response schema
3. Verify pagination meta
4. Test various query params
5. Verify filtering works

---

## TC-2.5: Skill Bookmark/Favorite

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test bookmark functionality.

### Steps (TBD)
1. Login
2. Navigate to skill
3. Click bookmark
4. Verify saved
5. Navigate to bookmarks
6. Verify skill listed
7. Remove bookmark
8. Verify removed

---

## TC-2.6: Skill Copy Link

**Priority:** P3
**Estimated Steps:** 10+

### Description
Test copy link functionality.

### Steps (TBD)
1. Navigate to skill
2. Click share/copy link
3. Verify notification
4. Verify clipboard

---

## TC-2.7: Skill Recommendations

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test related skills recommendations.

### Steps (TBD)
1. View skill detail
2. Scroll to recommendations
3. Verify related skills shown
4. Click recommended skill
5. Verify navigation

---

## TC-2.8: Marketplace Grid/List Toggle

**Priority:** P3
**Estimated Steps:** 10+

### Description
Test view mode toggle.

### Steps (TBD)
1. Navigate to marketplace
2. Toggle to list view
3. Verify list layout
4. Toggle back to grid
5. Verify grid layout

---

# SERIES 3: Team Management

## ⭐ TC-3.1: Complete Team Lifecycle (LONG)

**Priority:** P0
**Estimated Steps:** 35+

### Description
Create team, invite members, manage roles, and transfer ownership.

### Steps

```bash
# Step 1-5: Login as Team Owner
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000

# Step 6: Navigate to Teams
agent-browser find text "Teams" click
agent-browser wait --url "**/dashboard/teams" 3000
agent-browser screenshot e2e-teams.png

# Step 7: Click Create Team
agent-browser find text "Create Team" click
agent-browser wait 1000

# Step 8: Fill team form
agent-browser find 'input[name="name"]' fill "New Test Team"
agent-browser find 'textarea[name="description"]' fill "Team for e2e testing"
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000

# Step 9: Verify team created
agent-browser wait --url "**/dashboard/teams/**"
agent-browser screenshot e2e-team-created.png

# Step 10: Navigate to team settings
agent-browser find text "Settings" click
agent-browser wait 1000

# Step 11: Invite member
agent-browser find text "Members" click
agent-browser wait 500
agent-browser find 'input[placeholder*="email"]' fill "bob@example.com"
agent-browser find text "Invite" click
agent-browser wait 2000

# Step 12: Verify invitation sent
agent-browser snapshot -i
# Verify: Bob listed as pending

# Step 13: Logout and login as Bob
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "bob@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 14: Accept invitation
agent-browser find text "Notifications" click
agent-browser wait 1000
agent-browser find text "Accept" click
agent-browser wait 2000
agent-browser screenshot e2e-invite-accepted.png

# Step 15: Verify team membership
agent-browser find text "Teams" click
agent-browser wait 1000
# Verify: "New Test Team" visible

# Step 16: Login back as Alice
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 17: Change member role
agent-browser open http://localhost:3002/dashboard/teams/new-test-team
agent-browser find text "Members" click
agent-browser wait 500
agent-browser find text "Admin" click
agent-browser wait 1000
agent-browser screenshot e2e-role-changed.png

# Step 18: Upload skill to team
agent-browser find text "Skills" click
agent-browser wait 500
agent-browser find text "Upload Skill" click
agent-browser wait 1000
# ... upload flow

# Step 19: Verify skill visible to team
agent-browser wait --url "**/dashboard/skills/**"
agent-browser find text "Team: New Test Team"
# Verify: Team label visible

# Step 20: Test team skill visibility
# Login as Bob and verify can see team skill
# ...

# Step 21-25: Transfer ownership
agent-browser find text "Settings" click
agent-browser wait 500
agent-browser find text "Transfer Ownership" click
agent-browser wait 500
agent-browser find text "Confirm" click
agent-browser wait 2000
# Verify: Ownership transferred
```

---

## ⭐ TC-3.2: Team Skill Sharing and Permissions (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Test skill sharing between team members with different permission levels.

### Steps (TBD)
1. Create team with owner, admin, member
2. Owner uploads private skill
3. Verify admin can view/edit
4. Verify member can view only
5. Test skill assignment to team
6. Test permission changes
7. Verify access control enforced
8. Test skill sharing outside team
9. Verify notifications sent
10. Test audit log entries

---

## TC-3.3: Team Invitation Expiration

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test invitation expiration and resend.

### Steps (TBD)
1. Send invitation
2. Wait for expiration (or mock)
3. Verify expired status
4. Test resend invitation
5. Verify new link works

---

## TC-3.4: Team Member Removal

**Priority:** P1
**Estimated Steps:** 15+

### Description
Test removing team member.

### Steps (TBD)
1. Login as owner
2. Navigate to team members
3. Remove member
4. Verify removed from list
5. Verify member loses access
6. Verify skills reassigned or archived

---

## TC-3.5: Team Deletion

**Priority:** P1
**Estimated Steps:** 15+

### Description
Test team deletion flow.

### Steps (TBD)
1. Login as owner
2. Navigate to team settings
3. Initiate deletion
4. Confirm deletion
5. Verify team removed
6. Verify skills handled correctly

---

## TC-3.6: Team Usage Analytics

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test team analytics dashboard.

### Steps (TBD)
1. Navigate to team
2. View analytics tab
3. Verify skill counts
4. Verify download stats
5. Verify member activity

---

## TC-3.7: Team API Access

**Priority:** P2
**Estimated Steps:** 10+

### Description
Test team API endpoints.

### Steps (TBD)
1. GET /api/teams
2. GET /api/teams/{id}
3. POST /api/teams
4. PUT /api/teams/{id}
5. DELETE /api/teams/{id}

---

## TC-3.8: Team Contribution Tracking

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test member contribution tracking.

### Steps (TBD)
1. View team contributions
2. Verify upload counts
3. Verify review counts
4. Test leaderboard

---

# SERIES 4: Bundle Management

## ⭐ TC-4.1: Complete Bundle Lifecycle (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Create bundle, add skills, publish, and download.

### Steps

```bash
# Step 1-5: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 6: Navigate to Bundles
agent-browser find text "Bundles" click
agent-browser wait --url "**/dashboard/bundles"
agent-browser screenshot e2e-bundles.png

# Step 7: Create new bundle
agent-browser find text "Create Bundle" click
agent-browser wait 1000

# Step 8: Fill bundle info
agent-browser find 'input[name="name"]' fill "Test Document Bundle"
agent-browser find 'textarea[name="description"]' fill "Bundle for document processing"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000

# Step 9: Add skills to bundle
agent-browser find text "Add Skills" click
agent-browser wait 1000
agent-browser screenshot e2e-add-skills.png

# Step 10: Search for pdf skill
agent-browser find 'input[placeholder*="Search"]' fill "pdf"
agent-browser wait 1000

# Step 11: Add pdf skill
agent-browser find text "Add" click
agent-browser wait 500

# Step 12: Add more skills
agent-browser find 'input[placeholder*="Search"]' fill "docx"
agent-browser wait 500
agent-browser find text "Add" click

agent-browser find 'input[placeholder*="Search"]' fill "xlsx"
agent-browser wait 500
agent-browser find text "Add" click

# Step 13: Save bundle
agent-browser find text "Save" click
agent-browser wait 2000
agent-browser screenshot e2e-bundle-created.png

# Step 14: Verify bundle contents
agent-browser snapshot -i
# Verify: 3 skills in bundle

# Step 15: Preview bundle
agent-browser find text "Preview" click
agent-browser wait 1000
agent-browser screenshot e2e-bundle-preview.png

# Step 16: Publish bundle
agent-browser find text "Publish" click
agent-browser wait 2000
# Verify: Published notification

# Step 17: View in marketplace
agent-browser open http://localhost:3002/marketplace?tab=bundles
agent-browser wait 2000
agent-browser screenshot e2e-bundle-marketplace.png

# Step 18: Download bundle
agent-browser find text "Test Document Bundle" click
agent-browser wait 1000
agent-browser find text "Download Bundle" click
agent-browser wait 2000
# Verify: Download started

# Step 19: View bundle analytics
agent-browser open http://localhost:3002/dashboard/bundles/test-document-bundle
agent-browser find text "Analytics" click
agent-browser wait 1000
# Verify: Download count, views

# Step 20: Update bundle
agent-browser find text "Edit" click
agent-browser wait 500
agent-browser find text "Remove" click  # Remove one skill
agent-browser find text "Save" click
agent-browser wait 1000
# Verify: 2 skills now
```

---

## ⭐ TC-4.2: Bundle Versioning and Updates (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test bundle versioning when skills are updated.

### Steps (TBD)
1. Create bundle with skills
2. Publish bundle v1
3. Update one skill in bundle
4. Verify bundle version increments
5. Download bundle v1 vs v2
6. Verify version history
7. Test rollback capability
8. Test deprecation

---

## TC-4.3: Bundle Download with Authentication

**Priority:** P1
**Estimated Steps:** 15+

### Description
Test bundle download requires auth.

### Steps (TBD)
1. Try download without login
2. Verify redirect to login
3. Login and retry
4. Verify download succeeds

---

## TC-4.4: Bundle Skill Compatibility Check

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test skill compatibility validation in bundles.

### Steps (TBD)
1. Create bundle
2. Add incompatible skills
3. Verify warning shown
4. Test override capability
5. Verify download still works

---

## TC-4.5: Bundle Sharing

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test bundle sharing functionality.

### Steps (TBD)
1. Create private bundle
2. Share with team
3. Verify team access
4. Share public link
5. Verify public access

---

## TC-4.6: Bundle Analytics Dashboard

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test bundle analytics.

### Steps (TBD)
1. View bundle analytics
2. Verify download trends
3. Verify skill usage
4. Test export analytics

---

# SERIES 5: Skill Evaluation

## ⭐ TC-5.1: Complete Evaluation Lifecycle (LONG)

**Priority:** P0
**Estimated Steps:** 35+

### Description
Upload skill with tests, trigger evaluation, view results.

### Steps

```bash
# Step 1-5: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 6: Upload skill with tests
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "skill-with-tests"
agent-browser find 'input[type="file"]' set-file "./fixtures/skill-with-tests.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 5000

# Step 7: Wait for skill creation
agent-browser wait --url "**/dashboard/skills/skill-with-tests" 10000
agent-browser screenshot e2e-skill-with-tests.png

# Step 8: Navigate to Evaluations tab
agent-browser find text "Evaluations" click
agent-browser wait 2000

# Step 9: Verify evaluation queued
agent-browser snapshot -i
# Verify: Status "Queued" or "Running"

# Step 10: Wait for evaluation to start
agent-browser wait --text "Running" 30000 || agent-browser wait --text "Completed" 60000

# Step 11: Monitor evaluation progress
agent-browser snapshot -i
agent-browser screenshot e2e-eval-running.png

# Step 12: Wait for completion
agent-browser wait --text "Completed" 120000
agent-browser screenshot e2e-eval-completed.png

# Step 13: View evaluation results
agent-browser find text "View Results" click
agent-browser wait 2000
agent-browser screenshot e2e-eval-results.png

# Step 14: Verify test summary
agent-browser snapshot -i
# Verify: Pass/Fail counts, Duration, Coverage

# Step 15: View individual test results
agent-browser find text "Test Cases" click
agent-browser wait 1000

# Step 16: Expand passed test
agent-browser find text "passed" click
agent-browser wait 500
# Verify: Test details shown

# Step 17: View test output
agent-browser find text "View Output" click
agent-browser wait 500
# Verify: Console output visible

# Step 18: View coverage report
agent-browser find text "Coverage" click
agent-browser wait 1000
agent-browser screenshot e2e-eval-coverage.png

# Step 19: Verify coverage metrics
agent-browser snapshot -i
# Verify: Line coverage, Branch coverage, Function coverage

# Step 20: Navigate to evaluation history
agent-browser find text "History" click
agent-browser wait 1000
# Verify: All evaluations listed

# Step 21: Compare evaluations
agent-browser find text "Compare" click
agent-browser wait 1000
# Verify: Comparison view

# Step 22: Download evaluation report
agent-browser find text "Download Report" click
agent-browser wait 1000
# Verify: PDF/JSON downloaded

# Step 23: Trigger re-evaluation
agent-browser find text "Re-run Tests" click
agent-browser wait 1000
agent-browser find text "Confirm" click
agent-browser wait 2000
# Verify: New evaluation queued

# Step 24: View evaluation API
agent-browser open http://localhost:3002/api/eval/skill-with-tests
agent-browser wait 1000
# Verify: JSON response with results
```

---

## ⭐ TC-5.2: Evaluation Queue Management (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test evaluation queue processing and management.

### Steps (TBD)
1. Upload multiple skills with tests
2. View evaluation queue
3. Verify queue order
4. Test priority change
5. Test cancel evaluation
6. Test retry failed evaluation
7. Verify parallel processing limits
8. Test queue timeout handling

---

## TC-5.3: Evaluation with Failing Tests

**Priority:** P1
**Estimated Steps:** 20+

### Description
Test skill with failing test cases.

### Steps (TBD)
1. Upload skill with failing tests
2. Wait for evaluation
3. Verify failure status
4. View failure details
5. Check error messages
6. Test re-run after fix

---

## TC-5.4: Evaluation Timeout Handling

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test evaluation timeout scenarios.

### Steps (TBD)
1. Upload skill with long-running tests
2. Wait for timeout
3. Verify timeout status
4. Test configuration adjustment
5. Verify partial results

---

## TC-5.5: Evaluation Configuration

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test evaluation settings and configuration.

### Steps (TBD)
1. Navigate to eval settings
2. Configure timeout
3. Configure parallelism
4. Configure environment
5. Verify settings applied

---

## TC-5.6: Evaluation Badge Display

**Priority:** P2
**Estimated Steps:** 10+

### Description
Test evaluation badge on skill cards.

### Steps (TBD)
1. View skill with passed evaluation
2. Verify green badge
3. View skill with failed evaluation
4. Verify red badge
5. View skill without tests
6. Verify no badge or "No Tests"

---

# SERIES 6: Authentication & Authorization

## ⭐ TC-6.1: Complete User Registration Flow (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Test new user registration with email verification.

### Test Data
```
New User Email: newuser-test@example.com
Password: NewUser123!@#
Name: New Test User
```

### Steps

```bash
# Step 1: Navigate to registration page
agent-browser open http://localhost:3002/register
agent-browser wait 2000
agent-browser screenshot e2e-register-page.png

# Step 2: Verify registration form elements
agent-browser snapshot -i
# Verify: Name, Email, Password, Confirm Password fields present

# Step 3: Fill name field
agent-browser find 'input[name="name"]' fill "New Test User"
agent-browser wait 500

# Step 4: Fill email field
agent-browser find 'input[name="email"]' fill "newuser-test@example.com"
agent-browser wait 500

# Step 5: Fill password field
agent-browser find 'input[name="password"]' fill "NewUser123!@#"
agent-browser wait 500

# Step 6: Fill confirm password field
agent-browser find 'input[name="confirmPassword"]' fill "NewUser123!@#"
agent-browser wait 500

# Step 7: Submit registration
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000
agent-browser screenshot e2e-register-submitted.png

# Step 8: Verify verification email sent message
agent-browser snapshot -i
# Verify: "Verification email sent" message displayed

# Step 9: Simulate email verification (mock or use test email)
# Navigate to verification link (would come from email)
agent-browser open "http://localhost:3002/verify-email?token=test-token"
agent-browser wait 3000
agent-browser screenshot e2e-email-verified.png

# Step 10: Verify account activated
agent-browser snapshot -i
# Verify: "Email verified successfully" message

# Step 11: Navigate to login
agent-browser open http://localhost:3002/login
agent-browser wait 1000

# Step 12: Login with new credentials
agent-browser find 'input[type="email"]' fill "newuser-test@example.com"
agent-browser find 'input[type="password"]' fill "NewUser123!@#"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000

# Step 13: Verify successful login
agent-browser snapshot -i
agent-browser screenshot e2e-newuser-dashboard.png
# Verify: New user name displayed, dashboard accessible

# Step 14: Test duplicate email registration
agent-browser open http://localhost:3002/register
agent-browser wait 1000
agent-browser find 'input[name="name"]' fill "Duplicate User"
agent-browser find 'input[name="email"]' fill "newuser-test@example.com"
agent-browser find 'input[name="password"]' fill "Password123!"
agent-browser find 'input[name="confirmPassword"]' fill "Password123!"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000

# Step 15: Verify duplicate email error
agent-browser snapshot -i
# Verify: "Email already exists" error message

# Step 16: Test invalid email format
agent-browser open http://localhost:3002/register
agent-browser find 'input[name="name"]' fill "Test User"
agent-browser find 'input[name="email"]' fill "invalid-email"
agent-browser find 'input[name="password"]' fill "Password123!"
agent-browser find 'input[name="confirmPassword"]' fill "Password123!"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Validation error for email format

# Step 17: Test weak password
agent-browser find 'input[name="email"]' fill "test@example.com"
agent-browser find 'input[name="password"]' fill "123"
agent-browser find 'input[name="confirmPassword"]' fill "123"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Password strength validation error

# Step 18: Test password mismatch
agent-browser find 'input[name="password"]' fill "Password123!"
agent-browser find 'input[name="confirmPassword"]' fill "Password456!"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Password mismatch error
```

### Expected Results
- Registration form validates all fields
- Email verification required
- Duplicate email rejected
- Invalid formats caught
- Password requirements enforced

---

## ⭐ TC-6.2: Complete Password Reset Flow (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test password reset functionality end-to-end.

### Steps

```bash
# Step 1: Navigate to login page
agent-browser open http://localhost:3002/login
agent-browser wait 2000

# Step 2: Click "Forgot Password" link
agent-browser find text "Forgot Password" click
agent-browser wait --url "**/forgot-password" 2000
agent-browser screenshot e2e-forgot-password.png

# Step 3: Verify forgot password form
agent-browser snapshot -i
# Verify: Email input field present

# Step 4: Enter email for reset
agent-browser find 'input[name="email"]' fill "alice@example.com"
agent-browser wait 500

# Step 5: Submit reset request
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000
agent-browser screenshot e2e-reset-sent.png

# Step 6: Verify reset email sent
agent-browser snapshot -i
# Verify: "Reset link sent to your email" message

# Step 7: Simulate clicking reset link from email
agent-browser open "http://localhost:3002/reset-password?token=test-reset-token"
agent-browser wait 2000
agent-browser screenshot e2e-reset-password-page.png

# Step 8: Verify reset password form
agent-browser snapshot -i
# Verify: New password, Confirm password fields

# Step 9: Enter new password
agent-browser find 'input[name="password"]' fill "NewPassword123!@#"
agent-browser wait 500

# Step 10: Confirm new password
agent-browser find 'input[name="confirmPassword"]' fill "NewPassword123!@#"
agent-browser wait 500

# Step 11: Submit new password
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000
agent-browser screenshot e2e-password-reset-success.png

# Step 12: Verify password reset success
agent-browser snapshot -i
# Verify: "Password reset successfully" message

# Step 13: Login with new password
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "NewPassword123!@#"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000

# Step 14: Verify login success with new password
agent-browser snapshot -i
# Verify: Dashboard loads successfully

# Step 15: Test old password no longer works
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
# Verify: Invalid credentials error

# Step 16: Test invalid reset token
agent-browser open "http://localhost:3002/reset-password?token=invalid-token"
agent-browser wait 2000
# Verify: "Invalid or expired token" error

# Step 17: Test expired reset token
agent-browser open "http://localhost:3002/reset-password?token=expired-token"
agent-browser wait 2000
# Verify: Token expiration message, link to request new
```

### Expected Results
- Reset email triggered correctly
- Reset link validates token
- New password saved
- Old password invalidated
- Invalid/expired tokens handled

---

## TC-6.3: Session Management

**Priority:** P1
**Estimated Steps:** 20+

### Description
Test session handling and persistence.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000
agent-browser screenshot e2e-session-login.png

# Step 2: Verify session active
agent-browser snapshot -i
# Verify: User name visible, authenticated

# Step 3: Get session cookie
agent-browser get cookies
# Verify: Session cookie exists

# Step 4: Navigate away and back
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser open http://localhost:3002/dashboard
agent-browser wait 2000
# Verify: Still logged in

# Step 5: Test remember me functionality (if implemented)
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "bob@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'input[name="remember"]' click
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 6: Test session activity tracking
agent-browser open http://localhost:3002/dashboard/security
agent-browser wait 1000
# Verify: Active sessions listed

# Step 7: Test logout from single session
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser screenshot e2e-session-logout.png

# Step 8: Verify session cleared
agent-browser open http://localhost:3002/dashboard
agent-browser wait 2000
# Verify: Redirected to login

# Step 9: Test concurrent sessions
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 10: View active sessions
agent-browser open http://localhost:3002/dashboard/sessions
agent-browser wait 1000
agent-browser snapshot -i
# Verify: List of active sessions with device info

# Step 11: Logout from all other sessions
agent-browser find text "Sign out all other sessions" click
agent-browser wait 2000
# Verify: Other sessions terminated
```

### Expected Results
- Session persists across navigation
- Logout clears session
- Concurrent sessions tracked
- Can terminate other sessions

---

## ⭐ TC-6.4: Role-Based Access Control Full Test (LONG)

**Priority:** P0
**Estimated Steps:** 30+

### Description
Test RBAC for all user roles comprehensively.

### Steps

```bash
# ============================================
# PART 1: Admin Role Testing
# ============================================

# Step 1: Login as Admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000

# Step 2: Verify admin navigation
agent-browser snapshot -i
# Verify: Admin menu item visible

# Step 3: Access admin panel
agent-browser find text "Admin" click
agent-browser wait --url "**/dashboard/admin" 2000
agent-browser screenshot e2e-admin-access.png

# Step 4: Verify admin features
agent-browser snapshot -i
# Verify: User Management, System Settings, Audit Logs visible

# Step 5: Access user management
agent-browser find text "Users" click
agent-browser wait 1000
# Verify: User list with all actions available

# Step 6: Access system settings
agent-browser open http://localhost:3002/dashboard/admin/settings
agent-browser wait 1000
# Verify: All settings configurable

# Step 7: View audit logs
agent-browser open http://localhost:3002/dashboard/admin/audit-logs
agent-browser wait 1000
# Verify: Full audit log access

# ============================================
# PART 2: Team Owner Role Testing
# ============================================

# Step 8: Logout and login as Team Owner
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 9: Verify team owner features
agent-browser snapshot -i
# Verify: Teams menu visible, Admin menu hidden

# Step 10: Access teams
agent-browser find text "Teams" click
agent-browser wait 1000
# Verify: Can manage teams, invite members

# Step 11: Try accessing admin panel directly
agent-browser open http://localhost:3002/dashboard/admin
agent-browser wait 2000
agent-browser screenshot e2e-owner-admin-blocked.png
# Verify: 403 error or redirect to dashboard

# ============================================
# PART 3: Team Member Role Testing
# ============================================

# Step 12: Logout and login as Team Member
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "bob@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 13: Verify member features
agent-browser snapshot -i
# Verify: Teams visible but limited options

# Step 14: Try to invite members (should be blocked)
agent-browser open http://localhost:3002/dashboard/teams/techcorp
agent-browser wait 1000
# Verify: No invite button or disabled

# Step 15: Try accessing admin APIs
agent-browser open http://localhost:3002/api/admin/users
agent-browser wait 1000
# Verify: 403 Forbidden response

# ============================================
# PART 4: API Access Control Testing
# ============================================

# Step 16: Test API without authentication
agent-browser open http://localhost:3002/api/skills
agent-browser wait 1000
# Verify: Only public skills returned

# Step 17: Test authenticated API
# First login as admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 18: Access protected API
agent-browser open http://localhost:3002/api/skills?includePrivate=true
agent-browser wait 1000
agent-browser snapshot -i
# Verify: Private skills also returned

# Step 19: Test skill deletion permission
agent-browser open http://localhost:3002/api/skills/some-skill-id
agent-browser wait 500
# Verify: DELETE method only allowed for owner/admin

# Step 20: Verify permission error messages
agent-browser open http://localhost:3002/dashboard/admin/users
agent-browser wait 1000
agent-browser snapshot -i
# Verify: Clear error message for unauthorized access
```

### Expected Results
- Admin: Full access to all features
- Team Owner: Team management, no admin access
- Team Member: View only, limited actions
- API respects role permissions
- Clear error messages for unauthorized access

---

## TC-6.5: API Token Authentication

**Priority:** P1
**Estimated Steps:** 20+

### Description
Test API token generation and usage.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to API tokens
agent-browser find text "Settings" click
agent-browser wait 500
agent-browser find text "API Tokens" click
agent-browser wait 1000
agent-browser screenshot e2e-api-tokens.png

# Step 3: Generate new token
agent-browser find text "Generate Token" click
agent-browser wait 1000
agent-browser find 'input[name="name"]' fill "E2E Test Token"
agent-browser find 'select[name="scope"]' click
agent-browser find text "Read Only" click
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000

# Step 4: Copy generated token
agent-browser snapshot -i
# Verify: Token displayed (only shown once)
agent-browser find text "Copy" click

# Step 5: Test API with token
agent-browser open "http://localhost:3002/api/skills?api_key=GENERATED_TOKEN"
agent-browser wait 1000
# Verify: API responds with data

# Step 6: Test API without token
agent-browser open "http://localhost:3002/api/skills/private"
agent-browser wait 1000
# Verify: 401 Unauthorized

# Step 7: Test API with invalid token
agent-browser open "http://localhost:3002/api/skills?api_key=invalid_token"
agent-browser wait 1000
# Verify: 401 Unauthorized

# Step 8: Revoke token
agent-browser open http://localhost:3002/dashboard/settings/api-tokens
agent-browser wait 1000
agent-browser find text "Revoke" click
agent-browser wait 1000
agent-browser find text "Confirm" click
agent-browser wait 1000

# Step 9: Verify revoked token fails
agent-browser open "http://localhost:3002/api/skills?api_key=REVOKED_TOKEN"
agent-browser wait 1000
# Verify: 401 Unauthorized
```

### Expected Results
- Token generation works
- Token provides API access
- Invalid tokens rejected
- Token revocation effective

---

# SERIES 7: Dashboard & Analytics

## ⭐ TC-7.1: Complete Dashboard Overview (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test all dashboard components and interactions.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard" 5000
agent-browser screenshot e2e-dashboard-overview.png

# Step 2: Verify dashboard loads
agent-browser snapshot -i
# Verify: Welcome message with user name

# Step 3: Verify stats cards
agent-browser find text "Total Skills"
agent-browser find text "Downloads"
agent-browser find text "Teams"
agent-browser find text "Evaluations"
# Verify: All stat cards visible with numbers

# Step 4: Check skill count card
agent-browser snapshot -i
# Verify: Skill count matches user's skills

# Step 5: Check download count
agent-browser find text "Downloads" click
agent-browser wait 500
# Verify: Download trend or breakdown shown

# Step 6: Verify recent activity section
agent-browser find text "Recent Activity"
agent-browser wait 500
# Verify: Activity list with timestamps

# Step 7: Check activity item details
agent-browser snapshot -i
# Verify: Activity type, skill name, timestamp

# Step 8: Navigate to My Skills from dashboard
agent-browser find text "View All Skills" click
agent-browser wait --url "**/dashboard/skills" 2000
agent-browser screenshot e2e-dashboard-skills.png

# Step 9: Return to dashboard
agent-browser find text "Dashboard" click
agent-browser wait --url "**/dashboard" 1000

# Step 10: Check quick actions
agent-browser find text "Upload Skill"
agent-browser find text "Create Team"
agent-browser find text "New Bundle"
# Verify: Quick action buttons present

# Step 11: Test quick action - Upload Skill
agent-browser find text "Upload Skill" click
agent-browser wait 1000
# Verify: Navigated to upload page
agent-browser screenshot e2e-quick-upload.png

# Step 12: Return to dashboard
agent-browser open http://localhost:3002/dashboard
agent-browser wait 1000

# Step 13: Verify security summary widget
agent-browser find text "Security Overview"
agent-browser wait 500
# Verify: Security stats displayed

# Step 14: Check evaluation queue widget
agent-browser find text "Evaluation Queue"
agent-browser wait 500
# Verify: Pending evaluations shown

# Step 15: Verify notifications widget
agent-browser find text "Notifications"
agent-browser wait 500
# Verify: Recent notifications listed

# Step 16: Click notification
agent-browser find text "View All Notifications" click
agent-browser wait 1000
# Verify: Navigated to notifications page

# Step 17: Return to dashboard
agent-browser open http://localhost:3002/dashboard
agent-browser wait 1000

# Step 18: Test dashboard responsiveness (resize)
# Take screenshot at different viewport
agent-browser screenshot e2e-dashboard-full.png

# Step 19: Verify charts render
agent-browser find text "Downloads Over Time"
agent-browser wait 500
# Verify: Chart displayed correctly

# Step 20: Interact with chart (hover/click)
agent-browser find '.chart-container' click
agent-browser wait 500
# Verify: Chart interaction works

# Step 21: Check team activity widget
agent-browser find text "Team Activity"
agent-browser wait 500
# Verify: Team contributions shown

# Step 22: Test dashboard refresh
agent-browser refresh
agent-browser wait 3000
# Verify: Dashboard reloads with updated data

# Step 23: Verify data refresh
agent-browser snapshot -i
# Verify: Stats updated (if applicable)
```

### Expected Results
- All widgets load correctly
- Stats cards display accurate data
- Quick actions work
- Charts render and are interactive
- Recent activity shows correctly
- Navigation works from dashboard

---

## ⭐ TC-7.2: Analytics Dashboard with Charts (LONG)

**Priority:** P2
**Estimated Steps:** 25+

### Description
Test analytics visualizations and data export.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to Analytics
agent-browser find text "Analytics" click
agent-browser wait --url "**/dashboard/analytics" 2000
agent-browser screenshot e2e-analytics-page.png

# Step 3: Verify analytics page loads
agent-browser snapshot -i
# Verify: Charts, filters, date range selector

# Step 4: Check overview stats
agent-browser find text "Total Downloads"
agent-browser find text "Active Users"
agent-browser find text "Skill Views"
# Verify: Stats displayed

# Step 5: Verify download chart
agent-browser find text "Downloads Over Time"
agent-browser wait 500
# Verify: Line/bar chart displayed

# Step 6: Test date range selector
agent-browser find text "Last 7 days" click
agent-browser wait 500
agent-browser snapshot -i
# Verify: Date dropdown opens

# Step 7: Select different range
agent-browser find text "Last 30 days" click
agent-browser wait 2000
agent-browser screenshot e2e-analytics-30days.png
# Verify: Chart updates with new data

# Step 8: Select custom range
agent-browser find text "Date Range" click
agent-browser wait 500
# Set custom dates (if date picker available)

# Step 9: Verify skill popularity chart
agent-browser find text "Most Popular Skills"
agent-browser wait 500
# Verify: Bar chart with skill names

# Step 10: Check category breakdown
agent-browser find text "By Category"
agent-browser wait 500
# Verify: Pie/donut chart

# Step 11: Verify security analytics
agent-browser find text "Security Overview"
agent-browser wait 500
# Verify: Risk distribution chart

# Step 12: Check evaluation success rate
agent-browser find text "Evaluation Results"
agent-browser wait 500
# Verify: Pass/fail breakdown

# Step 13: Test filter by skill
agent-browser find 'select[name="skill"]' click
agent-browser wait 500
agent-browser find text "pdf" click
agent-browser wait 2000
agent-browser screenshot e2e-analytics-filtered.png
# Verify: Data filtered to selected skill

# Step 14: Test filter by team
agent-browser find 'select[name="team"]' click
agent-browser wait 500
agent-browser find text "TechCorp" click
agent-browser wait 2000
# Verify: Data filtered to team

# Step 15: Export data as CSV
agent-browser find text "Export" click
agent-browser wait 500
agent-browser find text "CSV" click
agent-browser wait 2000
# Verify: CSV downloaded

# Step 16: Export data as PDF
agent-browser find text "Export" click
agent-browser wait 500
agent-browser find text "PDF Report" click
agent-browser wait 3000
# Verify: PDF downloaded

# Step 17: Test chart hover tooltips
agent-browser find '.chart-bar' hover
agent-browser wait 500
# Verify: Tooltip shows data details

# Step 18: Verify real-time indicator
agent-browser find text "Live"
agent-browser wait 500
# Verify: Real-time data indicator visible

# Step 19: Test comparison mode
agent-browser find text "Compare" click
agent-browser wait 1000
agent-browser screenshot e2e-analytics-compare.png
# Verify: Comparison view available

# Step 20: Select comparison periods
agent-browser find text "Previous Period" click
agent-browser wait 2000
# Verify: Comparison data shown

# Step 21: Check user activity chart
agent-browser find text "User Activity"
agent-browser wait 500
# Verify: Activity heatmap or timeline

# Step 22: Verify data accuracy
agent-browser open http://localhost:3002/api/stats/overview
agent-browser wait 1000
# Compare API data with dashboard display
```

### Expected Results
- All charts render correctly
- Date filters work
- Data exports successfully
- Tooltips display accurate data
- Comparison mode works
- Real-time updates visible

---

## TC-7.3: Usage Reports and Exports

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test usage reporting and data export features.

### Steps

```bash
# Step 1: Login and navigate to reports
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/dashboard/reports
agent-browser wait 2000
agent-browser screenshot e2e-reports.png

# Step 2: Verify reports page
agent-browser snapshot -i
# Verify: Report types available

# Step 3: Select usage report
agent-browser find text "Usage Report" click
agent-browser wait 1000
# Verify: Usage report options shown

# Step 4: Set date range
agent-browser find 'input[name="startDate"]' fill "2026-01-01"
agent-browser find 'input[name="endDate"]' fill "2026-02-14"
agent-browser wait 500

# Step 5: Generate report
agent-browser find text "Generate Report" click
agent-browser wait 5000
agent-browser screenshot e2e-report-generated.png

# Step 6: Verify report content
agent-browser snapshot -i
# Verify: Report with data tables, summaries

# Step 7: Export to CSV
agent-browser find text "Export CSV" click
agent-browser wait 2000
# Verify: File downloaded

# Step 8: Export to PDF
agent-browser find text "Export PDF" click
agent-browser wait 3000
# Verify: PDF downloaded

# Step 9: Schedule report (if available)
agent-browser find text "Schedule" click
agent-browser wait 500
# Verify: Scheduling options

# Step 10: Set schedule
agent-browser find 'select[name="frequency"]' click
agent-browser find text "Weekly" click
agent-browser find 'input[name="email"]' fill "alice@example.com"
agent-browser find text "Save Schedule" click
agent-browser wait 1000
# Verify: Schedule saved

# Step 11: View scheduled reports
agent-browser find text "Scheduled Reports" click
agent-browser wait 1000
# Verify: List of scheduled reports
```

### Expected Results
- Reports generate correctly
- Date filters work
- Multiple export formats available
- Scheduling works

---

## TC-7.4: Performance Metrics Dashboard

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test performance and health metrics display.

### Steps

```bash
# Step 1: Login and navigate to performance
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/dashboard/performance
agent-browser wait 2000
agent-browser screenshot e2e-performance.png

# Step 2: Verify performance metrics
agent-browser snapshot -i
# Verify: Response time charts, error rates

# Step 3: Check API response times
agent-browser find text "API Response Time"
agent-browser wait 500
# Verify: Average response times displayed

# Step 4: Check error rate
agent-browser find text "Error Rate"
agent-browser wait 500
# Verify: Error percentage shown

# Step 5: View slow queries
agent-browser find text "Slow Operations" click
agent-browser wait 1000
# Verify: List of slow operations

# Step 6: Check system health
agent-browser find text "System Health"
agent-browser wait 500
# Verify: Health indicators green/yellow/red

# Step 7: View alerts
agent-browser find text "Alerts" click
agent-browser wait 1000
# Verify: Active alerts listed
```

### Expected Results
- Performance metrics displayed
- Health indicators accurate
- Alerts visible

---

# SERIES 8: Admin Operations

## ⭐ TC-8.1: Complete Admin User Management (LONG)

**Priority:** P0
**Estimated Steps:** 25+

### Description
Test admin user management features.

### Steps

```bash
# Step 1-5: Login as Admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 6: Navigate to Admin
agent-browser find text "Admin" click
agent-browser wait --url "**/dashboard/admin"
agent-browser screenshot e2e-admin.png

# Step 7: View Users
agent-browser find text "Users" click
agent-browser wait 1000
agent-browser screenshot e2e-admin-users.png

# Step 8: Search users
agent-browser find 'input[placeholder*="Search"]' fill "alice"
agent-browser wait 1000
# Verify: Alice appears in results

# Step 9: View user details
agent-browser find text "alice@example.com" click
agent-browser wait 1000
agent-browser screenshot e2e-user-detail.png

# Step 10: Change user role
agent-browser find text "Change Role" click
agent-browser wait 500
agent-browser find text "Admin" click
agent-browser wait 1000
agent-browser find text "Confirm" click
agent-browser wait 1000
# Verify: Role changed

# Step 11: Disable user
agent-browser find text "Disable User" click
agent-browser wait 500
agent-browser find text "Confirm" click
agent-browser wait 1000
# Verify: User disabled

# Step 12: Enable user
agent-browser find text "Enable User" click
agent-browser wait 500
agent-browser find text "Confirm" click
agent-browser wait 1000
# Verify: User enabled

# Step 13: View audit logs
agent-browser find text "Audit Logs" click
agent-browser wait 1000
agent-browser screenshot e2e-audit-logs.png

# Step 14: Filter audit logs
agent-browser find text "Filter" click
agent-browser wait 500
agent-browser find text "User Management" click
agent-browser wait 1000
# Verify: Filtered results

# Step 15: Export audit logs
agent-browser find text "Export" click
agent-browser wait 2000
# Verify: CSV downloaded
```

---

## ⭐ TC-8.2: Complete Admin Skill Moderation (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test skill moderation and approval workflow.

### Steps

```bash
# Step 1: Login as Admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to moderation queue
agent-browser open http://localhost:3002/dashboard/admin/moderation
agent-browser wait 2000
agent-browser screenshot e2e-moderation-queue.png

# Step 3: Verify moderation page
agent-browser snapshot -i
# Verify: List of pending skills, filters

# Step 4: View flagged skills
agent-browser find text "Flagged" click
agent-browser wait 1000
# Verify: Skills with security issues listed

# Step 5: Select a skill for review
agent-browser find text "malicious-skill-test" click
agent-browser wait 1000
agent-browser screenshot e2e-skill-review.png

# Step 6: Review security findings
agent-browser snapshot -i
# Verify: Security issues displayed

# Step 7: View detailed findings
agent-browser find text "View Details" click
agent-browser wait 500
# Verify: Expanded finding information

# Step 8: Check skill files
agent-browser find text "Files" click
agent-browser wait 500
# Verify: File tree displayed

# Step 9: View problematic file
agent-browser find text "exploit.js" click
agent-browser wait 500
# Verify: File content shown with highlights

# Step 10: Reject skill
agent-browser find text "Reject" click
agent-browser wait 500

# Step 11: Add rejection reason
agent-browser find 'textarea[name="reason"]' fill "Security issues detected: eval() usage"
agent-browser wait 500

# Step 12: Confirm rejection
agent-browser find text "Confirm Rejection" click
agent-browser wait 2000
agent-browser screenshot e2e-skill-rejected.png

# Step 13: Verify skill removed from queue
agent-browser snapshot -i
# Verify: Skill no longer in pending

# Step 14: Check rejected skills list
agent-browser find text "Rejected" click
agent-browser wait 1000
# Verify: Rejected skill visible

# Step 15: Navigate to approve a clean skill
agent-browser find text "Pending" click
agent-browser wait 1000

# Step 16: Select clean skill
agent-browser find text "test-secure-skill" click
agent-browser wait 1000

# Step 17: Review skill details
agent-browser snapshot -i
# Verify: No security issues or low risk only

# Step 18: Approve skill
agent-browser find text "Approve" click
agent-browser wait 500

# Step 19: Add approval note (optional)
agent-browser find 'textarea[name="note"]' fill "Reviewed and approved"
agent-browser wait 500

# Step 20: Confirm approval
agent-browser find text "Confirm Approval" click
agent-browser wait 2000
agent-browser screenshot e2e-skill-approved.png

# Step 21: Verify skill now public
agent-browser open http://localhost:3002/marketplace/test-secure-skill
agent-browser wait 1000
# Verify: Skill visible in marketplace

# Step 22: Test bulk moderation
agent-browser open http://localhost:3002/dashboard/admin/moderation
agent-browser wait 1000

# Step 23: Select multiple skills
agent-browser find 'input[type="checkbox"][value="skill1"]' click
agent-browser find 'input[type="checkbox"][value="skill2"]' click
agent-browser wait 500

# Step 24: Bulk approve
agent-browser find text "Bulk Approve" click
agent-browser wait 1000
agent-browser find text "Confirm" click
agent-browser wait 2000
# Verify: Multiple skills approved
```

### Expected Results
- Moderation queue displays correctly
- Skills can be reviewed individually
- Security findings visible
- Rejection with reason works
- Approval workflow works
- Bulk operations work
- Notifications sent to owners

---

## TC-8.3: Admin System Configuration

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test system configuration and settings.

### Steps

```bash
# Step 1: Login as Admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to settings
agent-browser open http://localhost:3002/dashboard/admin/settings
agent-browser wait 2000
agent-browser screenshot e2e-admin-settings.png

# Step 3: Verify settings page
agent-browser snapshot -i
# Verify: Configuration categories listed

# Step 4: Navigate to security settings
agent-browser find text "Security" click
agent-browser wait 1000
# Verify: Security configuration options

# Step 5: Modify scan rules
agent-browser find 'input[name="maxFileSize"]' fill "100"
agent-browser wait 500

# Step 6: Enable/disable security patterns
agent-browser find 'input[name="checkEval"]' click
agent-browser wait 500

# Step 7: Save security settings
agent-browser find text "Save Settings" click
agent-browser wait 2000
agent-browser screenshot e2e-settings-saved.png

# Step 8: Verify save confirmation
agent-browser snapshot -i
# Verify: "Settings saved" message

# Step 9: Navigate to evaluation settings
agent-browser find text "Evaluation" click
agent-browser wait 1000

# Step 10: Modify evaluation timeout
agent-browser find 'input[name="evalTimeout"]' fill "120"
agent-browser wait 500

# Step 11: Modify parallel evaluations
agent-browser find 'input[name="maxParallel"]' fill "5"
agent-browser wait 500

# Step 12: Save evaluation settings
agent-browser find text "Save" click
agent-browser wait 2000

# Step 13: Navigate to email settings
agent-browser find text "Email" click
agent-browser wait 1000

# Step 14: Configure SMTP (if available)
agent-browser find 'input[name="smtpHost"]' fill "smtp.example.com"
agent-browser wait 500

# Step 15: Test email configuration
agent-browser find text "Send Test Email" click
agent-browser wait 3000
# Verify: Test email sent confirmation

# Step 16: Reset to defaults
agent-browser find text "Reset to Defaults" click
agent-browser wait 500
agent-browser find text "Confirm" click
agent-browser wait 2000
# Verify: Settings reset
```

### Expected Results
- All settings categories accessible
- Changes save correctly
- Validation works
- Reset to defaults works
- Email test functionality works

---

## TC-8.4: Admin System Health and Monitoring

**Priority:** P1
**Estimated Steps:** 20+

### Description
Test system health monitoring dashboard.

### Steps

```bash
# Step 1: Login as Admin
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to system health
agent-browser open http://localhost:3002/dashboard/admin/health
agent-browser wait 2000
agent-browser screenshot e2e-system-health.png

# Step 3: Verify health dashboard
agent-browser snapshot -i
# Verify: Status indicators for all services

# Step 4: Check database status
agent-browser find text "Database"
agent-browser wait 500
# Verify: Database connection status (green/yellow/red)

# Step 5: Check queue status
agent-browser find text "Job Queue"
agent-browser wait 500
# Verify: Queue status, pending jobs count

# Step 6: Check storage status
agent-browser find text "Storage"
agent-browser wait 500
# Verify: Storage usage, available space

# Step 7: Check cache status
agent-browser find text "Cache"
agent-browser wait 500
# Verify: Cache hit rate, memory usage

# Step 8: View detailed metrics
agent-browser find text "View Details" click
agent-browser wait 1000
# Verify: Expanded metrics view

# Step 9: Check recent errors
agent-browser find text "Recent Errors" click
agent-browser wait 1000
agent-browser screenshot e2e-recent-errors.png
# Verify: Error log displayed

# Step 10: Filter errors by type
agent-browser find 'select[name="errorType"]' click
agent-browser find text "API Errors" click
agent-browser wait 1000
# Verify: Filtered error list

# Step 11: View error details
agent-browser find text "View" click
agent-browser wait 500
# Verify: Error stack trace visible

# Step 12: Clear resolved errors
agent-browser find text "Clear Resolved" click
agent-browser wait 1000
# Verify: Resolved errors removed

# Step 13: Check system logs
agent-browser find text "System Logs" click
agent-browser wait 1000
agent-browser screenshot e2e-system-logs.png

# Step 14: Search logs
agent-browser find 'input[placeholder*="Search"]' fill "error"
agent-browser wait 1000
# Verify: Filtered log entries

# Step 15: Export logs
agent-browser find text "Export Logs" click
agent-browser wait 2000
# Verify: Log file downloaded

# Step 16: Test alert configuration
agent-browser find text "Alerts" click
agent-browser wait 1000

# Step 17: Configure alert threshold
agent-browser find 'input[name="errorThreshold"]' fill "10"
agent-browser wait 500

# Step 18: Save alert config
agent-browser find text "Save" click
agent-browser wait 1000
# Verify: Alert configuration saved
```

### Expected Results
- All service statuses displayed
- Health indicators accurate
- Error logs accessible
- Logs searchable and exportable
- Alert configuration works

---

# SERIES 9: Feedback & Ratings

## ⭐ TC-9.1: Complete Skill Review Flow (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test review submission, editing, and display.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to a skill
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser screenshot e2e-skill-for-review.png

# Step 3: Navigate to Reviews tab
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser screenshot e2e-reviews-tab.png

# Step 4: Verify reviews section
agent-browser snapshot -i
# Verify: Rating breakdown, existing reviews, "Write a Review" button

# Step 5: Click write review
agent-browser find text "Write a Review" click
agent-browser wait 1000
agent-browser screenshot e2e-review-form.png

# Step 6: Verify review form
agent-browser snapshot -i
# Verify: Rating stars, title input, review textarea, submit button

# Step 7: Set rating (5 stars)
agent-browser find '.star-rating[data-value="5"]' click
agent-browser wait 500
# Verify: 5 stars selected

# Step 8: Enter review title
agent-browser find 'input[name="title"]' fill "Excellent PDF skill"
agent-browser wait 500

# Step 9: Enter review content
agent-browser find 'textarea[name="content"]' fill "This skill works perfectly for all my PDF processing needs. Great documentation and fast execution."
agent-browser wait 500

# Step 10: Submit review
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000
agent-browser screenshot e2e-review-submitted.png

# Step 11: Verify review appears
agent-browser snapshot -i
# Verify: New review visible in list

# Step 12: Verify rating updated
agent-browser find text "Reviews" click
agent-browser wait 500
# Verify: Overall rating includes new review

# Step 13: Edit review
agent-browser find text "Edit" click
agent-browser wait 1000

# Step 14: Modify rating
agent-browser find '.star-rating[data-value="4"]' click
agent-browser wait 500

# Step 15: Modify content
agent-browser find 'textarea[name="content"]' fill "Updated: Great skill but could use some performance improvements for large files."
agent-browser wait 500

# Step 16: Save edit
agent-browser find text "Save" click
agent-browser wait 2000
agent-browser screenshot e2e-review-edited.png

# Step 17: Verify edit saved
agent-browser snapshot -i
# Verify: Updated review content visible

# Step 18: Delete review
agent-browser find text "Delete" click
agent-browser wait 500

# Step 19: Confirm deletion
agent-browser find text "Confirm" click
agent-browser wait 2000
agent-browser screenshot e2e-review-deleted.png

# Step 20: Verify review removed
agent-browser snapshot -i
# Verify: Review no longer in list

# Step 21: Test review validation - empty content
agent-browser find text "Write a Review" click
agent-browser wait 1000
agent-browser find '.star-rating[data-value="5"]' click
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Validation error for empty content

# Step 22: Test review validation - no rating
agent-browser find 'input[name="title"]' fill "Test"
agent-browser find 'textarea[name="content"]' fill "Test content"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Validation error for missing rating

# Step 23: Test duplicate review prevention
agent-browser find '.star-rating[data-value="5"]' click
agent-browser find 'input[name="title"]' fill "Another review"
agent-browser find 'textarea[name="content"]' fill "Trying to add another review"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
# Verify: Error or already reviewed message
```

### Expected Results
- Review form works correctly
- Rating selection works
- Review submitted successfully
- Edit functionality works
- Delete with confirmation works
- Validation catches errors
- Duplicate prevention works

---

## TC-9.2: Review Moderation Flow

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test review moderation by admin.

### Steps

```bash
# Step 1: Submit review with flagged content (as user)
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "bob@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser find text "Write a Review" click
agent-browser wait 500

# Step 2: Submit review with potentially flagged content
agent-browser find '.star-rating[data-value="1"]' click
agent-browser find 'input[name="title"]' fill "Test review"
agent-browser find 'textarea[name="content"]' fill "This is a spam review with inappropriate content"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
agent-browser screenshot e2e-flagged-review.png

# Step 3: Login as admin
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 4: Navigate to review moderation
agent-browser open http://localhost:3002/dashboard/admin/reviews
agent-browser wait 2000
agent-browser screenshot e2e-review-moderation.png

# Step 5: Verify flagged reviews listed
agent-browser snapshot -i
# Verify: Flagged review visible

# Step 6: View review details
agent-browser find text "Test review" click
agent-browser wait 1000
# Verify: Full review content shown

# Step 7: Approve or reject review
agent-browser find text "Reject" click
agent-browser wait 500
agent-browser find 'textarea[name="reason"]' fill "Spam content"
agent-browser find text "Confirm" click
agent-browser wait 2000
agent-browser screenshot e2e-review-rejected.png

# Step 8: Verify review removed from public view
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser find text "Reviews" click
agent-browser wait 1000
# Verify: Flagged review not visible
```

### Expected Results
- Flagged content detected
- Admin can moderate reviews
- Rejection removes from public view
- Reason captured

---

## TC-9.3: Review Voting and Helpfulness

**Priority:** P3
**Estimated Steps:** 15+

### Description
Test helpful voting on reviews.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to skill with reviews
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser screenshot e2e-reviews-voting.png

# Step 3: Find a review
agent-browser snapshot -i
# Verify: Reviews with helpful counts

# Step 4: Click "Helpful" button
agent-browser find text "Helpful" click
agent-browser wait 1000

# Step 5: Verify count increased
agent-browser snapshot -i
# Verify: Helpful count incremented

# Step 6: Click "Not Helpful"
agent-browser find text "Not Helpful" click
agent-browser wait 1000
# Verify: Vote changed

# Step 7: Verify own vote highlighted
agent-browser snapshot -i
# Verify: Current vote state shown

# Step 8: Remove vote
agent-browser find text "Not Helpful" click
agent-browser wait 1000
# Verify: Vote removed, count updated

# Step 9: Test vote on own review (should be blocked)
# Navigate to a skill you reviewed
agent-browser open http://localhost:3002/marketplace/docx
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
# Try to vote on own review - should be disabled or show message
```

### Expected Results
- Voting updates count
- Vote state persisted
- Can change vote
- Can remove vote
- Cannot vote on own review

---

# SERIES 10: API & Integration

## TC-10.1: Public API Documentation

**Priority:** P1
**Estimated Steps:** 15+

### Description
Test API documentation page.

### Steps (TBD)
1. Navigate to /api-docs
2. Verify Swagger UI loads
3. Verify all endpoints listed
4. Test try-it-out feature
5. Verify authentication in docs

---

# EDGE CASE TESTS

## ⭐ EC-1: Concurrent Upload Handling (LONG)

**Priority:** P2
**Estimated Steps:** 25+

### Description
Test multiple simultaneous uploads and queue handling.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Open first upload tab/window (simulate with quick sequential uploads)
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000

# Step 3: Upload first skill
agent-browser find 'input[name="name"]' fill "concurrent-skill-1"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-1.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000  # Don't wait for completion

# Step 4: Immediately start second upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000
agent-browser find 'input[name="name"]' fill "concurrent-skill-2"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-2.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000

# Step 5: Immediately start third upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000
agent-browser find 'input[name="name"]' fill "concurrent-skill-3"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-3.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
agent-browser screenshot e2e-concurrent-uploads.png

# Step 6: Navigate to My Skills
agent-browser open http://localhost:3002/dashboard/skills
agent-browser wait 2000

# Step 7: Verify all uploads in progress or queued
agent-browser snapshot -i
# Verify: All three skills visible with processing status

# Step 8: Wait for all to complete
agent-browser wait 30000

# Step 9: Verify all completed
agent-browser refresh
agent-browser wait 2000
agent-browser snapshot -i
# Verify: All skills show completed status

# Step 10: Check security scans all triggered
agent-browser open http://localhost:3002/dashboard/security
agent-browser wait 1000
agent-browser snapshot -i
# Verify: All three skills in security queue or scanned

# Step 11: Verify no conflicts in file storage
agent-browser open http://localhost:3002/api/skills/concurrent-skill-1
agent-browser wait 500
agent-browser open http://localhost:3002/api/skills/concurrent-skill-2
agent-browser wait 500
agent-browser open http://localhost:3002/api/skills/concurrent-skill-3
agent-browser wait 500
# Verify: All APIs return correct data

# Step 12: Test concurrent download during upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "concurrent-skill-4"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-4.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000

# Step 13: Try to download another skill during upload
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 1000
agent-browser find text "Download" click
agent-browser wait 2000
# Verify: Download works while upload in progress
```

### Expected Results
- Multiple uploads queue correctly
- No data conflicts
- All uploads complete successfully
- Security scans process all uploads
- Downloads work during uploads

---

## EC-2: Network Interruption Recovery

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test recovery from network failures.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Start upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "network-test-skill"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill-large.zip"
agent-browser find 'button[type="submit"]' click

# Step 3: Simulate network interruption (disconnect network)
# In real test, would use browser dev tools to go offline
agent-browser wait 3000

# Step 4: Verify error handling
agent-browser snapshot -i
# Verify: Error message displayed, retry option available

# Step 5: Restore network (simulate reconnect)
# Use browser dev tools to go online

# Step 6: Click retry
agent-browser find text "Retry" click
agent-browser wait 5000

# Step 7: Verify upload resumes
agent-browser snapshot -i
# Verify: Upload continues or completes

# Step 8: Test API call during network issue
agent-browser open http://localhost:3002/api/skills
# Simulate offline
agent-browser wait 2000

# Step 9: Verify offline handling
agent-browser snapshot -i
# Verify: Appropriate error or cached response

# Step 10: Test auto-retry mechanism
# Verify: Automatic retry with exponential backoff
```

### Expected Results
- Graceful error handling on network failure
- Retry mechanism works
- Upload resumes after reconnection
- API calls handle offline state

---

## EC-3: Large File Upload Handling

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test upload with large files and slow connections.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000

# Step 3: Upload large file (50MB+)
agent-browser find 'input[name="name"]' fill "large-skill-test"
agent-browser find 'input[type="file"]' set-file "./fixtures/large-skill-50mb.zip"
agent-browser find 'button[type="submit"]' click

# Step 4: Verify progress indicator
agent-browser wait 2000
agent-browser snapshot -i
# Verify: Progress bar or percentage shown

# Step 5: Monitor upload progress
agent-browser wait 5000
agent-browser snapshot -i
# Verify: Progress updates

# Step 6: Wait for upload completion (may take several minutes)
agent-browser wait 120000
agent-browser screenshot e2e-large-upload-complete.png

# Step 7: Verify upload success
agent-browser snapshot -i
# Verify: Success message, skill created

# Step 8: Verify file integrity
agent-browser find text "Files" click
agent-browser wait 1000
# Verify: All files present and readable

# Step 9: Test file size limit
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "too-large-skill"
agent-browser find 'input[type="file"]' set-file "./fixtures/huge-skill-500mb.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000

# Step 10: Verify size limit error
agent-browser snapshot -i
# Verify: Error message about file size limit

# Step 11: Test timeout handling
# Upload large file with slow connection simulation
# Verify: Timeout error with retry option
```

### Expected Results
- Large files upload successfully
- Progress indicator works
- File size limits enforced
- Timeout handled gracefully

---

## EC-4: Browser Navigation Edge Cases

**Priority:** P3
**Estimated Steps:** 20+

### Description
Test browser back/forward button behavior.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate through several pages
agent-browser find text "Skills" click
agent-browser wait 1000
agent-browser find text "pdf" click
agent-browser wait 1000
agent-browser find text "Files" click
agent-browser wait 500
agent-browser screenshot e2e-nav-state-1.png

# Step 3: Press browser back button
agent-browser back
agent-browser wait 1000
agent-browser screenshot e2e-nav-back-1.png
# Verify: Returned to skill overview

# Step 4: Press back again
agent-browser back
agent-browser wait 1000
# Verify: Returned to skills list

# Step 5: Press forward button
agent-browser forward
agent-browser wait 1000
# Verify: Forward to skill detail

# Step 6: Test back during form fill
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000
agent-browser find 'input[name="name"]' fill "test-skill"
agent-browser find 'textarea[name="description"]' fill "Test description"
agent-browser wait 500

# Step 7: Press back during form
agent-browser back
agent-browser wait 1000
agent-browser screenshot e2e-nav-form-back.png
# Verify: Warning about unsaved changes (if implemented)

# Step 8: Test deep link access
agent-browser open http://localhost:3002/marketplace/pdf/files
agent-browser wait 2000
# Verify: Direct access to files tab works

# Step 9: Test refresh on form page
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "refresh-test"
agent-browser refresh
agent-browser wait 2000
# Verify: Form cleared or preserved based on implementation

# Step 10: Test navigation during upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "nav-test"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000

# Step 11: Navigate away during upload
agent-browser open http://localhost:3002/dashboard
agent-browser wait 1000
# Verify: Warning or upload continues in background
```

### Expected Results
- Back/forward navigation works
- Form state handled appropriately
- Deep links work
- Navigation during operations handled

---

## EC-5: Session Timeout During Operation

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test timeout during long operations.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Start a long operation (upload)
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "timeout-test-skill"
agent-browser find 'input[type="file"]' set-file "./fixtures/large-skill.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000

# Step 3: Simulate session timeout
# In real test, would wait for session to expire or modify session
agent-browser wait 1000

# Step 4: Clear session cookie (simulate timeout)
agent-browser clear-cookies

# Step 5: Try to continue operation
agent-browser wait 5000
agent-browser snapshot -i
# Verify: Session timeout detected, redirected to login

# Step 6: Verify operation can resume after re-login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 7: Check if operation continued
agent-browser open http://localhost:3002/dashboard/skills
agent-browser wait 1000
# Verify: Skill uploaded or needs re-upload

# Step 8: Test session timeout during form entry
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill "session-test"
agent-browser wait 500

# Step 9: Wait for session timeout
# (Would wait actual timeout period in real test)

# Step 10: Try to submit
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
# Verify: Redirect to login, form data preserved if possible
```

### Expected Results
- Session timeout detected
- User redirected to login
- Return URL preserved
- Operations can resume after re-auth

---

## EC-6: Special Characters and Unicode Handling

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test handling of special characters in inputs.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to upload
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser wait 1000

# Step 3: Test Unicode in skill name
agent-browser find 'input[name="name"]' fill "技能测试-日本語"
agent-browser find 'textarea[name="description"]' fill "Description with émojis 🎉 and spëcial çhars"
agent-browser find 'input[type="file"]' set-file "./fixtures/test-skill.zip"
agent-browser find 'button[type="submit"]' click
agent-browser wait 5000

# Step 4: Verify Unicode preserved
agent-browser snapshot -i
# Verify: Unicode characters display correctly

# Step 5: Test search with special characters
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser find 'input[placeholder*="Search"]' fill "技能"
agent-browser wait 2000
agent-browser snapshot -i
# Verify: Search handles Unicode

# Step 6: Test XSS prevention
agent-browser open http://localhost:3002/dashboard/skills/upload
agent-browser find 'input[name="name"]' fill '<script>alert("xss")</script>'
agent-browser wait 500
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
# Verify: Script tags escaped, not executed

# Step 7: Test SQL injection prevention
agent-browser find 'input[name="name"]' fill "'; DROP TABLE skills; --"
agent-browser wait 500
# Verify: Input sanitized, no SQL injection
```

### Expected Results
- Unicode handled correctly
- Special characters preserved
- XSS prevented
- SQL injection prevented

---

# PERFORMANCE TESTS

## ⭐ PT-1: Page Load Performance Testing (LONG)

**Priority:** P2
**Estimated Steps:** 25+

### Description
Measure and verify page load times.

### Target Times
| Page | Target |
|------|--------|
| Homepage | < 2s |
| Marketplace | < 3s |
| Skill Detail | < 2s |
| Dashboard | < 2s |
| Search Results | < 1s |

### Steps

```bash
# Step 1: Clear browser cache
agent-browser clear-cache
agent-browser clear-cookies

# Step 2: Test homepage load time
agent-browser open http://localhost:3002
agent-browser wait 5000
agent-browser screenshot e2e-perf-homepage.png
# Record: Load time from network tab

# Step 3: Navigate to marketplace
agent-browser open http://localhost:3002/marketplace
agent-browser wait 5000
agent-browser screenshot e2e-perf-marketplace.png
# Record: Load time

# Step 4: Test skill detail load
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 5000
agent-browser screenshot e2e-perf-skill-detail.png
# Record: Load time

# Step 5: Test dashboard load (logged in)
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"
agent-browser screenshot e2e-perf-dashboard.png
# Record: Load time

# Step 6: Test search response time
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser find 'input[placeholder*="Search"]' fill "pdf"
agent-browser wait 2000
agent-browser screenshot e2e-perf-search.png
# Record: Search response time

# Step 7: Test API response time
agent-browser open http://localhost:3002/api/skills
agent-browser wait 1000
# Record: API response time

# Step 8: Test with cache (second load)
agent-browser open http://localhost:3002/marketplace
agent-browser wait 2000
# Record: Cached load time (should be faster)

# Step 9: Test with many items
agent-browser open "http://localhost:3002/marketplace?per_page=100"
agent-browser wait 5000
agent-browser screenshot e2e-perf-many-items.png
# Record: Load time with 100 items

# Step 10: Test concurrent users simulation
# Open multiple tabs/windows
agent-browser open http://localhost:3002/marketplace
agent-browser open http://localhost:3002/dashboard
agent-browser open http://localhost:3002/api/skills
agent-browser wait 5000
# Verify: All pages load without degradation
```

### Expected Results
- All pages load within target times
- Cached loads faster
- No degradation with many items
- Concurrent access works

---

## PT-2: Search Performance Testing

**Priority:** P2
**Estimated Steps:** 15+

### Description
Measure search API response time.

### Target: < 500ms

### Steps

```bash
# Step 1: Test empty search
agent-browser open http://localhost:3002/api/skills?search=
agent-browser wait 1000
# Record: Response time

# Step 2: Test single term search
agent-browser open http://localhost:3002/api/skills?search=pdf
agent-browser wait 1000
# Record: Response time

# Step 3: Test complex search with filters
agent-browser open "http://localhost:3002/api/skills?search=pdf&category=document&security=low"
agent-browser wait 1000
# Record: Response time

# Step 4: Test pagination performance
agent-browser open "http://localhost:3002/api/skills?page=1&per_page=50"
agent-browser wait 1000
# Record: Response time

# Step 5: Test sort performance
agent-browser open "http://localhost:3002/api/skills?sort=downloads&order=desc"
agent-browser wait 1000
# Record: Response time
```

### Expected Results
- All searches complete under 500ms
- Complex queries perform well
- Pagination efficient

---

## PT-3: API Endpoint Performance

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test API endpoint response times.

### Steps

```bash
# Step 1: Test skills list API
agent-browser open http://localhost:3002/api/skills
agent-browser wait 1000
# Record: Response time, payload size

# Step 2: Test single skill API
agent-browser open http://localhost:3002/api/skills/pdf
agent-browser wait 1000
# Record: Response time

# Step 3: Test stats API
agent-browser open http://localhost:3002/api/stats/overview
agent-browser wait 1000
# Record: Response time

# Step 4: Test search API
agent-browser open http://localhost:3002/api/skills?search=test
agent-browser wait 1000
# Record: Response time

# Step 5: Test with authentication
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/api/skills?includePrivate=true
agent-browser wait 1000
# Record: Response time for authenticated request
```

### Expected Results
- All API endpoints respond quickly
- Authenticated requests not significantly slower

---

# ACCESSIBILITY TESTS

## A11Y-1: Keyboard Navigation

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test keyboard-only navigation.

### Steps

```bash
# Step 1: Open homepage
agent-browser open http://localhost:3002
agent-browser wait 2000

# Step 2: Test Tab navigation
agent-browser press Tab
agent-browser wait 200
agent-browser press Tab
agent-browser wait 200
agent-browser press Tab
agent-browser wait 200
agent-browser screenshot e2e-a11y-tab-nav.png
# Verify: Focus indicator visible, logical order

# Step 3: Test Enter key activation
agent-browser press Enter
agent-browser wait 1000
# Verify: Focused element activated

# Step 4: Test Escape key
agent-browser press Escape
agent-browser wait 500
# Verify: Modal closed or navigation cancelled

# Step 5: Test form navigation
agent-browser open http://localhost:3002/login
agent-browser wait 1000
agent-browser press Tab
agent-browser type "alice@example.com"
agent-browser press Tab
agent-browser type "password123"
agent-browser press Tab
agent-browser press Enter
agent-browser wait --url "**/dashboard"
# Verify: Form navigable by keyboard

# Step 6: Test skip links
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser press Tab
# Verify: Skip to content link visible

# Step 7: Test dropdown navigation
agent-browser find 'button[aria-haspopup]' focus
agent-browser press Enter
agent-browser wait 500
agent-browser press ArrowDown
agent-browser press ArrowDown
agent-browser press Enter
# Verify: Dropdown navigable by arrow keys
```

### Expected Results
- All elements keyboard accessible
- Focus indicators visible
- Logical tab order
- Skip links work

---

## A11Y-2: Screen Reader Compatibility

**Priority:** P2
**Estimated Steps:** 15+

### Description
Verify screen reader compatibility.

### Steps

```bash
# Step 1: Check for proper headings
agent-browser open http://localhost:3002/marketplace
agent-browser wait 2000
# Verify: Proper heading hierarchy (h1, h2, h3)

# Step 2: Check image alt text
agent-browser find 'img'
# Verify: All images have alt attributes

# Step 3: Check ARIA labels
agent-browser find '[aria-label]'
# Verify: Interactive elements have labels

# Step 4: Check form labels
agent-browser open http://localhost:3002/login
agent-browser wait 1000
agent-browser find 'label'
# Verify: All form inputs have associated labels

# Step 5: Check landmark regions
agent-browser find '[role="main"]'
agent-browser find '[role="navigation"]'
# Verify: Proper landmark regions defined

# Step 6: Check live regions
agent-browser find '[aria-live]'
# Verify: Dynamic content has live regions
```

### Expected Results
- Proper semantic HTML
- ARIA attributes correct
- Form labels present
- Landmarks defined

---

## A11Y-3: Color Contrast

**Priority:** P3
**Estimated Steps:** 10+

### Description
Verify WCAG contrast ratios.

### Steps

```bash
# Step 1: Check primary text contrast
agent-browser open http://localhost:3002
agent-browser wait 2000
agent-browser screenshot e2e-a11y-contrast.png
# Verify: Text meets 4.5:1 contrast ratio

# Step 2: Check button contrast
agent-browser find 'button'
# Verify: Button text meets 3:1 ratio

# Step 3: Check error message contrast
agent-browser open http://localhost:3002/login
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Error messages have sufficient contrast

# Step 4: Check link contrast
agent-browser find 'a'
# Verify: Links distinguishable from surrounding text

# Step 5: Check focus indicator contrast
agent-browser press Tab
# Verify: Focus indicator has sufficient contrast
```

### Expected Results
- All text meets WCAG contrast requirements
- Focus indicators visible
- Error messages readable

---


# SUMMARY

## Test Statistics

| Metric | Count |
|--------|-------|
| **Total Tests** | 52 |
| **Long-Step Tests (25+ steps)** | 16 |
| **Fully Implemented Tests** | 30+ |

## Complete Implementations (Long-Step Tests ⭐)

| Test ID | Name | Steps | Priority |
|---------|------|-------|----------|
| TC-1.1 | Complete Skill Upload Flow with Security Analysis | 35+ | P0 |
| TC-1.2 | Skill Upload with Malicious Code Detection | 30+ | P0 |
| TC-2.1 | Advanced Skill Search with Filters | 30+ | P0 |
| TC-2.2 | Skill Detail Page Full Navigation | 25+ | P0 |
| TC-3.1 | Complete Team Lifecycle | 35+ | P0 |
| TC-3.2 | Team Skill Sharing and Permissions | 30+ | P0 |
| TC-4.1 | Complete Bundle Lifecycle | 30+ | P0 |
| TC-4.2 | Bundle Versioning and Updates | 25+ | P1 |
| TC-5.1 | Complete Evaluation Lifecycle | 35+ | P0 |
| TC-5.2 | Evaluation Queue Management | 25+ | P1 |
| TC-6.1 | Complete User Registration Flow | 30+ | P0 |
| TC-6.2 | Complete Password Reset Flow | 25+ | P1 |
| TC-6.4 | Role-Based Access Control Full Test | 30+ | P0 |
| TC-7.1 | Complete Dashboard Overview | 25+ | P1 |
| TC-7.2 | Analytics Dashboard with Charts | 25+ | P2 |
| TC-8.1 | Complete Admin User Management | 25+ | P0 |
| TC-8.2 | Complete Admin Skill Moderation | 25+ | P1 |
| TC-9.1 | Complete Skill Review Flow | 25+ | P1 |
| EC-1 | Concurrent Upload Handling | 25+ | P2 |
| PT-1 | Page Load Performance Testing | 25+ | P2 |

## Test Coverage by Feature

| Feature | Tests | Long-Step | Priority |
|---------|-------|-----------|----------|
| Skill Upload & Security | 10 | 2 | P0-P3 |
| Search & Discovery | 8 | 2 | P0-P3 |
| Team Management | 8 | 2 | P0-P2 |
| Bundle Management | 6 | 2 | P0-P2 |
| Skill Evaluation | 6 | 2 | P0-P2 |
| Authentication & Authorization | 5 | 3 | P0-P1 |
| Dashboard & Analytics | 4 | 2 | P1-P2 |
| Admin Operations | 4 | 2 | P0-P2 |
| Feedback & Ratings | 3 | 1 | P1-P3 |
| API & Integration | 1 | 0 | P1 |
| Edge Cases | 6 | 1 | P2-P3 |
| Performance | 3 | 1 | P2 |
| Accessibility | 3 | 0 | P2-P3 |

---

# EXECUTION INSTRUCTIONS

## Prerequisites

```bash
# Start development server
pnpm dev

# Seed database with test data
pnpm db:seed

# Prepare test fixtures
mkdir -p tests/e2e/fixtures
# Create test skill zip files:
# - test-skill-secure.zip (clean skill)
# - malicious-skill.zip (with security issues)
# - skill-with-tests.zip (with test cases)
# - large-skill-50mb.zip (for performance testing)
# - test-skill-1.zip through test-skill-4.zip (for concurrent testing)
```

## Running Tests

```bash
# Run single test
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" <commands>

# Run all tests (script)
./tests/e2e/run-all-tests.sh
```

## Test Report Template

```markdown
## Test Execution Report

**Date:** YYYY-MM-DD
**Environment:** localhost:3002
**Tester:** Automated

| Test ID | Status | Duration | Screenshot |
|---------|--------|----------|------------|
| TC-1.1  | PASS   | 45s      | e2e-01.png |
| TC-1.2  | PASS   | 38s      | e2e-02.png |
...
```

## Priority Execution Order

### P0 - Critical (Must Pass)
1. TC-1.1: Complete Skill Upload Flow with Security Analysis
2. TC-1.2: Skill Upload with Malicious Code Detection
3. TC-2.1: Advanced Skill Search with Filters
4. TC-2.2: Skill Detail Page Full Navigation
5. TC-3.1: Complete Team Lifecycle
6. TC-3.2: Team Skill Sharing and Permissions
7. TC-4.1: Complete Bundle Lifecycle
8. TC-5.1: Complete Evaluation Lifecycle
9. TC-6.1: Complete User Registration Flow
10. TC-6.4: Role-Based Access Control Full Test
11. TC-8.1: Complete Admin User Management

### P1 - High Priority
1. TC-4.2: Bundle Versioning and Updates
2. TC-5.2: Evaluation Queue Management
3. TC-6.2: Complete Password Reset Flow
4. TC-7.1: Complete Dashboard Overview
5. TC-8.2: Complete Admin Skill Moderation
6. TC-9.1: Complete Skill Review Flow

### P2 - Medium Priority
1. TC-7.2: Analytics Dashboard with Charts
2. EC-1: Concurrent Upload Handling
3. PT-1: Page Load Performance Testing
4. All other P2 tests

### P3 - Low Priority
1. EC-4: Browser Navigation Edge Cases
2. A11Y-3: Color Contrast
3. All other P3 tests

