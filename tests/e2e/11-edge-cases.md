# Edge Case Tests

[返回概览](./00-overview.md) | [上一部分: API & Integration](./10-api-integration.md)

---

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

[下一部分: Performance Tests](./12-performance-tests.md)
