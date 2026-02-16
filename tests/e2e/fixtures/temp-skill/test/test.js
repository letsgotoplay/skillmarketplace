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
  assert.strictEqual(info.name, 'test-secure-skill');
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
