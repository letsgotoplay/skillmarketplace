#!/bin/bash
# E2E Test Fixtures Generator
# Run this script to create all test fixture zip files
#
# Usage: ./create-fixtures.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="$SCRIPT_DIR"
TEMP_DIR="$FIXTURES_DIR/.temp"

echo "Creating E2E test fixtures..."
echo "Fixtures directory: $FIXTURES_DIR"
echo ""

# Clean up any previous temp files
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# ============================================
# 1. Create test-skill-secure.zip (Clean Skill)
# ============================================
echo "Creating test-skill-secure.zip..."

mkdir -p "$TEMP_DIR/test-skill-secure/test"
mkdir -p "$TEMP_DIR/test-skill-secure/scripts"

cat > "$TEMP_DIR/test-skill-secure/SKILL.md" << 'EOF'
---
name: test-skill-secure
description: A secure test skill for E2E testing that demonstrates proper skill structure. Use when testing upload flow or security scanning features without triggering warnings.
license: MIT
metadata:
  author: E2E Test Suite
  version: "1.0.0"
---

# Test Secure Skill

A secure test skill for E2E testing that demonstrates proper skill structure.

## Description

This skill is used for E2E testing of the marketplace upload and security scanning features. It contains no malicious code and follows all security best practices.

## Usage

Use this skill to test the upload flow without triggering security warnings.

## Capabilities

- Read files
- Write files
- Process data
EOF

cat > "$TEMP_DIR/test-skill-secure/index.js" << 'EOF'
/**
 * Test Secure Skill - Main Entry Point
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_OPTIONS = {
  timeout: 30000,
  maxFileSize: 10 * 1024 * 1024,
  encoding: 'utf-8',
  verbose: false
};

function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }
  const resolved = path.resolve(filePath);
  const stats = fs.statSync(resolved);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }
  if (stats.size > DEFAULT_OPTIONS.maxFileSize) {
    throw new Error(`File too large: ${stats.size} bytes`);
  }
  return true;
}

function readFile(filePath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (opts.verbose) console.log(`Reading file: ${filePath}`);
  validateFilePath(filePath);
  return fs.readFileSync(filePath, { encoding: opts.encoding });
}

function writeFile(filePath, content, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (opts.verbose) console.log(`Writing file: ${filePath}`);
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }
  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, { encoding: opts.encoding });
}

async function processFile(inputPath, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  try {
    const content = readFile(inputPath, opts);
    const processed = content.toUpperCase();
    return {
      success: true,
      inputPath,
      originalSize: content.length,
      processedSize: processed.length,
      processingTime: Date.now() - startTime,
      data: processed
    };
  } catch (error) {
    return {
      success: false,
      inputPath,
      error: error.message,
      processingTime: Date.now() - startTime
    };
  }
}

function getSkillInfo() {
  return {
    name: 'test-skill-secure',
    version: '1.0.0',
    description: 'A secure test skill for E2E testing',
    author: 'E2E Test Suite',
    capabilities: ['read', 'write', 'process']
  };
}

module.exports = {
  readFile,
  writeFile,
  processFile,
  validateFilePath,
  getSkillInfo,
  DEFAULT_OPTIONS
};
EOF

cat > "$TEMP_DIR/test-skill-secure/package.json" << 'EOF'
{
  "name": "test-skill-secure",
  "version": "1.0.0",
  "description": "A secure test skill for E2E testing",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "node test/test.js"
  },
  "keywords": ["skill", "test", "secure", "e2e"],
  "author": "E2E Test Suite",
  "license": "MIT"
}
EOF

cat > "$TEMP_DIR/test-skill-secure/test/test.js" << 'EOF'
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const skill = require('../index.js');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); passed++; }
  catch (e) { console.log(`✗ ${name}\n  Error: ${e.message}`); failed++; }
}

test('getSkillInfo returns correct metadata', () => {
  const info = skill.getSkillInfo();
  assert.strictEqual(info.name, 'test-skill-secure');
  assert.strictEqual(info.version, '1.0.0');
});

test('validateFilePath throws for empty string', () => {
  assert.throws(() => skill.validateFilePath(''), /must be a non-empty string/);
});

test('DEFAULT_OPTIONS has expected properties', () => {
  assert.strictEqual(typeof skill.DEFAULT_OPTIONS.timeout, 'number');
});

test('processFile handles non-existent file', async () => {
  const result = await skill.processFile('/non/existent/file.txt');
  assert.strictEqual(result.success, false);
});

test('writeFile creates directory if needed', () => {
  const testDir = path.join(__dirname, 'test-output-' + Date.now());
  const testFile = path.join(testDir, 'test.txt');
  skill.writeFile(testFile, 'test content');
  assert.ok(fs.existsSync(testFile));
  fs.rmSync(testDir, { recursive: true });
});

console.log(`\nPassed: ${passed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
EOF

cat > "$TEMP_DIR/test-skill-secure/scripts/setup.sh" << 'EOF'
#!/bin/bash
echo "Setting up test-skill-secure..."
npm install
npm test
echo "Setup complete!"
EOF

cd "$TEMP_DIR/test-skill-secure" && zip -r "$FIXTURES_DIR/test-skill-secure.zip" .
echo "✓ Created test-skill-secure.zip"

# ============================================
# 2. Create malicious-skill.zip (Security Issues)
# ============================================
echo "Creating malicious-skill.zip..."

mkdir -p "$TEMP_DIR/malicious-skill/scripts"

cat > "$TEMP_DIR/malicious-skill/SKILL.md" << 'EOF'
---
name: malicious-skill
description: WARNING - Test skill with intentional security vulnerabilities for testing the security scanner. Use only for security testing purposes.
license: MIT
metadata:
  author: E2E Test Suite
  version: "1.0.0"
  warning: "DO NOT USE IN PRODUCTION"
---

# Malicious Test Skill

WARNING: This skill contains intentional security vulnerabilities for testing purposes only.

## Purpose

- Test security scanner detection capabilities
- Verify malicious pattern recognition
- Ensure proper security warnings are displayed

## DO NOT USE IN PRODUCTION
EOF

cat > "$TEMP_DIR/malicious-skill/exploit.js" << 'EOF'
/**
 * Malicious Test Skill - Contains intentional security vulnerabilities
 * WARNING: This file contains dangerous patterns for security testing only.
 */

const fs = require('fs');
const child_process = require('child_process');

// VULNERABILITY: Use of eval() - HIGH SEVERITY
function processUserInput(userInput) {
  const result = eval(userInput);
  return result;
}

function parseConfig(configStr) {
  const config = eval(`(${configStr})`);
  return config;
}

// VULNERABILITY: Command Injection - CRITICAL SEVERITY
function runCommand(userCmd) {
  const result = child_process.exec(userCmd);
  return result;
}

function executeShell(filename) {
  child_process.exec(`cat ${filename}`);
}

// VULNERABILITY: SQL Injection Pattern - CRITICAL SEVERITY
function queryDatabase(userId) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  return executeQuery(query);
}

function searchUsers(searchTerm) {
  const sql = "SELECT * FROM users WHERE name = '" + searchTerm + "'";
  return executeQuery(sql);
}

// VULNERABILITY: Path Traversal - HIGH SEVERITY
function readFile(userPath) {
  return fs.readFileSync(userPath, 'utf-8');
}

// VULNERABILITY: Hardcoded Credentials - HIGH SEVERITY
const DB_PASSWORD = "super_secret_password_123";
const API_KEY = "sk-api-key-abcdef123456789";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

function connectToDatabase() {
  const connection = {
    host: "localhost",
    user: "admin",
    password: "admin123"
  };
  return connection;
}

function executeQuery(query) {
  console.log('Executing:', query);
  return [];
}

module.exports = {
  processUserInput, parseConfig, runCommand, executeShell,
  queryDatabase, searchUsers, readFile, connectToDatabase
};
EOF

cat > "$TEMP_DIR/malicious-skill/package.json" << 'EOF'
{
  "name": "malicious-skill",
  "version": "1.0.0",
  "description": "WARNING: Test skill with intentional security vulnerabilities",
  "main": "exploit.js",
  "warning": "DO NOT USE IN PRODUCTION"
}
EOF

cd "$TEMP_DIR/malicious-skill" && zip -r "$FIXTURES_DIR/malicious-skill.zip" .
echo "✓ Created malicious-skill.zip"

# ============================================
# 3. Create skill-with-tests.zip
# ============================================
echo "Creating skill-with-tests.zip..."

mkdir -p "$TEMP_DIR/skill-with-tests/test"

cat > "$TEMP_DIR/skill-with-tests/SKILL.md" << 'EOF'
---
name: skill-with-tests
description: A skill that includes comprehensive test cases for evaluation testing. Use when testing the evaluation system or verifying test result display.
license: MIT
metadata:
  author: E2E Test Suite
  version: "1.0.0"
---

# Skill With Tests

A skill that includes comprehensive test cases for evaluation testing.

## Description

This skill is designed to test the evaluation system. It includes passing tests for basic arithmetic and utility functions.

## Functions

- `add(a, b)` - Add two numbers
- `subtract(a, b)` - Subtract b from a
- `multiply(a, b)` - Multiply two numbers
- `divide(a, b)` - Divide a by b
- `calculate(a, b, op)` - Perform operation
- `greet(name)` - Return greeting
- `formatNumber(num, precision)` - Format number
- `isPositive(value)` - Check if positive
EOF

cat > "$TEMP_DIR/skill-with-tests/index.js" << 'EOF'
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }
function divide(a, b) {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
function calculate(a, b, op = 'add') {
  switch (op) {
    case 'add': return add(a, b);
    case 'subtract': return subtract(a, b);
    case 'multiply': return multiply(a, b);
    case 'divide': return divide(a, b);
    default: throw new Error(`Unknown operation: ${op}`);
  }
}
function greet(name) {
  if (!name || typeof name !== 'string') return 'Hello, stranger!';
  return `Hello, ${name}!`;
}
function formatNumber(num, precision = 2) {
  if (typeof num !== 'number') throw new Error('First argument must be a number');
  return num.toFixed(precision);
}
function isPositive(value) { return value > 0; }
function getVersion() { return '1.0.0'; }

module.exports = {
  add, subtract, multiply, divide, calculate,
  greet, formatNumber, isPositive, getVersion
};
EOF

cat > "$TEMP_DIR/skill-with-tests/package.json" << 'EOF'
{
  "name": "skill-with-tests",
  "version": "1.0.0",
  "description": "A skill with comprehensive test cases",
  "main": "index.js",
  "scripts": { "test": "node test/test.js" }
}
EOF

cat > "$TEMP_DIR/skill-with-tests/test/test.js" << 'EOF'
const assert = require('assert');
const skill = require('../index.js');

let passed = 0, failed = 0;
const results = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
    console.log(`✗ ${name}\n  Error: ${e.message}`);
  }
}

console.log('\n--- Basic Arithmetic Tests ---\n');
test('add: should add two numbers', () => assert.strictEqual(skill.add(2, 3), 5));
test('add: should handle zero', () => assert.strictEqual(skill.add(0, 5), 5));
test('subtract: should subtract', () => assert.strictEqual(skill.subtract(10, 4), 6));
test('multiply: should multiply', () => assert.strictEqual(skill.multiply(3, 4), 12));
test('divide: should divide', () => assert.strictEqual(skill.divide(10, 2), 5));
test('divide: should throw on zero', () => assert.throws(() => skill.divide(10, 0), /Division by zero/));

console.log('\n--- Calculate Tests ---\n');
test('calculate: should add by default', () => assert.strictEqual(skill.calculate(5, 3), 8));
test('calculate: should subtract', () => assert.strictEqual(skill.calculate(5, 3, 'subtract'), 2));
test('calculate: should multiply', () => assert.strictEqual(skill.calculate(5, 3, 'multiply'), 15));

console.log('\n--- Greet Tests ---\n');
test('greet: with name', () => assert.strictEqual(skill.greet('World'), 'Hello, World!'));
test('greet: empty string', () => assert.strictEqual(skill.greet(''), 'Hello, stranger!'));
test('greet: null', () => assert.strictEqual(skill.greet(null), 'Hello, stranger!'));

console.log('\n--- Utility Tests ---\n');
test('isPositive: positive', () => assert.strictEqual(skill.isPositive(5), true));
test('isPositive: negative', () => assert.strictEqual(skill.isPositive(-5), false));
test('getVersion', () => assert.strictEqual(skill.getVersion(), '1.0.0'));

console.log('\n========================================');
console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
console.log(`Pass Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
console.log('========================================\n');

const report = { total: passed + failed, passed, failed, passRate: (passed / (passed + failed)) * 100, timestamp: new Date().toISOString(), results };
console.log('--- JSON Report ---');
console.log(JSON.stringify(report, null, 2));
process.exit(failed > 0 ? 1 : 0);
EOF

cd "$TEMP_DIR/skill-with-tests" && zip -r "$FIXTURES_DIR/skill-with-tests.zip" .
echo "✓ Created skill-with-tests.zip"

# ============================================
# 4. Create large-skill.zip
# ============================================
echo "Creating large-skill.zip (this may take a moment)..."

mkdir -p "$TEMP_DIR/large-skill/data"

cat > "$TEMP_DIR/large-skill/SKILL.md" << 'EOF'
---
name: large-skill
description: A skill with large data files for performance testing. Use when testing upload performance, timeout handling, or progress indicators.
metadata:
  author: E2E Test Suite
  version: "1.0.0"
---

# Large Test Skill

A skill with large files for performance testing.

## Purpose

- Upload performance testing
- Timeout handling testing
- Progress indicator testing
- Large file preview testing
EOF

cat > "$TEMP_DIR/large-skill/package.json" << 'EOF'
{
  "name": "large-skill",
  "version": "1.0.0",
  "description": "Large skill for performance testing",
  "main": "index.js"
}
EOF

# Generate large JSON data
node -e "
const fs = require('fs');
const data = { name: 'large-skill-test-data', version: '1.0.0', generated: new Date().toISOString(), records: [] };
for (let i = 0; i < 50000; i++) {
  data.records.push({
    id: i,
    name: 'Record ' + i,
    description: 'This is a test record with some descriptive text. Record number ' + i + ' of 50000.',
    timestamp: new Date(Date.now() + i * 1000).toISOString(),
    values: { a: Math.random() * 1000, b: Math.random() * 1000, c: Math.random() * 1000 },
    tags: ['tag1', 'tag2', 'tag3', 'tag' + (i % 10)],
    metadata: { author: 'test-user', version: '1.0.' + (i % 100), status: i % 2 === 0 ? 'active' : 'inactive' }
  });
}
fs.writeFileSync('$TEMP_DIR/large-skill/data/large-data.json', JSON.stringify(data, null, 2));
"

cd "$TEMP_DIR/large-skill" && zip -r "$FIXTURES_DIR/large-skill.zip" .
echo "✓ Created large-skill.zip"

# ============================================
# 5. Create test-skill-1.zip through test-skill-4.zip
# ============================================
echo "Creating concurrent test skills..."

for i in 1 2 3 4; do
  mkdir -p "$TEMP_DIR/test-skill-$i"

  cat > "$TEMP_DIR/test-skill-$i/SKILL.md" << EOF
---
name: test-skill-$i
description: A test skill for concurrent upload testing. Use when testing batch upload or concurrent processing capabilities.
metadata:
  author: E2E Test Suite
  version: "1.0.0"
---

# Concurrent Test Skill $i

A test skill for concurrent upload testing.

## Purpose

- Concurrent upload testing
- Queue processing testing
- Race condition testing
EOF

  cat > "$TEMP_DIR/test-skill-$i/package.json" << EOF
{
  "name": "test-skill-$i",
  "version": "1.0.0",
  "description": "Concurrent test skill $i"
}
EOF

  cat > "$TEMP_DIR/test-skill-$i/index.js" << EOF
function getVersion() { return '1.0.0'; }
function getName() { return 'test-skill-$i'; }
module.exports = { getVersion, getName };
EOF

  cd "$TEMP_DIR/test-skill-$i" && zip -r "$FIXTURES_DIR/test-skill-$i.zip" .
  echo "✓ Created test-skill-$i.zip"
done

# ============================================
# 6. Create sample-skill-minimal.zip (Minimal compliant skill)
# ============================================
echo "Creating sample-skill-minimal.zip..."

mkdir -p "$TEMP_DIR/sample-skill-minimal"

cat > "$TEMP_DIR/sample-skill-minimal/SKILL.md" << 'EOF'
---
name: sample-skill-minimal
description: A minimal compliant skill with only required fields. Use as a reference for the simplest valid skill structure.
---

# Sample Skill Minimal

This is the simplest valid skill structure with only required fields (name and description).

## Usage

This skill demonstrates the minimum requirements for a valid skill package.
EOF

cd "$TEMP_DIR/sample-skill-minimal" && zip -r "$FIXTURES_DIR/sample-skill-minimal.zip" .
echo "✓ Created sample-skill-minimal.zip"

# ============================================
# 7. Create sample-skill-full.zip (Skill with all optional fields)
# ============================================
echo "Creating sample-skill-full.zip..."

mkdir -p "$TEMP_DIR/sample-skill-full/scripts"
mkdir -p "$TEMP_DIR/sample-skill-full/references"
mkdir -p "$TEMP_DIR/sample-skill-full/assets"

cat > "$TEMP_DIR/sample-skill-full/SKILL.md" << 'EOF'
---
name: sample-skill-full
description: A comprehensive skill demonstrating all optional fields and directories. Use as a reference for creating feature-rich skills with scripts, references, and assets.
license: Apache-2.0
compatibility: Node.js >= 18.0.0, Python >= 3.10
metadata:
  author: E2E Test Suite
  version: "2.0.0"
  homepage: "https://example.com/skills/sample-skill-full"
  repository: "https://github.com/example/sample-skill-full"
  keywords: "sample,reference,full-featured"
allowed-tools: Bash Read Write
---

# Sample Skill Full

A comprehensive skill demonstrating all optional fields and directories.

## Features

This skill showcases:

- All optional frontmatter fields
- The `scripts/` directory for executable code
- The `references/` directory for documentation
- The `assets/` directory for static resources

## Installation

Run the setup script:

```
scripts/setup.sh
```

## Usage

See [references/REFERENCE.md](references/REFERENCE.md) for detailed usage instructions.

## Files

- `scripts/setup.sh` - Installation script
- `scripts/process.js` - Data processing utility
- `references/REFERENCE.md` - Detailed reference documentation
- `assets/config.json` - Default configuration
EOF

cat > "$TEMP_DIR/sample-skill-full/scripts/setup.sh" << 'EOF'
#!/bin/bash
echo "Setting up sample-skill-full..."
npm install
echo "Setup complete!"
EOF

cat > "$TEMP_DIR/sample-skill-full/scripts/process.js" << 'EOF'
/**
 * Data processing utility
 */

function processData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Input must be an array');
  }
  return data.map(item => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  }));
}

function validateConfig(config) {
  const required = ['name', 'version'];
  for (const field of required) {
    if (!config[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return true;
}

module.exports = { processData, validateConfig };
EOF

cat > "$TEMP_DIR/sample-skill-full/references/REFERENCE.md" << 'EOF'
# Reference Documentation

## processData(data)

Process an array of data items.

### Parameters

- `data` (Array): Array of objects to process

### Returns

- Array of processed objects with `processed: true` and `timestamp` added

### Example

```javascript
const { processData } = require('./scripts/process.js');

const result = processData([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
]);
```

## validateConfig(config)

Validate a configuration object.

### Parameters

- `config` (Object): Configuration object with required fields

### Required Fields

- `name` (string): The name of the configuration
- `version` (string): The version string

### Example

```javascript
const { validateConfig } = require('./scripts/process.js');

validateConfig({
  name: 'my-config',
  version: '1.0.0'
});
```
EOF

cat > "$TEMP_DIR/sample-skill-full/assets/config.json" << 'EOF'
{
  "name": "sample-skill-full",
  "version": "2.0.0",
  "settings": {
    "timeout": 30000,
    "retries": 3,
    "debug": false
  },
  "features": {
    "processing": true,
    "validation": true,
    "logging": false
  }
}
EOF

cat > "$TEMP_DIR/sample-skill-full/package.json" << 'EOF'
{
  "name": "sample-skill-full",
  "version": "2.0.0",
  "description": "A comprehensive skill with all optional fields",
  "main": "scripts/process.js",
  "scripts": {
    "setup": "bash scripts/setup.sh"
  },
  "license": "Apache-2.0"
}
EOF

cd "$TEMP_DIR/sample-skill-full" && zip -r "$FIXTURES_DIR/sample-skill-full.zip" .
echo "✓ Created sample-skill-full.zip"

# ============================================
# Cleanup
# ============================================
echo ""
echo "Cleaning up temp files..."
rm -rf "$TEMP_DIR"

# ============================================
# Summary
# ============================================
echo ""
echo "========================================"
echo "E2E Test Fixtures Created Successfully!"
echo "========================================"
echo ""
ls -lh "$FIXTURES_DIR"/*.zip
echo ""
echo "Fixtures created:"
echo "  - test-skill-secure.zip    : Clean skill for basic upload testing"
echo "  - malicious-skill.zip      : Skill with security vulnerabilities"
echo "  - skill-with-tests.zip     : Skill with comprehensive test suite"
echo "  - large-skill.zip          : Large skill for performance testing"
echo "  - test-skill-1..4.zip      : Skills for concurrent upload testing"
echo "  - sample-skill-minimal.zip : Minimal compliant skill (required fields only)"
echo "  - sample-skill-full.zip    : Full-featured skill (all optional fields)"
echo ""
