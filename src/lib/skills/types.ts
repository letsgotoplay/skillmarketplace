import { z } from 'zod';

// Skill metadata from SKILL.md frontmatter
export const skillMetadataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semantic (e.g., 1.0.0)').optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
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
