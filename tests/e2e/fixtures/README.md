# E2E Test Fixtures

This directory contains test fixture zip files for E2E testing of the SkillHub marketplace.

## Quick Start

Run the fixture generator script:

```bash
cd tests/e2e/fixtures
chmod +x create-fixtures.sh
./create-fixtures.sh
```

## Fixture Files

| File | Size | Purpose |
|------|------|---------|
| `test-skill-secure.zip` | ~3KB | Clean skill with no security issues for basic upload testing |
| `malicious-skill.zip` | ~2KB | Skill with intentional security vulnerabilities for scanner testing |
| `skill-with-tests.zip` | ~3KB | Skill with comprehensive test suite for evaluation testing |
| `large-skill.zip` | ~2.6MB | Large skill for performance and timeout testing |
| `test-skill-1.zip` | ~800B | Simple skill for concurrent upload testing |
| `test-skill-2.zip` | ~800B | Simple skill for concurrent upload testing |
| `test-skill-3.zip` | ~800B | Simple skill for concurrent upload testing |
| `test-skill-4.zip` | ~800B | Simple skill for concurrent upload testing |
| `sample-skill-minimal.zip` | ~400B | Minimal compliant skill (only required fields) |
| `sample-skill-full.zip` | ~3KB | Full-featured skill with all optional fields and directories |

## Fixture Details

### test-skill-secure.zip

A clean, secure skill that should pass all security checks.

**Contents:**
- `SKILL.md` - Skill documentation
- `index.js` - Main entry point with secure file operations
- `package.json` - Package manifest
- `test/test.js` - Unit tests
- `scripts/setup.sh` - Setup script

**Security Profile:**
- Risk Level: Low/None
- No vulnerabilities detected

**Use Cases:**
- Basic upload flow testing
- Security scan baseline testing
- File preview testing
- Download testing

---

### malicious-skill.zip

A skill containing intentional security vulnerabilities for testing the security scanner.

**Contents:**
- `SKILL.md` - Warning documentation
- `exploit.js` - Main file with vulnerabilities
- `package.json` - Package manifest

**Security Vulnerabilities Included:**
1. **eval() usage** - HIGH severity
2. **Command injection** (child_process.exec) - CRITICAL severity
3. **SQL injection patterns** - CRITICAL severity
4. **Path traversal** - HIGH severity
5. **Hardcoded credentials** - HIGH severity

**Expected Security Result:**
- Risk Level: High/Critical
- 5+ findings detected
- Should trigger security warnings
- May be blocked from download

**Use Cases:**
- Security scanner detection testing
- Malicious pattern recognition testing
- Security warning display testing
- Blocked download testing

---

### skill-with-tests.zip

A skill with a comprehensive test suite for evaluation system testing.

**Contents:**
- `SKILL.md` - Skill documentation
- `index.js` - Math/utility functions
- `package.json` - Package manifest
- `test/test.js` - 25+ test cases

**Test Coverage:**
- Basic arithmetic (add, subtract, multiply, divide)
- Calculate function with operations
- Greet function edge cases
- Utility functions
- Error handling

**Expected Evaluation Result:**
- Status: Completed
- Tests: 15+ passed
- Pass Rate: 100%

**Use Cases:**
- Evaluation queue testing
- Test result display testing
- Coverage report testing
- Re-run evaluation testing

---

### large-skill.zip

A skill with a large data file for performance testing.

**Contents:**
- `SKILL.md` - Skill documentation
- `package.json` - Package manifest
- `data/large-data.json` - 50,000 records (~28MB uncompressed)

**Use Cases:**
- Upload performance testing
- Timeout handling testing
- Progress indicator testing
- Large file preview testing

---

### test-skill-1.zip through test-skill-4.zip

Simple skills for concurrent upload testing.

**Contents (each):**
- `SKILL.md` - Basic documentation
- `index.js` - Simple module
- `package.json` - Package manifest

**Use Cases:**
- Concurrent upload testing
- Queue processing testing
- Race condition testing

---

### sample-skill-minimal.zip

A minimal compliant skill with only required fields.

**Contents:**
- `SKILL.md` - Minimal documentation with only `name` and `description`

**Compliance:**
- Risk Level: None
- Follows specification exactly
- Only required fields present

**Use Cases:**
- Reference for simplest valid skill
- Specification compliance testing
- Validation baseline testing

---

### sample-skill-full.zip

A comprehensive skill demonstrating all optional fields and directories.

**Contents:**
- `SKILL.md` - Documentation with all optional fields
- `scripts/setup.sh` - Installation script
- `scripts/process.js` - Data processing utility
- `references/REFERENCE.md` - Detailed documentation
- `assets/config.json` - Default configuration
- `package.json` - Package manifest

**Frontmatter Fields:**
- `name` (required)
- `description` (required)
- `license` (optional)
- `compatibility` (optional)
- `metadata` (optional)
- `allowed-tools` (optional)

**Use Cases:**
- Reference for full-featured skill structure
- Directory structure testing
- Optional field validation

## Test Matrix

| Test Case | Fixture(s) Used |
|-----------|-----------------|
| TC-1.1: Skill Upload with Security | test-skill-secure.zip |
| TC-1.2: Malicious Code Detection | malicious-skill.zip |
| TC-1.5: Batch Upload | test-skill-1..4.zip |
| TC-1.6: Large File Upload | large-skill.zip |
| TC-5.1: Evaluation Lifecycle | skill-with-tests.zip |
| TC-Spec: Specification Compliance | sample-skill-minimal.zip, sample-skill-full.zip |
| EC-1: Concurrent Uploads | test-skill-1..4.zip |
| EC-3: Large File Handling | large-skill.zip |

## Regenerating Fixtures

If you need to regenerate the fixtures:

```bash
cd tests/e2e/fixtures
rm *.zip
./create-fixtures.sh
```

## Notes

- All fixtures are safe to use in testing environments
- `malicious-skill.zip` contains intentional vulnerabilities but is not executable
- Large fixture generation may take a few seconds due to JSON generation
- All skills follow the Agent Skills Specification with proper YAML frontmatter
