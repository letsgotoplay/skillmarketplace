import JSZip from 'jszip';
import { prisma } from '@/lib/db';
import type { SkillMetadata, ParsedSkill } from '@/lib/skills/types';
import { parseSkillZip } from '@/lib/skills/validation';

/**
 * Specification validation result
 */
export interface SpecValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metadata?: SkillMetadata;
  parsedSkill?: ParsedSkill;
}

/**
 * Skill specification schema definition
 */
export interface SkillSpecificationSchema {
  requiredFiles: string[];
  optionalFiles: string[];
  forbiddenPatterns: string[];
  maxFileSize: number; // in bytes
  maxTotalSize: number; // in bytes
  requiredMetadata: string[];
  allowedExtensions: string[];
}

/**
 * Default specification schema
 */
const DEFAULT_SPECIFICATION: SkillSpecificationSchema = {
  requiredFiles: ['SKILL.md'],
  optionalFiles: ['tests.json', 'README.md', 'LICENSE'],
  forbiddenPatterns: [
    '.env',
    '.git/',
    'node_modules/',
    '.DS_Store',
    'Thumbs.db',
    '__pycache__/',
    '.pyc',
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
  maxTotalSize: 50 * 1024 * 1024, // 50MB total
  requiredMetadata: ['name', 'description'],
  allowedExtensions: [
    '.md',
    '.json',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.py',
    '.txt',
    '.yaml',
    '.yml',
    '.sh',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.pdf',
  ],
};

/**
 * Get the active skill specification
 */
export async function getActiveSpecification() {
  try {
    return prisma.skillSpecification.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    // If database is not available (e.g., in tests), return null
    return null;
  }
}

/**
 * Get specification schema (from database or default)
 */
export async function getSpecificationSchema(): Promise<SkillSpecificationSchema> {
  try {
    const activeSpec = await getActiveSpecification();

    if (activeSpec && activeSpec.schema) {
      return activeSpec.schema as unknown as SkillSpecificationSchema;
    }
  } catch {
    // If database is not available, use default
  }

  return DEFAULT_SPECIFICATION;
}

/**
 * Validate a skill ZIP buffer against the specification
 */
export async function validateSpecification(
  skillBuffer: Buffer
): Promise<SpecValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let parsedSkill: ParsedSkill | undefined;
  let metadata: SkillMetadata | undefined;

  try {
    // Get the active specification schema
    const spec = await getSpecificationSchema();

    // Check total size
    if (skillBuffer.length > spec.maxTotalSize) {
      errors.push(
        `Skill package exceeds maximum size of ${spec.maxTotalSize / 1024 / 1024}MB`
      );
      return { passed: false, errors, warnings };
    }

    // Load the zip
    const zip = await JSZip.loadAsync(skillBuffer);

    // Check for forbidden patterns
    for (const [path] of Object.entries(zip.files)) {
      for (const forbidden of spec.forbiddenPatterns) {
        if (path.includes(forbidden)) {
          errors.push(`Forbidden pattern found: ${path} contains "${forbidden}"`);
        }
      }
    }

    // Check required files
    for (const requiredFile of spec.requiredFiles) {
      const file = zip.file(requiredFile);
      if (!file) {
        errors.push(`Missing required file: ${requiredFile}`);
      }
    }

    // Validate file extensions and sizes
    for (const [path, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Check extension
      const ext = '.' + path.split('.').pop()?.toLowerCase();
      if (!spec.allowedExtensions.includes(ext) && !spec.optionalFiles.some(f => path.endsWith(f))) {
        warnings.push(`File "${path}" has an uncommon extension "${ext}"`);
      }

      // Get file size
      const content = await zipEntry.async('nodebuffer');
      if (content.length > spec.maxFileSize) {
        errors.push(
          `File "${path}" exceeds maximum size of ${spec.maxFileSize / 1024 / 1024}MB`
        );
      }
    }

    // Parse the skill to validate metadata
    try {
      parsedSkill = await parseSkillZip(skillBuffer);
      metadata = parsedSkill.metadata;

      // Check required metadata fields
      for (const field of spec.requiredMetadata) {
        if (!(field in metadata) || !metadata[field as keyof SkillMetadata]) {
          errors.push(`Missing required metadata field: ${field}`);
        }
      }

      // Additional metadata validation
      if (metadata.name && metadata.name.length > 100) {
        errors.push('Skill name must be 100 characters or less');
      }

      if (metadata.description && metadata.description.length > 1000) {
        warnings.push('Skill description is very long (over 1000 characters)');
      }

      // Check for prompts directory (recommended)
      if (parsedSkill.prompts.size === 0) {
        warnings.push('No prompt templates found in prompts/ directory');
      }

      // Validate test configuration if present
      const testsFile = parsedSkill.resources.get('tests.json');
      if (testsFile) {
        try {
          const testConfig = JSON.parse(testsFile.toString('utf-8'));
          if (!testConfig.testCases || !Array.isArray(testConfig.testCases)) {
            warnings.push('tests.json should have a "testCases" array');
          } else if (testConfig.testCases.length === 0) {
            warnings.push('tests.json has no test cases defined');
          }
        } catch {
          errors.push('tests.json is not valid JSON');
        }
      }
    } catch (parseError) {
      errors.push(
        `Failed to parse skill: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
      );
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metadata,
      parsedSkill,
    };
  } catch (error) {
    errors.push(
      `Specification validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { passed: false, errors, warnings };
  }
}

/**
 * Create a default skill specification in the database
 */
export async function createDefaultSpecification() {
  const existing = await getActiveSpecification();
  if (existing) {
    return existing;
  }

  return prisma.skillSpecification.create({
    data: {
      version: '1.0.0',
      schema: DEFAULT_SPECIFICATION as any,
      description: 'Default skill specification for the marketplace',
      isActive: true,
    },
  });
}
