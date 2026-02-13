# E2E Test Documentation - Skill Marketplace

## Test Credentials

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| admin@example.com | password123 | ADMIN | Full system access |
| alice@example.com | password123 | USER | Team Owner (Acme Corp) |
| bob@example.com | password123 | USER | Team Admin (Acme Corp) |
| charlie@example.com | password123 | USER | Team Member (Acme Corp) |
| diana@example.com | password123 | USER | Solo Creator (Startup Labs owner) |
| eve@example.com | password123 | USER | Regular User (Startup Labs member) |

---

## Test Environment Setup

```bash
# Start services
docker-compose up -d

# Install dependencies
pnpm install

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start dev server
pnpm dev
```

Server runs at: http://localhost:3000 (or 3001 if 3000 is in use)

---

## User Journey Tests

### 1. Authentication Flow

#### 1.1 User Registration
1. Navigate to http://localhost:3000
2. Click "Sign In" button
3. Click "Create account" link
4. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "testpassword123"
5. Click "Create Account"
6. **Expected**: Redirect to /dashboard with success message

#### 1.2 User Login
1. Navigate to http://localhost:3000/login
2. Fill in:
   - Email: alice@example.com
   - Password: password123
3. Click "Sign In"
4. **Expected**: Redirect to /dashboard
5. Verify user name appears in welcome message

#### 1.3 User Logout
1. While logged in, navigate to any dashboard page
2. Click logout/sign out button
3. **Expected**: Redirect to home page
4. Verify cannot access /dashboard without login

---

### 2. Marketplace Flow (Public)

#### 2.1 Browse Marketplace
1. Navigate to http://localhost:3000/marketplace
2. **Expected**: See list of public skills (at least 4)
3. Verify each skill card shows:
   - Skill name
   - Description
   - Version number
   - Download count
   - Author name

#### 2.2 View Skill Details
1. On marketplace, click on any skill card
2. **Expected**: Navigate to skill detail page
3. Verify skill information is displayed correctly

#### 2.3 Download Skill (Requires Auth)
1. While not logged in, try to download a skill
2. **Expected**: Redirect to login or show auth required message
3. Login and retry download
4. **Expected**: Skill file downloads successfully

---

### 3. Skills Management Flow

#### 3.1 View My Skills
1. Login as alice@example.com
2. Navigate to http://localhost:3000/dashboard/skills
3. **Expected**: See skills owned by Alice (at least Code Reviewer, Auth Helper)

#### 3.2 Upload New Skill
1. From skills page, click "Upload Skill"
2. **Expected**: Navigate to upload page
3. Note: Upload requires valid skill zip file

#### 3.3 View Skill Detail
1. From skills list, click on a skill
2. **Expected**: Navigate to /dashboard/skills/[id]
3. Verify shows:
   - Skill name and description
   - Visibility badge
   - Download count
   - Version history
   - Download button

---

### 4. Teams Flow

#### 4.1 View My Teams
1. Login as alice@example.com
2. Navigate to http://localhost:3000/dashboard/teams
3. **Expected**: See "Acme Corp" team
4. Verify shows member count and skill count

#### 4.2 View Team Detail
1. Click on "Acme Corp" team
2. **Expected**: Navigate to /dashboard/teams/[id]
3. Verify shows:
   - Team name and description
   - List of members with roles
   - Team skills

#### 4.3 Create New Team
1. Login as any user
2. Navigate to /dashboard/teams
3. Click "Create Team"
4. Fill in:
   - Name: "Test Team"
   - Description: "A test team"
5. Click "Create Team"
6. **Expected**: Redirect to new team page

---

### 5. Bundles Flow

#### 5.1 View My Bundles
1. Login as diana@example.com
2. Navigate to http://localhost:3000/dashboard/bundles
3. **Expected**: See bundles accessible to Diana

#### 5.2 View Bundle Detail
1. Click on any bundle
2. **Expected**: Navigate to /dashboard/bundles/[id]
3. Verify shows:
   - Bundle name and description
   - List of included skills
   - Visibility badge

#### 5.3 Create New Bundle
1. Navigate to /dashboard/bundles
2. Click "Create Bundle"
3. Fill in:
   - Name: "Test Bundle"
   - Description: "A test bundle"
   - Select some skills
4. Click "Create Bundle"
5. **Expected**: Redirect to new bundle page

---

### 6. Evaluations Flow

#### 6.1 View Evaluations
1. Login as alice@example.com
2. Navigate to http://localhost:3000/dashboard/evaluations
3. **Expected**: See evaluation jobs for Alice's skills
4. Verify shows:
   - Skill name and version
   - Status (PENDING, RUNNING, COMPLETED, FAILED)
   - Results summary

---

### 7. Security Flow

#### 7.1 View Security Scans
1. Login as diana@example.com
2. Navigate to http://localhost:3000/dashboard/security
3. **Expected**: See security scans for Diana's skills
4. Verify shows:
   - Skill name and version
   - Security score (0-100)
   - Status
   - Key findings

---

### 8. Statistics Flow

#### 8.1 View Statistics
1. Login as any user
2. Navigate to http://localhost:3000/dashboard/statistics
3. **Expected**: Redirect to /dashboard/analytics

#### 8.2 View Analytics Dashboard
1. Navigate to http://localhost:3000/dashboard/analytics
2. **Expected**: See analytics dashboard with:
   - Total skills, users, teams counts
   - Download and view trends
   - Top downloaded skills
   - Top viewed skills
   - Security overview
   - Export buttons

---

### 9. Admin Flow (Admin User Only)

#### 9.1 View Admin Dashboard
1. Login as admin@example.com
2. Navigate to http://localhost:3000/dashboard/admin
3. **Expected**: See admin dashboard

#### 9.2 View All Users
1. Navigate to /dashboard/admin/users
2. **Expected**: See list of all users
3. Verify can see user details, roles

#### 9.3 View Audit Logs
1. Navigate to /dashboard/admin/audit-logs
2. **Expected**: See list of audit log entries
3. Verify shows action, resource, timestamp

#### 9.4 View Reports
1. Navigate to /dashboard/admin/reports
2. **Expected**: See report generation options

---

## Page Verification Checklist

### Dashboard Pages (All should return 200, not 404)

| Route | Expected Status | Auth Required |
|-------|-----------------|---------------|
| /dashboard | 200 | Yes |
| /dashboard/skills | 200 | Yes |
| /dashboard/skills/upload | 200 | Yes |
| /dashboard/skills/[id] | 200 | Yes |
| /dashboard/teams | 200 | Yes |
| /dashboard/teams/create | 200 | Yes |
| /dashboard/teams/[id] | 200 | Yes |
| /dashboard/bundles | 200 | Yes |
| /dashboard/bundles/create | 200 | Yes |
| /dashboard/bundles/[id] | 200 | Yes |
| /dashboard/evaluations | 200 | Yes |
| /dashboard/security | 200 | Yes |
| /dashboard/statistics | 302 (redirect) | Yes |
| /dashboard/analytics | 200 | Yes |
| /dashboard/admin | 200 | Yes (Admin) |
| /dashboard/admin/users | 200 | Yes (Admin) |
| /dashboard/admin/audit-logs | 200 | Yes (Admin) |
| /dashboard/admin/reports | 200 | Yes (Admin) |

### Public Pages

| Route | Expected Status |
|-------|-----------------|
| / | 200 |
| /login | 200 |
| /register | 200 |
| /marketplace | 200 |

---

## Common Error Scenarios

### 404 Errors
- Accessing non-existent skill/team/bundle ID
- Accessing admin pages as non-admin user

### 401/403 Errors
- Accessing protected pages without login
- Accessing another user's private resources

### Form Validation Errors
- Empty required fields
- Invalid email format
- Password too short

---

## API Endpoint Tests

| Endpoint | Method | Auth | Expected |
|----------|--------|------|----------|
| /api/skills | GET | No | List public skills |
| /api/skills | POST | Yes | Create skill |
| /api/skills/[id] | GET | No | Get skill details |
| /api/skills/[id]/download | GET | Yes | Download skill file |
| /api/eval | GET | Yes | List evaluations |
| /api/stats/overview | GET | No | Get statistics |

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Notes for Agent-Browser Testing

1. Start at http://localhost:3000 (or 3001)
2. Use alice@example.com for standard user testing
3. Use admin@example.com for admin flow testing
4. Verify each page loads without 404
5. Check that navigation links work correctly
6. Verify data from seed is displayed correctly
