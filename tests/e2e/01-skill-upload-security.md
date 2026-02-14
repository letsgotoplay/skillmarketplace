# Series 1: Skill Upload & Security

[返回概览](./00-overview.md)

---

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

[下一部分: Skill Search & Discovery](./02-skill-search-discovery.md)
