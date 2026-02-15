# Series 8: Admin Operations

[返回概览](./00-overview.md) | [上一部分: Dashboard & Analytics](./07-dashboard-analytics.md)

---

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

[下一部分: Feedback & Ratings](./09-feedback-ratings.md)
