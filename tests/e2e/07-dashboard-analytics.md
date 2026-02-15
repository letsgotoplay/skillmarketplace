# Series 7: Dashboard & Analytics

[返回概览](./00-overview.md) | [上一部分: Authentication & Authorization](./06-auth-authorization.md)

---

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

[下一部分: Admin Operations](./08-admin-operations.md)
