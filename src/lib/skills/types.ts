import { z } from 'zod';

// Skill metadata from SKILL.md frontmatter (matches Agent Skills Specification)
export const skillMetadataSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required').max(64, 'Name must be 64 characters or less'),
  description: z.string().min(1, 'Description is required').max(1024, 'Description must be 1024 characters or less'),

  // Optional fields per specification
  license: z.string().optional(),
  compatibility: z.string().max(500, 'Compatibility must be 500 characters or less').optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  'allowed-tools': z.string().optional(),
});

export type SkillMetadata = z.infer<typeof skillMetadataSchema>;

// Parsed skill structure
export interface ParsedSkill {
  metadata: SkillMetadata;
  skillMd: string;
  prompts: Map<string, string>;
  resources: Map<string, Buffer>;
  files: SkillFile[];
}

export interface SkillFile {
  path: string;
  content: Buffer;
  size: number;
  type: string;
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: SkillMetadata;
}

// Test case for skill evaluation
export const testCaseSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  input: z.string(),
  expectedOutput: z.string().optional(),
  expectedPatterns: z.array(z.string()).optional(),
  timeout: z.number().default(30000),
});

export type TestCase = z.infer<typeof testCaseSchema>;

// Skill test configuration
export const skillTestConfigSchema = z.object({
  testCases: z.array(testCaseSchema).optional(),
  setupScript: z.string().optional(),
  teardownScript: z.string().optional(),
  environment: z.record(z.string()).optional(),
});

export type SkillTestConfig = z.infer<typeof skillTestConfigSchema>;
