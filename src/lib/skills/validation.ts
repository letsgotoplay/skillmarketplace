import JSZip from 'jszip';
import {
  skillMetadataSchema,
  type SkillMetadata,
  type ParsedSkill,
  type SkillFile,
  type ValidationResult,
  skillTestConfigSchema,
  type SkillTestConfig,
} from './types';

const SKILL_MD = 'SKILL.md';
const PROMPTS_DIR = 'prompts';
const TESTS_FILE = 'tests.json';

/**
 * Extract frontmatter from SKILL.md content
 */
function extractFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatterLines = match[1].split('\n');
  const frontmatter: Record<string, unknown> = {};

  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Parse arrays (simple format: [item1, item2])
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }

    // Parse booleans
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    frontmatter[key] = value;
  }

  return {
    frontmatter,
    body: match[2],
  };
}

/**
 * Parse skill metadata from SKILL.md content
 */
export function parseSkillMetadata(content: string): { metadata: SkillMetadata; body: string } | null {
  const parsed = extractFrontmatter(content);
  if (!parsed) {
    return null;
  }

  const result = skillMetadataSchema.safeParse(parsed.frontmatter);
  if (!result.success) {
    return null;
  }

  return {
    metadata: result.data,
    body: parsed.body,
  };
}

/**
 * Parse a skill zip file
 */
export async function parseSkillZip(zipBuffer: Buffer): Promise<ParsedSkill> {
  const zip = await JSZip.loadAsync(zipBuffer);

  // Find and read SKILL.md
  const skillMdFile = zip.file(SKILL_MD);
  if (!skillMdFile) {
    throw new Error(`Missing required file: ${SKILL_MD}`);
  }

  const skillMdContent = await skillMdFile.async('string');
  const parsed = parseSkillMetadata(skillMdContent);
  if (!parsed) {
    throw new Error('Invalid SKILL.md: missing or invalid frontmatter');
  }

  const prompts = new Map<string, string>();
  const resources = new Map<string, Buffer>();
  const files: SkillFile[] = [];

  // Process all files in the zip
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    const content = await zipEntry.async('nodebuffer');
    const size = content.length;
    const type = getMimeType(relativePath);

    files.push({
      path: relativePath,
      content,
      size,
      type,
    });

    // Categorize prompts
    if (relativePath.startsWith(`${PROMPTS_DIR}/`) && relativePath.endsWith('.md')) {
      const promptName = relativePath.slice(PROMPTS_DIR.length + 1, -3);
      prompts.set(promptName, content.toString('utf-8'));
    } else if (relativePath !== SKILL_MD) {
      // Everything else is a resource
      resources.set(relativePath, content);
    }
  }

  return {
    metadata: parsed.metadata,
    skillMd: skillMdContent,
    prompts,
    resources,
    files,
  };
}

/**
 * Validate a skill zip file
 */
export async function validateSkill(zipBuffer: Buffer): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file size (max 50MB)
  if (zipBuffer.length > 50 * 1024 * 1024) {
    errors.push('Skill package exceeds maximum size of 50MB');
    return { valid: false, errors, warnings };
  }

  try {
    const parsed = await parseSkillZip(zipBuffer);

    // Validate metadata
    const metadataResult = skillMetadataSchema.safeParse(parsed.metadata);
    if (!metadataResult.success) {
      errors.push(...metadataResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`));
    }

    // Validate test configuration if present
    const testsFile = parsed.resources.get(TESTS_FILE);
    if (testsFile) {
      try {
        const testConfig = JSON.parse(testsFile.toString('utf-8'));
        const testResult = skillTestConfigSchema.safeParse(testConfig);
        if (!testResult.success) {
          warnings.push(`Invalid tests.json: ${testResult.error.errors.map((e) => e.message).join(', ')}`);
        }
      } catch {
        warnings.push('Could not parse tests.json');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: parsed.metadata,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during validation');
    return { valid: false, errors, warnings };
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    md: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json',
    js: 'application/javascript',
    ts: 'application/typescript',
    py: 'text/x-python',
    yaml: 'application/x-yaml',
    yml: 'application/x-yaml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Create a skill zip file from parsed skill data
 */
export async function createSkillZip(skill: ParsedSkill): Promise<Buffer> {
  const zip = new JSZip();

  // Add SKILL.md
  zip.file(SKILL_MD, skill.skillMd);

  // Add prompts
  Array.from(skill.prompts.entries()).forEach(([name, content]) => {
    zip.file(`${PROMPTS_DIR}/${name}.md`, content);
  });

  // Add resources
  Array.from(skill.resources.entries()).forEach(([path, content]) => {
    zip.file(path, content);
  });

  return zip.generateAsync({ type: 'nodebuffer' });
}

/**
 * Parse test configuration from skill
 */
export function parseTestConfig(skill: ParsedSkill): SkillTestConfig | null {
  const testsFile = skill.resources.get(TESTS_FILE);
  if (!testsFile) {
    return null;
  }

  try {
    const config = JSON.parse(testsFile.toString('utf-8'));
    const result = skillTestConfigSchema.safeParse(config);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
