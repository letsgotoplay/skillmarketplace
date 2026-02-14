/**
 * Reference library for Agent Skills - TypeScript Implementation
 *
 * Converted from https://github.com/agentskills/agentskills/tree/main/skills-ref
 * This provides a complete port of the Python API for skill validation and parsing.
 */

// Errors
export { SkillError, ParseError, ValidationError } from './errors';

// Models
export type { SkillProperties } from './models';
export { toDict } from './models';

// Parser
export {
  findSkillMd,
  findSkillMdSync,
  parseFrontmatter,
  readProperties,
  readPropertiesSync,
} from './parser';

// Validator
export {
  validate,
  validateSync,
  validateMetadata,
  MAX_SKILL_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_COMPATIBILITY_LENGTH,
  ALLOWED_FIELDS,
} from './validator';

// Prompt
export { toPrompt, toPromptSync } from './prompt';

// Version
export const VERSION = '0.1.0';
