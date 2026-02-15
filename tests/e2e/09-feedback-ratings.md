# Series 9: Feedback & Ratings

[返回概览](./00-overview.md) | [上一部分: Admin Operations](./08-admin-operations.md)

---

## ⭐ TC-9.1: Complete Skill Review Flow (LONG)

**Priority:** P1
**Estimated Steps:** 25+

### Description
Test review submission, editing, and display.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to a skill
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser screenshot e2e-skill-for-review.png

# Step 3: Navigate to Reviews tab
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser screenshot e2e-reviews-tab.png

# Step 4: Verify reviews section
agent-browser snapshot -i
# Verify: Rating breakdown, existing reviews, "Write a Review" button

# Step 5: Click write review
agent-browser find text "Write a Review" click
agent-browser wait 1000
agent-browser screenshot e2e-review-form.png

# Step 6: Verify review form
agent-browser snapshot -i
# Verify: Rating stars, title input, review textarea, submit button

# Step 7: Set rating (5 stars)
agent-browser find '.star-rating[data-value="5"]' click
agent-browser wait 500
# Verify: 5 stars selected

# Step 8: Enter review title
agent-browser find 'input[name="title"]' fill "Excellent PDF skill"
agent-browser wait 500

# Step 9: Enter review content
agent-browser find 'textarea[name="content"]' fill "This skill works perfectly for all my PDF processing needs. Great documentation and fast execution."
agent-browser wait 500

# Step 10: Submit review
agent-browser find 'button[type="submit"]' click
agent-browser wait 3000
agent-browser screenshot e2e-review-submitted.png

# Step 11: Verify review appears
agent-browser snapshot -i
# Verify: New review visible in list

# Step 12: Verify rating updated
agent-browser find text "Reviews" click
agent-browser wait 500
# Verify: Overall rating includes new review

# Step 13: Edit review
agent-browser find text "Edit" click
agent-browser wait 1000

# Step 14: Modify rating
agent-browser find '.star-rating[data-value="4"]' click
agent-browser wait 500

# Step 15: Modify content
agent-browser find 'textarea[name="content"]' fill "Updated: Great skill but could use some performance improvements for large files."
agent-browser wait 500

# Step 16: Save edit
agent-browser find text "Save" click
agent-browser wait 2000
agent-browser screenshot e2e-review-edited.png

# Step 17: Verify edit saved
agent-browser snapshot -i
# Verify: Updated review content visible

# Step 18: Delete review
agent-browser find text "Delete" click
agent-browser wait 500

# Step 19: Confirm deletion
agent-browser find text "Confirm" click
agent-browser wait 2000
agent-browser screenshot e2e-review-deleted.png

# Step 20: Verify review removed
agent-browser snapshot -i
# Verify: Review no longer in list

# Step 21: Test review validation - empty content
agent-browser find text "Write a Review" click
agent-browser wait 1000
agent-browser find '.star-rating[data-value="5"]' click
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Validation error for empty content

# Step 22: Test review validation - no rating
agent-browser find 'input[name="title"]' fill "Test"
agent-browser find 'textarea[name="content"]' fill "Test content"
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Validation error for missing rating

# Step 23: Test duplicate review prevention
agent-browser find '.star-rating[data-value="5"]' click
agent-browser find 'input[name="title"]' fill "Another review"
agent-browser find 'textarea[name="content"]' fill "Trying to add another review"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
# Verify: Error or already reviewed message
```

### Expected Results
- Review form works correctly
- Rating selection works
- Review submitted successfully
- Edit functionality works
- Delete with confirmation works
- Validation catches errors
- Duplicate prevention works

---

## TC-9.2: Review Moderation Flow

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test review moderation by admin.

### Steps

```bash
# Step 1: Submit review with flagged content (as user)
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "bob@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser find text "Write a Review" click
agent-browser wait 500

# Step 2: Submit review with potentially flagged content
agent-browser find '.star-rating[data-value="1"]' click
agent-browser find 'input[name="title"]' fill "Test review"
agent-browser find 'textarea[name="content"]' fill "This is a spam review with inappropriate content"
agent-browser find 'button[type="submit"]' click
agent-browser wait 2000
agent-browser screenshot e2e-flagged-review.png

# Step 3: Login as admin
agent-browser find text "Sign out" click
agent-browser wait --url "**/login"
agent-browser find 'input[type="email"]' fill "admin@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 4: Navigate to review moderation
agent-browser open http://localhost:3002/dashboard/admin/reviews
agent-browser wait 2000
agent-browser screenshot e2e-review-moderation.png

# Step 5: Verify flagged reviews listed
agent-browser snapshot -i
# Verify: Flagged review visible

# Step 6: View review details
agent-browser find text "Test review" click
agent-browser wait 1000
# Verify: Full review content shown

# Step 7: Approve or reject review
agent-browser find text "Reject" click
agent-browser wait 500
agent-browser find 'textarea[name="reason"]' fill "Spam content"
agent-browser find text "Confirm" click
agent-browser wait 2000
agent-browser screenshot e2e-review-rejected.png

# Step 8: Verify review removed from public view
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser find text "Reviews" click
agent-browser wait 1000
# Verify: Flagged review not visible
```

### Expected Results
- Flagged content detected
- Admin can moderate reviews
- Rejection removes from public view
- Reason captured

---

## TC-9.3: Review Voting and Helpfulness

**Priority:** P3
**Estimated Steps:** 15+

### Description
Test helpful voting on reviews.

### Steps

```bash
# Step 1: Login
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

# Step 2: Navigate to skill with reviews
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
agent-browser screenshot e2e-reviews-voting.png

# Step 3: Find a review
agent-browser snapshot -i
# Verify: Reviews with helpful counts

# Step 4: Click "Helpful" button
agent-browser find text "Helpful" click
agent-browser wait 1000

# Step 5: Verify count increased
agent-browser snapshot -i
# Verify: Helpful count incremented

# Step 6: Click "Not Helpful"
agent-browser find text "Not Helpful" click
agent-browser wait 1000
# Verify: Vote changed

# Step 7: Verify own vote highlighted
agent-browser snapshot -i
# Verify: Current vote state shown

# Step 8: Remove vote
agent-browser find text "Not Helpful" click
agent-browser wait 1000
# Verify: Vote removed, count updated

# Step 9: Test vote on own review (should be blocked)
# Navigate to a skill you reviewed
agent-browser open http://localhost:3002/marketplace/docx
agent-browser wait 2000
agent-browser find text "Reviews" click
agent-browser wait 1000
# Try to vote on own review - should be disabled or show message
```

### Expected Results
- Voting updates count
- Vote state persisted
- Can change vote
- Can remove vote
- Cannot vote on own review

---

[下一部分: API & Integration](./10-api-integration.md)
