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
