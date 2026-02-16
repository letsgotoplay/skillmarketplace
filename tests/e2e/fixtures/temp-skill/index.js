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
    name: 'test-secure-skill',
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
