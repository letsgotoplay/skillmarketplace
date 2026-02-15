# Accessibility Tests

[返回概览](./00-overview.md) | [上一部分: Performance Tests](./12-performance-tests.md)

---

## A11Y-1: Keyboard Navigation

**Priority:** P2
**Estimated Steps:** 20+

### Description
Test keyboard-only navigation.

### Steps

```bash
# Step 1: Open homepage
agent-browser open http://localhost:3002
agent-browser wait 2000

# Step 2: Test Tab navigation
agent-browser press Tab
agent-browser wait 200
agent-browser press Tab
agent-browser wait 200
agent-browser press Tab
agent-browser wait 200
agent-browser screenshot e2e-a11y-tab-nav.png
# Verify: Focus indicator visible, logical order

# Step 3: Test Enter key activation
agent-browser press Enter
agent-browser wait 1000
# Verify: Focused element activated

# Step 4: Test Escape key
agent-browser press Escape
agent-browser wait 500
# Verify: Modal closed or navigation cancelled

# Step 5: Test form navigation
agent-browser open http://localhost:3002/login
agent-browser wait 1000
agent-browser press Tab
agent-browser type "alice@example.com"
agent-browser press Tab
agent-browser type "password123"
agent-browser press Tab
agent-browser press Enter
agent-browser wait --url "**/dashboard"
# Verify: Form navigable by keyboard

# Step 6: Test skip links
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser press Tab
# Verify: Skip to content link visible

# Step 7: Test dropdown navigation
agent-browser find 'button[aria-haspopup]' focus
agent-browser press Enter
agent-browser wait 500
agent-browser press ArrowDown
agent-browser press ArrowDown
agent-browser press Enter
# Verify: Dropdown navigable by arrow keys
```

### Expected Results
- All elements keyboard accessible
- Focus indicators visible
- Logical tab order
- Skip links work

---

## A11Y-2: Screen Reader Compatibility

**Priority:** P2
**Estimated Steps:** 15+

### Description
Verify screen reader compatibility.

### Steps

```bash
# Step 1: Check for proper headings
agent-browser open http://localhost:3002/marketplace
agent-browser wait 2000
# Verify: Proper heading hierarchy (h1, h2, h3)

# Step 2: Check image alt text
agent-browser find 'img'
# Verify: All images have alt attributes

# Step 3: Check ARIA labels
agent-browser find '[aria-label]'
# Verify: Interactive elements have labels

# Step 4: Check form labels
agent-browser open http://localhost:3002/login
agent-browser wait 1000
agent-browser find 'label'
# Verify: All form inputs have associated labels

# Step 5: Check landmark regions
agent-browser find '[role="main"]'
agent-browser find '[role="navigation"]'
# Verify: Proper landmark regions defined

# Step 6: Check live regions
agent-browser find '[aria-live]'
# Verify: Dynamic content has live regions
```

### Expected Results
- Proper semantic HTML
- ARIA attributes correct
- Form labels present
- Landmarks defined

---

## A11Y-3: Color Contrast

**Priority:** P3
**Estimated Steps:** 10+

### Description
Verify WCAG contrast ratios.

### Steps

```bash
# Step 1: Check primary text contrast
agent-browser open http://localhost:3002
agent-browser wait 2000
agent-browser screenshot e2e-a11y-contrast.png
# Verify: Text meets 4.5:1 contrast ratio

# Step 2: Check button contrast
agent-browser find 'button'
# Verify: Button text meets 3:1 ratio

# Step 3: Check error message contrast
agent-browser open http://localhost:3002/login
agent-browser find 'button[type="submit"]' click
agent-browser wait 1000
# Verify: Error messages have sufficient contrast

# Step 4: Check link contrast
agent-browser find 'a'
# Verify: Links distinguishable from surrounding text

# Step 5: Check focus indicator contrast
agent-browser press Tab
# Verify: Focus indicator has sufficient contrast
```

### Expected Results
- All text meets WCAG contrast requirements
- Focus indicators visible
- Error messages readable

---

[下一部分: Summary & Execution Guide](./14-summary-and-execution.md)
