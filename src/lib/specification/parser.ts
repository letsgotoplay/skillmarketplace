import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import { ParseError, ValidationError } from './errors';
import type { SkillProperties } from './models';

/**
 * Find the SKILL.md file in a skill directory.
 * Prefers SKILL.md (uppercase) but accepts skill.md (lowercase).
 *
 * @param skillDir - Path to the skill directory
 * @returns Path to the SKILL.md file, or null if not found
 */
export async function findSkillMd(skillDir: string): Promise<string | null> {
  const skillDirPath = path.resolve(skillDir);

  // Try uppercase first
  const upperPath = path.join(skillDirPath, 'SKILL.md');
  try {
    await fs.promises.access(upperPath);
    return upperPath;
  } catch {
    // Try lowercase
    const lowerPath = path.join(skillDirPath, 'skill.md');
    try {
      await fs.promises.access(lowerPath);
      return lowerPath;
    } catch {
      return null;
    }
  }
}

/**
 * Synchronous version of findSkillMd
 */
export function findSkillMdSync(skillDir: string): string | null {
  const skillDirPath = path.resolve(skillDir);

  const upperPath = path.join(skillDirPath, 'SKILL.md');
  try {
    fs.accessSync(upperPath);
    return upperPath;
  } catch {
    const lowerPath = path.join(skillDirPath, 'skill.md');
    try {
      fs.accessSync(lowerPath);
      return lowerPath;
    } catch {
      return null;
    }
  }
}

/**
 * Parse YAML frontmatter from SKILL.md content.
 *
 * @param content - Raw content of SKILL.md file
 * @returns Tuple of [metadata dict, markdown body]
 * @throws ParseError if frontmatter is missing or invalid
 */
export function parseFrontmatter(content: string): [Record<string, unknown>, string] {
  if (!content.startsWith('---')) {
    throw new ParseError('SKILL.md must start with YAML frontmatter (---)');
  }

  const parts = content.split('---', 3);
  if (parts.length < 3) {
    throw new ParseError('SKILL.md frontmatter not properly closed with ---');
  }

  const frontmatterStr = parts[1].trim();
  const body = parts[2].trim();

  let metadata: Record<string, unknown>;
  try {
    const loaded = yaml.load(frontmatterStr);
    if (typeof loaded !== 'object' || loaded === null || Array.isArray(loaded)) {
      throw new ParseError('SKILL.md frontmatter must be a YAML mapping');
    }
    metadata = loaded as Record<string, unknown>;
  } catch (e) {
    if (e instanceof ParseError) throw e;
    throw new ParseError(`Invalid YAML in frontmatter: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Convert metadata values to strings if it's a dict
  if ('metadata' in metadata && typeof metadata['metadata'] === 'object' && metadata['metadata'] !== null) {
    const metaDict = metadata['metadata'] as Record<string, unknown>;
    metadata['metadata'] = Object.fromEntries(
      Object.entries(metaDict).map(([k, v]) => [k, String(v)])
    );
  }

  return [metadata, body];
}

/**
 * Read skill properties from SKILL.md frontmatter.
 *
 * This function parses the frontmatter and returns properties.
 * It does NOT perform full validation. Use validate() for that.
 *
 * @param skillDir - Path to the skill directory
 * @returns SkillProperties with parsed metadata
 * @throws ParseError if SKILL.md is missing or has invalid YAML
 * @throws ValidationError if required fields (name, description) are missing
 */
export async function readProperties(skillDir: string): Promise<SkillProperties> {
  const skillMdPath = await findSkillMd(skillDir);

  if (skillMdPath === null) {
    throw new ParseError(`SKILL.md not found in ${skillDir}`);
  }

  const content = await fs.promises.readFile(skillMdPath, 'utf-8');
  const [metadata] = parseFrontmatter(content);

  if (!('name' in metadata)) {
    throw new ValidationError('Missing required field in frontmatter: name');
  }
  if (!('description' in metadata)) {
    throw new ValidationError('Missing required field in frontmatter: description');
  }

  const name = metadata['name'];
  const description = metadata['description'];

  if (typeof name !== 'string' || !name.trim()) {
    throw new ValidationError("Field 'name' must be a non-empty string");
  }
  if (typeof description !== 'string' || !description.trim()) {
    throw new ValidationError("Field 'description' must be a non-empty string");
  }

  return {
    name: name.trim(),
    description: description.trim(),
    license: metadata['license'] as string | undefined,
    compatibility: metadata['compatibility'] as string | undefined,
    allowedTools: metadata['allowed-tools'] as string | undefined,
    metadata: metadata['metadata'] as Record<string, string> | undefined,
  };
}

/**
 * Synchronous version of readProperties
 */
export function readPropertiesSync(skillDir: string): SkillProperties {
  const skillMdPath = findSkillMdSync(skillDir);

  if (skillMdPath === null) {
    throw new ParseError(`SKILL.md not found in ${skillDir}`);
  }

  const content = fs.readFileSync(skillMdPath, 'utf-8');
  const [metadata] = parseFrontmatter(content);

  if (!('name' in metadata)) {
    throw new ValidationError('Missing required field in frontmatter: name');
  }
  if (!('description' in metadata)) {
    throw new ValidationError('Missing required field in frontmatter: description');
  }

  const name = metadata['name'];
  const description = metadata['description'];

  if (typeof name !== 'string' || !name.trim()) {
    throw new ValidationError("Field 'name' must be a non-empty string");
  }
  if (typeof description !== 'string' || !description.trim()) {
    throw new ValidationError("Field 'description' must be a non-empty string");
  }

  return {
    name: name.trim(),
    description: description.trim(),
    license: metadata['license'] as string | undefined,
    compatibility: metadata['compatibility'] as string | undefined,
    allowedTools: metadata['allowed-tools'] as string | undefined,
    metadata: metadata['metadata'] as Record<string, string> | undefined,
  };
}
