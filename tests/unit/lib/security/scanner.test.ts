import {
  scanSkill,
  calculateSecurityScore,
  type SecurityFinding,
  type SecurityReport,
} from '@/lib/security/scanner';
import JSZip from 'jszip';

// Helper to create test skill zip
async function createTestZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('Security Scanner', () => {
  describe('scanSkill', () => {
    it('should return score 100 for clean skill', async () => {
      const buffer = await createTestZip({
        'SKILL.md': '---\nname: Test\ndescription: Test\n---\n# Safe skill',
        'prompts/main.md': 'This is a safe prompt',
      });

      const report = await scanSkill(buffer);
      expect(report.score).toBe(100);
      expect(report.findings).toHaveLength(0);
    });

    it('should detect eval() usage', async () => {
      const buffer = await createTestZip({
        'scripts/code.js': 'const result = eval(userInput);',
      });

      const report = await scanSkill(buffer);
      expect(report.findings.length).toBeGreaterThan(0);
      expect(report.findings[0].category).toBe('Code Injection');
      expect(report.findings[0].severity).toBe('high');
    });

    it('should detect hardcoded passwords', async () => {
      const buffer = await createTestZip({
        'config.js': 'const password = "secret123";',
      });

      const report = await scanSkill(buffer);
      const passwordFinding = report.findings.find(
        (f) => f.category === 'Credentials' && f.title.includes('Password')
      );
      expect(passwordFinding).toBeDefined();
      expect(passwordFinding?.severity).toBe('critical');
    });

    it('should detect hardcoded API keys', async () => {
      const buffer = await createTestZip({
        'config.js': 'const api_key = "sk-1234567890abcdef";',
      });

      const report = await scanSkill(buffer);
      const apiKeyFinding = report.findings.find(
        (f) => f.category === 'Credentials' && f.title.includes('API Key')
      );
      expect(apiKeyFinding).toBeDefined();
    });

    it('should detect command execution', async () => {
      const buffer = await createTestZip({
        'scripts/exec.js': 'const { exec } = require("child_process"); exec(cmd);',
      });

      const report = await scanSkill(buffer);
      expect(report.summary.critical + report.summary.high).toBeGreaterThan(0);
    });

    it('should detect obfuscated code execution', async () => {
      const buffer = await createTestZip({
        'malicious.js': 'eval(atob(encodedPayload));',
      });

      const report = await scanSkill(buffer);
      const obfuscationFinding = report.findings.find(
        (f) => f.category === 'Obfuscation'
      );
      expect(obfuscationFinding).toBeDefined();
      expect(obfuscationFinding?.severity).toBe('critical');
    });

    it('should detect environment variable access as info', async () => {
      const buffer = await createTestZip({
        'config.js': 'const apiKey = process.env.API_KEY;',
      });

      const report = await scanSkill(buffer);
      const envFinding = report.findings.find(
        (f) => f.category === 'Environment Access'
      );
      expect(envFinding).toBeDefined();
      expect(envFinding?.severity).toBe('info');
    });

    it('should skip binary files', async () => {
      const buffer = await createTestZip({
        'image.png': '\x89PNG\r\n\x1a\n',
      });

      const report = await scanSkill(buffer);
      expect(report.score).toBe(100);
    });

    it('should handle invalid zip', async () => {
      const invalidBuffer = Buffer.from('not a zip file');
      const report = await scanSkill(invalidBuffer);
      expect(report.score).toBe(0);
      expect(report.findings[0].category).toBe('Scan Error');
    });
  });

  describe('calculateSecurityScore', () => {
    it('should return 100 for no findings', () => {
      const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(100);
    });

    it('should deduct 25 points for critical', () => {
      const summary = { critical: 1, high: 0, medium: 0, low: 0, info: 0 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(75);
    });

    it('should deduct 15 points for high', () => {
      const summary = { critical: 0, high: 1, medium: 0, low: 0, info: 0 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(85);
    });

    it('should deduct 8 points for medium', () => {
      const summary = { critical: 0, high: 0, medium: 1, low: 0, info: 0 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(92);
    });

    it('should deduct 3 points for low', () => {
      const summary = { critical: 0, high: 0, medium: 0, low: 1, info: 0 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(97);
    });

    it('should not deduct for info', () => {
      const summary = { critical: 0, high: 0, medium: 0, low: 0, info: 5 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(100);
    });

    it('should not go below 0', () => {
      const summary = { critical: 10, high: 10, medium: 10, low: 10, info: 10 };
      const score = calculateSecurityScore(summary);
      expect(score).toBe(0);
    });

    it('should combine multiple severities', () => {
      const summary = { critical: 1, high: 2, medium: 1, low: 1, info: 0 };
      const score = calculateSecurityScore(summary);
      // 100 - 25 - 30 - 8 - 3 = 34
      expect(score).toBe(34);
    });
  });
});
