/**
 * Specification library for Agent Skills - TypeScript Implementation
 *
 * This module provides:
 * 1. Reference implementation (from Python skills-ref) - SKILL.md validation
 * 2. ZIP package validation - Full skill package validation
 *
 * Reference: https://github.com/agentskills/agentskills/tree/main/skills-ref
 */

// ============================================================================
// Reference Implementation (Python skills-ref port)
// ============================================================================

// Errors
export { SkillError, ParseError, ValidationError } from './errors';

// Models
export type { SkillProperties } from './models';
export { toDict } from './models';

// Parser - SKILL.md frontmatter parsing
export {
  findSkillMd,
  findSkillMdSync,
  parseFrontmatter,
  readProperties,
  readPropertiesSync,
} from './parser';

// Validator - Skill directory validation (agentskills spec compliant)
export {
  validate,
  validateSync,
  validateMetadata,
  MAX_SKILL_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_COMPATIBILITY_LENGTH,
  ALLOWED_FIELDS,
} from './validator';

// Prompt - Generate <available_skills> XML for agent prompts
export { toPrompt, toPromptSync } from './prompt';

// ============================================================================
// ZIP Package Validation (existing implementation)
// ============================================================================

export {
  validateSpecification,
  getActiveSpecification,
  getSpecificationSchema,
  createDefaultSpecification,
} from './zip-validator';

export type {
  SpecValidationResult,
  SkillSpecificationSchema,
} from './zip-validator';

// ============================================================================
// Version
// ============================================================================

export const VERSION = '0.1.0';

