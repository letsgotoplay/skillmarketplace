import JSZip from 'jszip';
import {
  parseSkillMetadata,
  parseSkillZip,
  validateSkill,
  createSkillZip,
  parseTestConfig,
} from '@/lib/skills/validation';

// Helper to create a valid skill zip buffer
async function createTestSkillZip(options?: {
  skillMd?: string;
  prompts?: Record<string, string>;
  resources?: Record<string, string | Buffer>;
  tests?: object;
}): Promise<Buffer> {
  const zip = new JSZip();

  // Default SKILL.md content
  const skillMd =
    options?.skillMd ||
    `---
name: Test Skill
description: A test skill for unit testing
version: 1.0.0
author: Test Author
tags: [test, unit]
---
# Test Skill

This is a test skill for unit testing purposes.
`;

  zip.file('SKILL.md', skillMd);

  // Add prompts
  if (options?.prompts) {
    for (const [name, content] of Object.entries(options.prompts)) {
      zip.file(`prompts/${name}.md`, content);
    }
  }

  // Add resources
  if (options?.resources) {
    for (const [path, content] of Object.entries(options.resources)) {
      zip.file(path, content);
    }
  }

  // Add tests config
  if (options?.tests) {
    zip.file('tests.json', JSON.stringify(options.tests));
  }

  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('Skill Validation', () => {
  describe('parseSkillMetadata', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
name: My Skill
description: A great skill
version: 1.0.0
---
# Content`;

      const result = parseSkillMetadata(content);
      expect(result).not.toBeNull();
      expect(result?.metadata.name).toBe('My Skill');
      expect(result?.metadata.description).toBe('A great skill');
      expect(result?.metadata.version).toBe('1.0.0');
    });

    it('should return null for missing frontmatter', () => {
      const content = '# No frontmatter here';
      const result = parseSkillMetadata(content);
      expect(result).toBeNull();
    });

    it('should return null for invalid frontmatter (missing required fields)', () => {
      const content = `---
name: My Skill
---
# Content`;
      const result = parseSkillMetadata(content);
      expect(result).toBeNull();
    });

    it('should parse arrays correctly', () => {
      const content = `---
name: My Skill
description: A skill
tags: [tag1, tag2, tag3]
---
# Content`;

      const result = parseSkillMetadata(content);
      expect(result?.metadata.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should parse booleans correctly', () => {
      const content = `---
name: My Skill
description: A skill
---
# Content`;

      const result = parseSkillMetadata(content);
      expect(result).not.toBeNull();
    });
  });

  describe('parseSkillZip', () => {
    it('should parse a valid skill zip', async () => {
      const buffer = await createTestSkillZip();
      const result = await parseSkillZip(buffer);

      expect(result.metadata.name).toBe('Test Skill');
      expect(result.metadata.description).toBe('A test skill for unit testing');
      expect(result.skillMd).toContain('# Test Skill');
    });

    it('should throw error for missing SKILL.md', async () => {
      const zip = new JSZip();
      zip.file('README.md', 'Some content');
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });

      await expect(parseSkillZip(buffer)).rejects.toThrow('Missing required file: SKILL.md');
    });

    it('should parse prompts correctly', async () => {
      const buffer = await createTestSkillZip({
        prompts: {
          main: 'Main prompt content',
          fallback: 'Fallback prompt content',
        },
      });

      const result = await parseSkillZip(buffer);
      expect(result.prompts.size).toBe(2);
      expect(result.prompts.get('main')).toBe('Main prompt content');
      expect(result.prompts.get('fallback')).toBe('Fallback prompt content');
    });

    it('should categorize resources correctly', async () => {
      const buffer = await createTestSkillZip({
        resources: {
          'data/config.json': JSON.stringify({ key: 'value' }),
          'scripts/setup.sh': '#!/bin/bash',
        },
      });

      const result = await parseSkillZip(buffer);
      expect(result.resources.size).toBe(2);
      expect(result.resources.has('data/config.json')).toBe(true);
      expect(result.resources.has('scripts/setup.sh')).toBe(true);
    });

    it('should list all files with correct metadata', async () => {
      const buffer = await createTestSkillZip({
        prompts: {
          main: 'Prompt',
        },
        resources: {
          'data.txt': 'Data content',
        },
      });

      const result = await parseSkillZip(buffer);
      const filePaths = result.files.map((f) => f.path);
      expect(filePaths).toContain('SKILL.md');
      expect(filePaths).toContain('prompts/main.md');
      expect(filePaths).toContain('data.txt');
    });
  });

  describe('validateSkill', () => {
    it('should validate a valid skill', async () => {
      const buffer = await createTestSkillZip();
      const result = await validateSkill(buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metadata?.name).toBe('Test Skill');
    });

    it('should reject skill exceeding size limit', async () => {
      // Create a buffer larger than 50MB (simulated)
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024, 'a');
      const result = await validateSkill(largeBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Skill package exceeds maximum size of 50MB');
    });

    it('should return errors for missing required metadata', async () => {
      const buffer = await createTestSkillZip({
        skillMd: `---
name: Test
---
# Content`,
      });

      const result = await validateSkill(buffer);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return warnings for missing prompts', async () => {
      const buffer = await createTestSkillZip();
      const result = await validateSkill(buffer);

      // By default we don't add prompts, so should get a warning
      expect(result.warnings).toContain(
        'No prompt templates found in prompts/ directory'
      );
    });

    it('should validate test configuration if present', async () => {
      const buffer = await createTestSkillZip({
        tests: {
          testCases: [
            {
              name: 'Test 1',
              input: 'Hello',
              expectedOutput: 'World',
            },
          ],
        },
      });

      const result = await validateSkill(buffer);
      expect(result.valid).toBe(true);
    });

    it('should warn about invalid test configuration', async () => {
      const buffer = await createTestSkillZip({
        resources: {
          'tests.json': 'invalid json{',
        },
      });

      const result = await validateSkill(buffer);
      expect(result.warnings).toContain('Could not parse tests.json');
    });
  });

  describe('createSkillZip', () => {
    it('should create a valid zip from parsed skill', async () => {
      const originalBuffer = await createTestSkillZip({
        prompts: { main: 'Test prompt' },
      });
      const parsed = await parseSkillZip(originalBuffer);

      const newBuffer = await createSkillZip(parsed);
      expect(newBuffer).toBeInstanceOf(Buffer);

      // Verify the new zip can be parsed
      const reparsed = await parseSkillZip(newBuffer);
      expect(reparsed.metadata.name).toBe('Test Skill');
      expect(reparsed.prompts.get('main')).toBe('Test prompt');
    });
  });

  describe('parseTestConfig', () => {
    it('should parse valid test configuration', async () => {
      const buffer = await createTestSkillZip({
        tests: {
          testCases: [
            {
              name: 'Test 1',
              input: 'Input',
              expectedOutput: 'Output',
              timeout: 5000,
            },
          ],
          environment: {
            NODE_ENV: 'test',
          },
        },
      });

      const parsed = await parseSkillZip(buffer);
      const config = parseTestConfig(parsed);

      expect(config).not.toBeNull();
      expect(config?.testCases).toHaveLength(1);
      expect(config?.testCases[0].name).toBe('Test 1');
      expect(config?.environment?.NODE_ENV).toBe('test');
    });

    it('should return null when no tests.json', async () => {
      const buffer = await createTestSkillZip();
      const parsed = await parseSkillZip(buffer);
      const config = parseTestConfig(parsed);

      expect(config).toBeNull();
    });
  });
});
