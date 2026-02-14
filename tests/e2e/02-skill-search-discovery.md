# Series 2: Skill Search & Discovery

[返回概览](./00-overview.md) | [上一部分: Skill Upload & Security](./01-skill-upload-security.md)

---

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

[下一部分: Team Management](./03-team-management.md)
