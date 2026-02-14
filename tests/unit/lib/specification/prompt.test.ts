import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { toPrompt, toPromptSync } from '@/lib/specification/prompt';

describe('Specification Prompt', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-prompt-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const createSkillDir = (name: string, description: string): string => {
    const skillDir = path.join(tempDir, name);
    fs.mkdirSync(skillDir);
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---
name: ${name}
description: ${description}
---
# ${name}

This is the skill body.`
    );
    return skillDir;
  };

  describe('toPrompt', () => {
    it('should generate empty available_skills for empty array', async () => {
      const result = await toPrompt([]);

      expect(result).toBe('<available_skills>\n</available_skills>');
    });

    it('should generate prompt for single skill', async () => {
      const skillDir = createSkillDir('pdf-reader', 'Read and extract text from PDF files');

      const result = await toPrompt([skillDir]);

      expect(result).toContain('<available_skills>');
      expect(result).toContain('</available_skills>');
      expect(result).toContain('<skill>');
      expect(result).toContain('</skill>');
      expect(result).toContain('<name>');
      expect(result).toContain('pdf-reader');
      expect(result).toContain('</name>');
      expect(result).toContain('<description>');
      expect(result).toContain('Read and extract text from PDF files');
      expect(result).toContain('</description>');
      expect(result).toContain('<location>');
      expect(result).toContain('SKILL.md');
      expect(result).toContain('</location>');
    });

    it('should generate prompt for multiple skills', async () => {
      const skillDir1 = createSkillDir('skill-a', 'First skill');
      const skillDir2 = createSkillDir('skill-b', 'Second skill');

      const result = await toPrompt([skillDir1, skillDir2]);

      expect(result).toContain('skill-a');
      expect(result).toContain('First skill');
      expect(result).toContain('skill-b');
      expect(result).toContain('Second skill');

      // Should have two <skill> blocks
      const skillMatches = result.match(/<skill>/g);
      expect(skillMatches).toHaveLength(2);
    });

    it('should escape HTML in name and description', async () => {
      const skillDir = createSkillDir(
        'test-skill',
        'Description with <script>alert("xss")</script>'
      );

      const result = await toPrompt([skillDir]);

      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&lt;/script&gt;');
      expect(result).not.toContain('<script>alert');
    });

    it('should escape special characters', async () => {
      const skillDir = path.join(tempDir, 'test-skill');
      fs.mkdirSync(skillDir);
      fs.writeFileSync(
        path.join(skillDir, 'SKILL.md'),
        `---
name: test-skill
description: Quotes & ampersands < tags > and quotes
---
Body`
      );

      const result = await toPrompt([skillDir]);

      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('toPromptSync', () => {
    it('should generate prompt synchronously', () => {
      const skillDir = createSkillDir('sync-skill', 'A sync skill');

      const result = toPromptSync([skillDir]);

      expect(result).toContain('<available_skills>');
      expect(result).toContain('sync-skill');
      expect(result).toContain('A sync skill');
    });

    it('should handle empty array synchronously', () => {
      const result = toPromptSync([]);

      expect(result).toBe('<available_skills>\n</available_skills>');
    });
  });
});
