import JSZip from 'jszip';
import { validateSpecification } from '@/lib/specification/zip-validator';

// Helper to create a skill zip buffer
async function createTestSkillZip(options?: {
  skillMd?: string;
  files?: Record<string, string | Buffer>;
  includeSkillMd?: boolean;
}): Promise<Buffer> {
  const zip = new JSZip();

  const skillMd =
    options?.skillMd ||
    `---
name: test-skill
description: A test skill for unit testing
version: 1.0.0
---
# Test Skill

This is a test skill for unit testing purposes.
`;

  if (options?.includeSkillMd !== false) {
    zip.file('SKILL.md', skillMd);
  }

  if (options?.files) {
    for (const [path, content] of Object.entries(options.files)) {
      zip.file(path, content);
    }
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('ZIP Specification Validator', () => {
  describe('validateSpecification', () => {
    it('should pass for a valid skill', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'prompts/main.md': 'This is a prompt template',
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.name).toBe('test-skill');
    });

    it('should fail for missing SKILL.md', async () => {
      const zip = new JSZip();
      zip.file('README.md', 'Some content');
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Missing required file: SKILL.md');
    });

    it('should fail for forbidden patterns (.env)', async () => {
      const buffer = await createTestSkillZip({
        files: {
          '.env': 'SECRET=abc123',
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('Forbidden pattern') && e.includes('.env'))).toBe(true);
    });

    it('should fail for forbidden patterns (node_modules)', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'node_modules/package/index.js': 'module.exports = {}',
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      expect(result.errors.some((e) => e.includes('node_modules/'))).toBe(true);
    });

    it('should warn for missing prompts directory', async () => {
      const buffer = await createTestSkillZip();

      const result = await validateSpecification(buffer);

      expect(result.warnings).toContain(
        'No prompt templates found in prompts/ directory'
      );
    });

    it('should validate tests.json if present', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'tests.json': JSON.stringify({
            testCases: [
              { name: 'Test 1', input: 'a', expectedOutput: 'b' },
            ],
          }),
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(true);
    });

    it('should fail for invalid tests.json', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'tests.json': 'not valid json{',
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('tests.json is not valid JSON');
    });

    it('should warn for empty test cases', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'tests.json': JSON.stringify({ testCases: [] }),
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.warnings).toContain('tests.json has no test cases defined');
    });

    it('should warn for tests.json without testCases array', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'tests.json': JSON.stringify({ something: 'else' }),
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.warnings).toContain('tests.json should have a "testCases" array');
    });

    it('should warn for uncommon file extensions', async () => {
      const buffer = await createTestSkillZip({
        files: {
          'data.bin': Buffer.from([0x00, 0x01, 0x02]),
        },
      });

      const result = await validateSpecification(buffer);

      expect(result.warnings.some((w) => w.includes('uncommon extension'))).toBe(true);
    });

    it('should fail for missing required metadata fields', async () => {
      const buffer = await createTestSkillZip({
        skillMd: `---
description: A skill without name
---
# Content`,
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      // parseSkillZip will fail with missing name, resulting in a parse error
      expect(result.errors.some((e) => e.includes('Failed to parse skill'))).toBe(true);
    });

    it('should fail for skill name exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const buffer = await createTestSkillZip({
        skillMd: `---
name: ${longName}
description: Test
---
# Content`,
      });

      const result = await validateSpecification(buffer);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Skill name must be 100 characters or less');
    });

    it('should warn for long description', async () => {
      const longDesc = 'a'.repeat(1001);
      const buffer = await createTestSkillZip({
        skillMd: `---
name: test-skill
description: ${longDesc}
---
# Content`,
      });

      const result = await validateSpecification(buffer);

      expect(result.warnings).toContain('Skill description is very long (over 1000 characters)');
    });
  });
});
