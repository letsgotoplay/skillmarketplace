# Performance Tests

[返回概览](./00-overview.md) | [上一部分: Edge Cases](./11-edge-cases.md)

---

## ⭐ PT-1: Page Load Performance Testing (LONG)

**Priority:** P2
**Estimated Steps:** 25+

### Description
Measure and verify page load times.

### Target Times
| Page | Target |
|------|--------|
| Homepage | < 2s |
| Marketplace | < 3s |
| Skill Detail | < 2s |
| Dashboard | < 2s |
| Search Results | < 1s |

### Steps

```bash
# Step 1: Clear browser cache
agent-browser clear-cache
agent-browser clear-cookies

# Step 2: Test homepage load time
agent-browser open http://localhost:3002
agent-browser wait 5000
agent-browser screenshot e2e-perf-homepage.png
# Record: Load time from network tab

# Step 3: Navigate to marketplace
agent-browser open http://localhost:3002/marketplace
agent-browser wait 5000
agent-browser screenshot e2e-perf-marketplace.png
# Record: Load time

# Step 4: Test skill detail load
agent-browser open http://localhost:3002/marketplace/pdf
agent-browser wait 5000
agent-browser screenshot e2e-perf-skill-detail.png
# Record: Load time

# Step 5: Test dashboard load (logged in)
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"
agent-browser screenshot e2e-perf-dashboard.png
# Record: Load time

# Step 6: Test search response time
agent-browser open http://localhost:3002/marketplace
agent-browser wait 1000
agent-browser find 'input[placeholder*="Search"]' fill "pdf"
agent-browser wait 2000
agent-browser screenshot e2e-perf-search.png
# Record: Search response time

# Step 7: Test API response time
agent-browser open http://localhost:3002/api/skills
agent-browser wait 1000
# Record: API response time

# Step 8: Test with cache (second load)
agent-browser open http://localhost:3002/marketplace
agent-browser wait 2000
# Record: Cached load time (should be faster)

# Step 9: Test with many items
agent-browser open "http://localhost:3002/marketplace?per_page=100"
agent-browser wait 5000
agent-browser screenshot e2e-perf-many-items.png
# Record: Load time with 100 items

# Step 10: Test concurrent users simulation
# Open multiple tabs/windows
agent-browser open http://localhost:3002/marketplace
agent-browser open http://localhost:3002/dashboard
agent-browser open http://localhost:3002/api/skills
agent-browser wait 5000
# Verify: All pages load without degradation
```

### Expected Results
- All pages load within target times
- Cached loads faster
- No degradation with many items
- Concurrent access works

---

## PT-2: Search Performance Testing

**Priority:** P2
**Estimated Steps:** 15+

### Description
Measure search API response time.

### Target: < 500ms

### Steps

```bash
# Step 1: Test empty search
agent-browser open http://localhost:3002/api/skills?search=
agent-browser wait 1000
# Record: Response time

# Step 2: Test single term search
agent-browser open http://localhost:3002/api/skills?search=pdf
agent-browser wait 1000
# Record: Response time

# Step 3: Test complex search with filters
agent-browser open "http://localhost:3002/api/skills?search=pdf&category=document&security=low"
agent-browser wait 1000
# Record: Response time

# Step 4: Test pagination performance
agent-browser open "http://localhost:3002/api/skills?page=1&per_page=50"
agent-browser wait 1000
# Record: Response time

# Step 5: Test sort performance
agent-browser open "http://localhost:3002/api/skills?sort=downloads&order=desc"
agent-browser wait 1000
# Record: Response time
```

### Expected Results
- All searches complete under 500ms
- Complex queries perform well
- Pagination efficient

---

## PT-3: API Endpoint Performance

**Priority:** P2
**Estimated Steps:** 15+

### Description
Test API endpoint response times.

### Steps

```bash
# Step 1: Test skills list API
agent-browser open http://localhost:3002/api/skills
agent-browser wait 1000
# Record: Response time, payload size

# Step 2: Test single skill API
agent-browser open http://localhost:3002/api/skills/pdf
agent-browser wait 1000
# Record: Response time

# Step 3: Test stats API
agent-browser open http://localhost:3002/api/stats/overview
agent-browser wait 1000
# Record: Response time

# Step 4: Test search API
agent-browser open http://localhost:3002/api/skills?search=test
agent-browser wait 1000
# Record: Response time

# Step 5: Test with authentication
agent-browser open http://localhost:3002/login
agent-browser find 'input[type="email"]' fill "alice@example.com"
agent-browser find 'input[type="password"]' fill "password123"
agent-browser find 'button[type="submit"]' click
agent-browser wait --url "**/dashboard"

agent-browser open http://localhost:3002/api/skills?includePrivate=true
agent-browser wait 1000
# Record: Response time for authenticated request
```

### Expected Results
- All API endpoints respond quickly
- Authenticated requests not significantly slower

---

[下一部分: Accessibility Tests](./13-accessibility-tests.md)
