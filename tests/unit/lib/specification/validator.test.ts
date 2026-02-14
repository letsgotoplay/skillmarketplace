import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  validate,
  validateSync,
  validateMetadata,
  MAX_SKILL_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_COMPATIBILITY_LENGTH,
} from '@/lib/specification/validator';

describe('Specification Validator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-validator-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const createSkillMd = (dir: string, content: string, filename = 'SKILL.md') => {
    fs.writeFileSync(path.join(dir, filename), content);
  };

  describe('validateMetadata', () => {
    it('should return empty array for valid metadata', () => {
      const metadata = {
        name: 'my-skill',
        description: 'A test skill',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toEqual([]);
    });

    it('should return error for missing name', () => {
      const metadata = {
        description: 'A test skill',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain('Missing required field in frontmatter: name');
    });

    it('should return error for missing description', () => {
      const metadata = {
        name: 'my-skill',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain('Missing required field in frontmatter: description');
    });

    it('should return error for name exceeding max length', () => {
      const metadata = {
        name: 'a'.repeat(MAX_SKILL_NAME_LENGTH + 1),
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors.some((e) => e.includes('exceeds') && e.includes('character limit'))).toBe(true);
    });

    it('should return error for uppercase letters in name', () => {
      const metadata = {
        name: 'My-Skill',
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain("Skill name 'My-Skill' must be lowercase");
    });

    it('should return error for name starting with hyphen', () => {
      const metadata = {
        name: '-my-skill',
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain('Skill name cannot start or end with a hyphen');
    });

    it('should return error for name ending with hyphen', () => {
      const metadata = {
        name: 'my-skill-',
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain('Skill name cannot start or end with a hyphen');
    });

    it('should return error for consecutive hyphens in name', () => {
      const metadata = {
        name: 'my--skill',
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toContain('Skill name cannot contain consecutive hyphens');
    });

    it('should return error for invalid characters in name', () => {
      const metadata = {
        name: 'my@skill!',
        description: 'test',
      };

      const errors = validateMetadata(metadata);

      expect(errors.some((e) => e.includes('invalid characters'))).toBe(true);
    });

    it('should return error for description exceeding max length', () => {
      const metadata = {
        name: 'my-skill',
        description: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1),
      };

      const errors = validateMetadata(metadata);

      expect(errors.some((e) => e.includes('Description exceeds'))).toBe(true);
    });

    it('should return error for compatibility exceeding max length', () => {
      const metadata = {
        name: 'my-skill',
        description: 'test',
        compatibility: 'a'.repeat(MAX_COMPATIBILITY_LENGTH + 1),
      };

      const errors = validateMetadata(metadata);

      expect(errors.some((e) => e.includes('Compatibility exceeds'))).toBe(true);
    });

    it('should return error for unexpected fields', () => {
      const metadata = {
        name: 'my-skill',
        description: 'test',
        unknownField: 'value',
      };

      const errors = validateMetadata(metadata);

      expect(errors.some((e) => e.includes('Unexpected fields'))).toBe(true);
    });

    it('should accept i18n characters in name', () => {
      const metadata = {
        name: '中文技能',
        description: 'A Chinese skill',
      };

      const errors = validateMetadata(metadata);

      expect(errors).toEqual([]);
    });

    it('should validate directory name matches skill name', () => {
      const metadata = {
        name: 'my-skill',
        description: 'test',
      };

      // tempDir will have a different name
      const errors = validateMetadata(metadata, tempDir);

      expect(errors.some((e) => e.includes('must match skill name'))).toBe(true);
    });
  });

  describe('validate', () => {
    it('should return empty array for valid skill', async () => {
      // Create skill directory with matching name
      const skillDir = path.join(tempDir, 'my-skill');
      fs.mkdirSync(skillDir);
      createSkillMd(skillDir, `---
name: my-skill
description: A test skill
---
# My Skill`);

      const errors = await validate(skillDir);

      expect(errors).toEqual([]);
    });

    it('should return error for non-existent directory', async () => {
      const errors = await validate('/non/existent/path');

      expect(errors).toContain('Path does not exist: /non/existent/path');
    });

    it('should return error for file instead of directory', async () => {
      const filePath = path.join(tempDir, 'file.txt');
      fs.writeFileSync(filePath, 'content');

      const errors = await validate(filePath);

      expect(errors.some((e) => e.includes('Not a directory'))).toBe(true);
    });

    it('should return error for missing SKILL.md', async () => {
      const errors = await validate(tempDir);

      expect(errors).toContain('Missing required file: SKILL.md');
    });

    it('should return error for invalid YAML in SKILL.md', async () => {
      createSkillMd(tempDir, `---
name: [invalid
---
Body`);

      const errors = await validate(tempDir);

      expect(errors.some((e) => e.includes('Invalid YAML'))).toBe(true);
    });

    it('should return error for missing frontmatter', async () => {
      createSkillMd(tempDir, `# My Skill

No frontmatter`);

      const errors = await validate(tempDir);

      expect(errors.some((e) => e.includes('YAML frontmatter'))).toBe(true);
    });

    it('should accept lowercase skill.md', async () => {
      const skillDir = path.join(tempDir, 'my-skill');
      fs.mkdirSync(skillDir);
      fs.writeFileSync(
        path.join(skillDir, 'skill.md'),
        `---
name: my-skill
description: A test skill
---
Body`
      );

      const errors = await validate(skillDir);

      expect(errors).toEqual([]);
    });
  });

  describe('validateSync', () => {
    it('should validate synchronously', () => {
      const skillDir = path.join(tempDir, 'my-skill');
      fs.mkdirSync(skillDir);
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---
name: my-skill
description: A test skill
---
Body`
      );

      const errors = validateSync(skillDir);

      expect(errors).toEqual([]);
    });

    it('should return errors synchronously', () => {
      const errors = validateSync(tempDir);

      expect(errors).toContain('Missing required file: SKILL.md');
    });
  });
});
