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
