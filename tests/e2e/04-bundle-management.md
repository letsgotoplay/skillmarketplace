# Series 4: Bundle Management

[返回概览](./00-overview.md) | [上一部分: Team Management](./03-team-management.md)

---

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

[下一部分: Skill Evaluation](./05-skill-evaluation.md)
