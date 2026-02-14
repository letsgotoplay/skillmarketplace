import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  parseFrontmatter,
  findSkillMd,
  findSkillMdSync,
  readProperties,
  readPropertiesSync,
} from '@/lib/specification/parser';
import { ParseError, ValidationError } from '@/lib/specification/errors';

describe('Specification Parser', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('parseFrontmatter', () => {
    it('should parse valid frontmatter', () => {
      const content = `---
name: my-skill
description: A test skill
---
# My Skill

This is the body.`;

      const [metadata, body] = parseFrontmatter(content);

      expect(metadata).toEqual({
        name: 'my-skill',
        description: 'A test skill',
      });
      expect(body).toBe('# My Skill\n\nThis is the body.');
    });

    it('should parse frontmatter with optional fields', () => {
      const content = `---
name: my-skill
description: A test skill
license: MIT
compatibility: node >= 18
allowed-tools: bash, fs
metadata:
  author: test
  version: "1.0"
---
Body content`;

      const [metadata, body] = parseFrontmatter(content);

      expect(metadata).toEqual({
        name: 'my-skill',
        description: 'A test skill',
        license: 'MIT',
        compatibility: 'node >= 18',
        'allowed-tools': 'bash, fs',
        metadata: {
          author: 'test',
          version: '1.0',
        },
      });
      expect(body).toBe('Body content');
    });

    it('should throw ParseError if frontmatter is missing', () => {
      const content = `# My Skill

No frontmatter here.`;

      expect(() => parseFrontmatter(content)).toThrow(ParseError);
      expect(() => parseFrontmatter(content)).toThrow(
        'SKILL.md must start with YAML frontmatter (---)'
      );
    });

    it('should throw ParseError if frontmatter is not properly closed', () => {
      const content = `---
name: my-skill
description: A test skill
No closing ---`;

      expect(() => parseFrontmatter(content)).toThrow(ParseError);
      // Could be either missing closing or invalid YAML depending on content
    });

    it('should throw ParseError for invalid YAML', () => {
      const content = `---
name: [invalid
description: test
---
Body`;

      expect(() => parseFrontmatter(content)).toThrow(ParseError);
      expect(() => parseFrontmatter(content)).toThrow('Invalid YAML in frontmatter');
    });

    it('should throw ParseError if frontmatter is not a mapping', () => {
      const content = `---
- item1
- item2
---
Body`;

      expect(() => parseFrontmatter(content)).toThrow(ParseError);
      expect(() => parseFrontmatter(content)).toThrow(
        'SKILL.md frontmatter must be a YAML mapping'
      );
    });
  });

  describe('findSkillMd', () => {
    it('should find SKILL.md (uppercase)', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(skillMdPath, '---\nname: test\n---\nBody');

      const result = await findSkillMd(tempDir);

      expect(result).toBe(skillMdPath);
    });

    it('should find skill.md (lowercase)', async () => {
      const skillMdPath = path.join(tempDir, 'skill.md');
      fs.writeFileSync(skillMdPath, '---\nname: test\n---\nBody');

      const result = await findSkillMd(tempDir);

      // macOS is case-insensitive, so it might return either path
      // Just check that it finds a valid file
      expect(result).toBeTruthy();
      expect(result?.toLowerCase()).toBe(skillMdPath.toLowerCase());
    });

    it('should prefer uppercase over lowercase', async () => {
      const upperPath = path.join(tempDir, 'SKILL.md');
      const lowerPath = path.join(tempDir, 'skill.md');
      fs.writeFileSync(upperPath, '---\nname: test\n---\nBody');
      fs.writeFileSync(lowerPath, '---\nname: test\n---\nBody');

      const result = await findSkillMd(tempDir);

      expect(result).toBe(upperPath);
    });

    it('should return null if SKILL.md is not found', async () => {
      const result = await findSkillMd(tempDir);

      expect(result).toBeNull();
    });
  });

  describe('findSkillMdSync', () => {
    it('should find SKILL.md synchronously', () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(skillMdPath, '---\nname: test\n---\nBody');

      const result = findSkillMdSync(tempDir);

      expect(result).toBe(skillMdPath);
    });

    it('should return null if not found', () => {
      const result = findSkillMdSync(tempDir);

      expect(result).toBeNull();
    });
  });

  describe('readProperties', () => {
    it('should read skill properties from valid SKILL.md', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
name: my-skill
description: A test skill for testing
license: MIT
---
# My Skill`
      );

      const props = await readProperties(tempDir);

      expect(props).toEqual({
        name: 'my-skill',
        description: 'A test skill for testing',
        license: 'MIT',
      });
    });

    it('should throw ParseError if SKILL.md not found', async () => {
      await expect(readProperties(tempDir)).rejects.toThrow(ParseError);
      await expect(readProperties(tempDir)).rejects.toThrow('SKILL.md not found');
    });

    it('should throw ValidationError if name is missing', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
description: A test skill
---
Body`
      );

      await expect(readProperties(tempDir)).rejects.toThrow(ValidationError);
      await expect(readProperties(tempDir)).rejects.toThrow(
        'Missing required field in frontmatter: name'
      );
    });

    it('should throw ValidationError if description is missing', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
name: my-skill
---
Body`
      );

      await expect(readProperties(tempDir)).rejects.toThrow(ValidationError);
      await expect(readProperties(tempDir)).rejects.toThrow(
        'Missing required field in frontmatter: description'
      );
    });

    it('should throw ValidationError if name is empty', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
name: ""
description: test
---
Body`
      );

      await expect(readProperties(tempDir)).rejects.toThrow(ValidationError);
      await expect(readProperties(tempDir)).rejects.toThrow(
        "Field 'name' must be a non-empty string"
      );
    });

    it('should trim whitespace from name and description', async () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
name: "  my-skill  "
description: "  A test skill  "
---
Body`
      );

      const props = await readProperties(tempDir);

      expect(props.name).toBe('my-skill');
      expect(props.description).toBe('A test skill');
    });
  });

  describe('readPropertiesSync', () => {
    it('should read skill properties synchronously', () => {
      const skillMdPath = path.join(tempDir, 'SKILL.md');
      fs.writeFileSync(
        skillMdPath,
        `---
name: sync-skill
description: A sync test skill
---
Body`
      );

      const props = readPropertiesSync(tempDir);

      expect(props).toEqual({
        name: 'sync-skill',
        description: 'A sync test skill',
      });
    });
  });
});
