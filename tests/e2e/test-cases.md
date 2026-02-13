# E2E Test Cases for Skill Marketplace

This document contains comprehensive E2E test cases to be executed with agent-browser.

## Prerequisites
- Server running at http://localhost:3002
- Database seeded with test data (`pnpm db:seed`)
- Chrome browser installed

## Test Credentials
- admin@example.com / password123 (ADMIN)
- alice@example.com / password123 (Team Owner)
- bob@example.com / password123 (Team Admin)

---

## Test Suite 1: Homepage & Navigation

### TC-1.1: Homepage Loads
```
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" open http://localhost:3002
agent-browser snapshot -i
# Verify: Hero section, featured skills, navigation links present
agent-browser screenshot e2e-homepage.png
```

### TC-1.2: Navigate to Marketplace
```
agent-browser find text "Marketplace" click
agent-browser wait --url "**/marketplace"
agent-browser snapshot -i
# Verify: Skills grid, search/filter options
```

### TC-1.3: Navigate to Documentation
```
agent-browser open http://localhost:3002
agent-browser find text "Docs" click
agent-browser wait --url "**/docs"
agent-browser snapshot -i
# Verify: Documentation page with skill guides
```

---

## Test Suite 2: Authentication

### TC-2.1: Login as Admin
```
agent-browser open http://localhost:3002/login
agent-browser snapshot -i
agent-browser fill @e1 "admin@example.com"  # Email input
agent-browser fill @e2 "password123"         # Password input
agent-browser click @e3                       # Submit button
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i
# Verify: Dashboard loads, user email shown
```

### TC-2.2: Login as Team Member
```
agent-browser open http://localhost:3002/login
agent-browser snapshot -i
agent-browser fill @e1 "alice@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
# Verify: Dashboard loads with team member view
```

### TC-2.3: Invalid Login Attempt
```
agent-browser open http://localhost:3002/login
agent-browser fill @e1 "wrong@example.com"
agent-browser fill @e2 "wrongpassword"
agent-browser click @e3
agent-browser wait --text "Invalid"
# Verify: Error message displayed
```

### TC-2.4: Logout
```
# After logging in
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
# Verify: Redirected to login page
```

---

## Test Suite 3: Skill Browsing

### TC-3.1: View Public Skills in Marketplace
```
agent-browser open http://localhost:3002/marketplace
agent-browser snapshot -i
# Verify: Public skills displayed (pdf, pptx, docx, xlsx, etc.)
agent-browser get count ".skill-card"
# Expected: 8+ public skills
```

### TC-3.2: View Skill Detail
```
agent-browser open http://localhost:3002/marketplace
agent-browser find text "pdf" click
agent-browser wait --url "**/marketplace/pdf"
agent-browser snapshot -i
# Verify: Skill name, description, versions, stats, security info
agent-browser screenshot e2e-skill-detail.png
```

### TC-3.3: View Skill Files
```
# On skill detail page
agent-browser find text "Files" click
agent-browser snapshot -i
# Verify: File tree displayed with SKILL.md, scripts/, etc.
```

### TC-3.4: View Security Report
```
# On skill detail page
agent-browser find text "Security" click
agent-browser snapshot -i
# Verify: Security score, findings, recommendations displayed
```

---

## Test Suite 4: Dashboard Features

### TC-4.1: View Dashboard Overview
```
# Login first
agent-browser open http://localhost:3002/login
agent-browser fill @e1 "admin@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"
agent-browser snapshot -i
# Verify: Dashboard cards for Skills, Teams, Bundles, etc.
```

### TC-4.2: View My Skills
```
agent-browser find text "My Skills" click
agent-browser wait --url "**/dashboard/skills"
agent-browser snapshot -i
# Verify: User's skills listed
```

### TC-4.3: View Teams
```
agent-browser open http://localhost:3002/dashboard/teams
agent-browser snapshot -i
# Verify: Teams list, member counts
```

### TC-4.4: View Bundles
```
agent-browser open http://localhost:3002/dashboard/bundles
agent-browser snapshot -i
# Verify: Bundles listed (Document Suite, Developer Toolkit, etc.)
```

### TC-4.5: View Evaluations
```
agent-browser open http://localhost:3002/dashboard/evaluations
agent-browser snapshot -i
# Verify: Evaluation queue status, results
```

### TC-4.6: View Security Scans
```
agent-browser open http://localhost:3002/dashboard/security
agent-browser snapshot -i
# Verify: Security scan reports listed
```

---

## Test Suite 5: Analytics

### TC-5.1: View Analytics Dashboard
```
# Login first
agent-browser open http://localhost:3002/dashboard/analytics
agent-browser snapshot -i
# Verify: Overview stats, charts, trend data
agent-browser screenshot e2e-analytics.png
```

### TC-5.2: View Statistics API Response
```
agent-browser open http://localhost:3002/api/stats/overview
agent-browser snapshot -i
# Verify: JSON response with skills, users, teams stats
```

---

## Test Suite 6: Admin Features

### TC-6.1: Admin Overview
```
# Login as admin
agent-browser open http://localhost:3002/login
agent-browser fill @e1 "admin@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/dashboard/admin/overview
agent-browser snapshot -i
# Verify: System stats, user counts, skill counts
```

### TC-6.2: User Management
```
agent-browser open http://localhost:3002/dashboard/admin/users
agent-browser snapshot -i
# Verify: User list with roles, actions
```

### TC-6.3: Audit Logs
```
agent-browser open http://localhost:3002/dashboard/admin/audit-logs
agent-browser snapshot -i
# Verify: Audit log entries displayed
```

---

## Test Suite 7: Skill Download (Authenticated)

### TC-7.1: Download Requires Auth
```
# Not logged in
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser find text "Download" click
agent-browser wait --text "Sign in"
# Verify: Prompted to sign in
```

### TC-7.2: Download After Login
```
# Login first
agent-browser open http://localhost:3002/login
agent-browser fill @e1 "admin@example.com"
agent-browser fill @e2 "password123"
agent-browser click @e3
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/marketplace/pdf
agent-browser find text "Download" click
# Verify: Download initiated
```

---

## Test Suite 8: Feedback System

### TC-8.1: View Skill Feedback
```
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser find text "Reviews" click
agent-browser snapshot -i
# Verify: Feedback section with ratings, comments
```

### TC-8.2: Submit Feedback (Authenticated)
```
# Login first, then on skill detail page
agent-browser find text "Write a Review" click
agent-browser snapshot -i
# Verify: Rating form appears
```

---

## Test Suite 9: Navigation & Routing

### TC-9.1: Back to Home from Dashboard
```
agent-browser open http://localhost:3002/dashboard
agent-browser snapshot -i
# Click home/marketplace link
agent-browser find text "Marketplace" click
agent-browser wait --url "**/marketplace"
# Verify: Navigated to marketplace
```

### TC-9.2: Direct URL Access
```
# Test various direct URLs
agent-browser open http://localhost:3002/dashboard/skills
agent-browser wait 2000
agent-browser get url
# Verify: URL is correct

agent-browser open http://localhost:3002/dashboard/teams
agent-browser wait 2000
agent-browser get url
# Verify: URL is correct

agent-browser open http://localhost:3002/dashboard/bundles
agent-browser wait 2000
agent-browser get url
# Verify: URL is correct
```

---

## Execution Script

Run all tests sequentially:

```bash
#!/bin/bash
# e2e-test-runner.sh

echo "Starting E2E Test Suite..."

# Start with homepage
echo "Test 1: Homepage"
agent-browser --executable-path "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" open http://localhost:3002
agent-browser screenshot e2e-01-homepage.png

# Test authentication
echo "Test 2: Login"
agent-browser open http://localhost:3002/login
agent-browser snapshot -i
agent-browser screenshot e2e-02-login.png

# Test marketplace
echo "Test 3: Marketplace"
agent-browser open http://localhost:3002/marketplace
agent-browser snapshot -i
agent-browser screenshot e2e-03-marketplace.png

# Test skill detail
echo "Test 4: Skill Detail"
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser snapshot -i
agent-browser screenshot e2e-04-skill-detail.png

# Test dashboard
echo "Test 5: Dashboard"
agent-browser open http://localhost:3002/dashboard
agent-browser snapshot -i
agent-browser screenshot e2e-05-dashboard.png

echo "E2E Tests Complete!"
agent-browser close
```

---

## Expected Results Summary

| Test Suite | Expected Result |
|------------|-----------------|
| Homepage | Hero section, navigation, featured skills |
| Authentication | Login success, redirect to dashboard |
| Skill Browsing | Public skills visible, details load |
| Dashboard | All cards/sections functional |
| Analytics | Charts and stats displayed |
| Admin | User list, audit logs visible |
| Downloads | Auth required, then download |
| Feedback | Ratings and comments visible |
| Navigation | All routes accessible |
