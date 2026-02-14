# E2E Test Plan - SkillHub Enterprise Marketplace

**Total Tests:** 55
**Long-Step Tests:** 12 (marked with ⭐)
**Complete Series:** 1 (Skill Upload with Security Scan - Full Lifecycle)

---

## Test Categories

| Category | Count | Long-Step |
|----------|-------|-----------|
| 1. Skill Upload & Security | 10 | 3 |
| 2. Skill Search & Discovery | 8 | 2 |
| 3. Team Management | 8 | 2 |
| 4. Bundle Management | 6 | 2 |
| 5. Skill Evaluation | 6 | 2 |
| 6. Authentication & Authorization | 5 | 0 |
| 7. Dashboard & Analytics | 4 | 0 |
| 8. Admin Operations | 4 | 1 |
| 9. Feedback & Ratings | 3 | 0 |
| 10. API & Integration | 1 | 0 |

---

## Test Files Index

执行顺序按文件编号进行：

| File | Description | Priority |
|------|-------------|----------|
| [00-overview.md](./00-overview.md) | 测试计划概览 | - |
| [01-skill-upload-security.md](./01-skill-upload-security.md) | 技能上传与安全扫描 | P0 |
| [02-skill-search-discovery.md](./02-skill-search-discovery.md) | 技能搜索与发现 | P0 |
| [03-team-management.md](./03-team-management.md) | 团队管理 | P0 |
| [04-bundle-management.md](./04-bundle-management.md) | 技能包管理 | P0-P1 |
| [05-skill-evaluation.md](./05-skill-evaluation.md) | 技能评估测试 | P0-P1 |
| [06-auth-authorization.md](./06-auth-authorization.md) | 认证与授权 | P0 |
| [07-dashboard-analytics.md](./07-dashboard-analytics.md) | 仪表盘与分析 | P1-P2 |
| [08-admin-operations.md](./08-admin-operations.md) | 管理员操作 | P0-P2 |
| [09-feedback-ratings.md](./09-feedback-ratings.md) | 反馈与评分 | P1-P3 |
| [10-api-integration.md](./10-api-integration.md) | API 与集成 | P1 |
| [11-edge-cases.md](./11-edge-cases.md) | 边缘情况测试 | P2-P3 |
| [12-performance-tests.md](./12-performance-tests.md) | 性能测试 | P2 |
| [13-accessibility-tests.md](./13-accessibility-tests.md) | 无障碍测试 | P2-P3 |
| [14-summary-and-execution.md](./14-summary-and-execution.md) | 总结与执行指南 | - |

---

## Prerequisites

```bash
# Start development server
pnpm dev

# Seed database with test data
pnpm db:seed

# Prepare test fixtures
mkdir -p tests/e2e/fixtures
# Create test skill zip files:
# - test-skill-secure.zip (clean skill)
# - malicious-skill.zip (with security issues)
# - skill-with-tests.zip (with test cases)
# - large-skill-50mb.zip (for performance testing)
# - test-skill-1.zip through test-skill-4.zip (for concurrent testing)
```

## Test Data

测试用户数据位于 `tests/e2e/sample-profile-data`:
- Admin: admin@example.com / password123
- Team Owner: alice@example.com / password123
- Team Member: bob@example.com / password123
