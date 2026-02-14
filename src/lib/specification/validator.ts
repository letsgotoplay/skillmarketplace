import * as path from 'path';
import * as fs from 'fs';
import { ParseError } from './errors';
import { findSkillMd, findSkillMdSync, parseFrontmatter } from './parser';

export const MAX_SKILL_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 1024;
export const MAX_COMPATIBILITY_LENGTH = 500;

/**
 * Allowed frontmatter fields per Agent Skills Spec
 */
export const ALLOWED_FIELDS = new Set([
  'name',
  'description',
  'license',
  'allowed-tools',
  'metadata',
  'compatibility',
]);

/**
 * NFKC normalize a string (simplified implementation for common cases)
 * In JavaScript, we use String.normalize('NFKC')
 */
function nfkcNormalize(str: string): string {
  return str.normalize('NFKC');
}

/**
 * Validate skill name format and directory match.
 *
 * Skill names support i18n characters (Unicode letters) plus hyphens.
 * Names must be lowercase and cannot start/end with hyphens.
 */
function validateName(name: unknown, skillDir: string | null): string[] {
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push("Field 'name' must be a non-empty string");
    return errors;
  }

  const normalizedName = nfkcNormalize(name.trim());

  if (normalizedName.length > MAX_SKILL_NAME_LENGTH) {
    errors.push(
      `Skill name '${normalizedName}' exceeds ${MAX_SKILL_NAME_LENGTH} character limit (${normalizedName.length} chars)`
    );
  }

  if (normalizedName !== normalizedName.toLowerCase()) {
    errors.push(`Skill name '${normalizedName}' must be lowercase`);
  }

  if (normalizedName.startsWith('-') || normalizedName.endsWith('-')) {
    errors.push('Skill name cannot start or end with a hyphen');
  }

  if (normalizedName.includes('--')) {
    errors.push('Skill name cannot contain consecutive hyphens');
  }

  // Check for invalid characters - only alphanumeric and hyphens allowed
  for (const char of normalizedName) {
    if (!/[\p{L}\p{N}-]/u.test(char)) {
      errors.push(
        `Skill name '${normalizedName}' contains invalid characters. Only letters, digits, and hyphens are allowed.`
      );
      break;
    }
  }

  if (skillDir) {
    const dirName = nfkcNormalize(path.basename(skillDir));
    if (dirName !== normalizedName) {
      errors.push(
        `Directory name '${path.basename(skillDir)}' must match skill name '${normalizedName}'`
      );
    }
  }

  return errors;
}

/**
 * Validate description format.
 */
function validateDescription(description: unknown): string[] {
  const errors: string[] = [];

  if (!description || typeof description !== 'string' || !description.trim()) {
    errors.push("Field 'description' must be a non-empty string");
    return errors;
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `Description exceeds ${MAX_DESCRIPTION_LENGTH} character limit (${description.length} chars)`
    );
  }

  return errors;
}

/**
 * Validate compatibility format.
 */
function validateCompatibility(compatibility: unknown): string[] {
  const errors: string[] = [];

  if (typeof compatibility !== 'string') {
    errors.push("Field 'compatibility' must be a string");
    return errors;
  }

  if (compatibility.length > MAX_COMPATIBILITY_LENGTH) {
    errors.push(
      `Compatibility exceeds ${MAX_COMPATIBILITY_LENGTH} character limit (${compatibility.length} chars)`
    );
  }

  return errors;
}

/**
 * Validate that only allowed fields are present.
 */
function validateMetadataFields(metadata: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const extraFields = Object.keys(metadata).filter((key) => !ALLOWED_FIELDS.has(key));
  if (extraFields.length > 0) {
    errors.push(
      `Unexpected fields in frontmatter: ${extraFields.sort().join(', ')}. Only ${[...ALLOWED_FIELDS].sort().join(', ')} are allowed.`
    );
  }

  return errors;
}

/**
 * Validate parsed skill metadata.
 *
 * This is the core validation function that works on already-parsed metadata,
 * avoiding duplicate file I/O when called from the parser.
 *
 * @param metadata - Parsed YAML frontmatter dictionary
 * @param skillDir - Optional path to skill directory (for name-directory match check)
 * @returns List of validation error messages. Empty list means valid.
 */
export function validateMetadata(
  metadata: Record<string, unknown>,
  skillDir?: string | null
): string[] {
  const errors: string[] = [];
  errors.push(...validateMetadataFields(metadata));

  if (!('name' in metadata)) {
    errors.push('Missing required field in frontmatter: name');
  } else {
    errors.push(...validateName(metadata['name'], skillDir ?? null));
  }

  if (!('description' in metadata)) {
    errors.push('Missing required field in frontmatter: description');
  } else {
    errors.push(...validateDescription(metadata['description']));
  }

  if ('compatibility' in metadata) {
    errors.push(...validateCompatibility(metadata['compatibility']));
  }

  return errors;
}

/**
 * Validate a skill directory.
 *
 * @param skillDir - Path to the skill directory
 * @returns List of validation error messages. Empty list means valid.
 */
export async function validate(skillDir: string): Promise<string[]> {
  const resolvedDir = path.resolve(skillDir);

  try {
    const stat = await fs.promises.stat(resolvedDir);
    if (!stat.isDirectory()) {
      return [`Not a directory: ${skillDir}`];
    }
  } catch {
    return [`Path does not exist: ${skillDir}`];
  }

  const skillMd = await findSkillMd(resolvedDir);
  if (skillMd === null) {
    return ['Missing required file: SKILL.md'];
  }

  try {
    const content = await fs.promises.readFile(skillMd, 'utf-8');
    const [metadata] = parseFrontmatter(content);
    return validateMetadata(metadata, resolvedDir);
  } catch (e) {
    if (e instanceof ParseError) {
      return [e.message];
    }
    return [`Failed to read SKILL.md: ${e instanceof Error ? e.message : String(e)}`];
  }
}

/**
 * Synchronous version of validate
 */
export function validateSync(skillDir: string): string[] {
  const resolvedDir = path.resolve(skillDir);

  try {
    const stat = fs.statSync(resolvedDir);
    if (!stat.isDirectory()) {
      return [`Not a directory: ${skillDir}`];
    }
  } catch {
    return [`Path does not exist: ${skillDir}`];
  }

  const skillMd = findSkillMdSync(resolvedDir);
  if (skillMd === null) {
    return ['Missing required file: SKILL.md'];
  }

  try {
    const content = fs.readFileSync(skillMd, 'utf-8');
    const [metadata] = parseFrontmatter(content);
    return validateMetadata(metadata, resolvedDir);
  } catch (e) {
    if (e instanceof ParseError) {
      return [e.message];
    }
    return [`Failed to read SKILL.md: ${e instanceof Error ? e.message : String(e)}`];
  }
}
