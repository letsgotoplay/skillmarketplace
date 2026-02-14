# Series 3: Team Management

[返回概览](./00-overview.md) | [上一部分: Skill Search & Discovery](./02-skill-search-discovery.md)

---

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

[下一部分: Bundle Management](./04-bundle-management.md)
