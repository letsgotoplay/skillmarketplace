# Series 6: Authentication & Authorization

[返回概览](./00-overview.md) | [上一部分: Skill Evaluation](./05-skill-evaluation.md)

---

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

[下一部分: Dashboard & Analytics](./07-dashboard-analytics.md)
