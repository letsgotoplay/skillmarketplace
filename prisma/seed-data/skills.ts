import { Visibility, SkillStatus, JobStatus, TestStatus, Category } from '@prisma/client'
import { USER_IDS } from './users'
import { TEAM_IDS } from './teams'

// Real Anthropic skills from https://github.com/anthropics/skills
export const SKILLS = [
  // === PUBLIC SKILLS (Most Popular) ===
  {
    id: 'skill-pdf',
    name: 'pdf',
    slug: 'pdf',
    description: 'PDF manipulation skill for reading, creating, and editing PDF documents. Supports text extraction, page manipulation, merging, and form handling.',
    category: Category.INTEGRATION,
    tags: ['pdf', 'documents', 'text-extraction', 'forms'],
    authorId: USER_IDS.diana,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-pptx',
    name: 'pptx',
    slug: 'pptx',
    description: 'PowerPoint presentation creation, editing, and analysis. Create slides, add content, work with layouts, add speaker notes, and export presentations.',
    category: Category.INTEGRATION,
    tags: ['powerpoint', 'presentations', 'slides', 'office'],
    authorId: USER_IDS.diana,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-docx',
    name: 'docx',
    slug: 'docx',
    description: 'Word document manipulation for creating, reading, and editing .docx files. Full support for formatting, tables, images, and document structure.',
    category: Category.INTEGRATION,
    tags: ['word', 'documents', 'docx', 'office'],
    authorId: USER_IDS.bob,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-xlsx',
    name: 'xlsx',
    slug: 'xlsx',
    description: 'Excel spreadsheet manipulation. Read and write workbooks, handle formulas, format cells, create charts, and process data tables.',
    category: Category.DATA_ANALYTICS,
    tags: ['excel', 'spreadsheets', 'data', 'formulas'],
    authorId: USER_IDS.bob,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-skill-creator',
    name: 'skill-creator',
    slug: 'skill-creator',
    description: 'Guide for creating effective skills. Provides specialized knowledge, workflows, and tool integrations for building Claude Code skills with best practices.',
    category: Category.DEVELOPMENT,
    tags: ['skills', 'claude', 'development', 'best-practices'],
    authorId: USER_IDS.alice,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-mcp-builder',
    name: 'mcp-builder',
    slug: 'mcp-builder',
    description: 'Build Model Context Protocol (MCP) servers. Create tool integrations, resource providers, and prompt templates for Claude.',
    category: Category.AI_ML,
    tags: ['mcp', 'claude', 'tools', 'integration'],
    authorId: USER_IDS.alice,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-frontend-design',
    name: 'frontend-design',
    slug: 'frontend-design',
    description: 'Frontend design and development assistance. UI/UX design intelligence with support for React, Next.js, Vue, Svelte, Tailwind, and shadcn/ui.',
    category: Category.DEVELOPMENT,
    tags: ['ui', 'ux', 'react', 'tailwind', 'frontend'],
    authorId: USER_IDS.charlie,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },
  {
    id: 'skill-webapp-testing',
    name: 'webapp-testing',
    slug: 'webapp-testing',
    description: 'Web application testing with Playwright. Automated browser testing, E2E tests, visual regression, and performance testing.',
    category: Category.TESTING,
    tags: ['playwright', 'e2e', 'browser', 'automation'],
    authorId: USER_IDS.charlie,
    teamId: null,
    visibility: Visibility.PUBLIC,
  },

  // === TEAM SKILLS (Acme Corp) ===
  {
    id: 'skill-brand-guidelines',
    name: 'brand-guidelines',
    slug: 'brand-guidelines',
    description: 'Create and maintain brand guidelines. Define color palettes, typography, logo usage, voice and tone, and design principles.',
    category: Category.DEVELOPMENT,
    tags: ['branding', 'design', 'guidelines', 'style'],
    authorId: USER_IDS.alice,
    teamId: TEAM_IDS.acme,
    visibility: Visibility.TEAM_ONLY,
  },
  {
    id: 'skill-canvas-design',
    name: 'canvas-design',
    slug: 'canvas-design',
    description: 'Canvas-based design tool for creating graphics, diagrams, and visual content. Supports layers, shapes, text, and export options.',
    category: Category.DEVELOPMENT,
    tags: ['canvas', 'graphics', 'design', 'drawing'],
    authorId: USER_IDS.bob,
    teamId: TEAM_IDS.acme,
    visibility: Visibility.TEAM_ONLY,
  },

  // === TEAM SKILLS (Startup Labs) ===
  {
    id: 'skill-doc-coauthoring',
    name: 'doc-coauthoring',
    slug: 'doc-coauthoring',
    description: 'Real-time document collaboration. Multi-user editing, comments, suggestions, version history, and conflict resolution.',
    category: Category.INTEGRATION,
    tags: ['collaboration', 'documents', 'real-time', 'editing'],
    authorId: USER_IDS.diana,
    teamId: TEAM_IDS.startup,
    visibility: Visibility.TEAM_ONLY,
  },
  {
    id: 'skill-internal-comms',
    name: 'internal-comms',
    slug: 'internal-comms',
    description: 'Internal communications assistant. Draft company announcements, meeting notes, team updates, and internal documentation.',
    category: Category.INTEGRATION,
    tags: ['communications', 'announcements', 'team', 'documentation'],
    authorId: USER_IDS.eve,
    teamId: TEAM_IDS.startup,
    visibility: Visibility.TEAM_ONLY,
  },

  // === PRIVATE SKILLS ===
  {
    id: 'skill-theme-factory',
    name: 'theme-factory',
    slug: 'theme-factory',
    description: 'Generate custom themes for applications. Create color schemes, typography systems, component styles, and dark mode variants.',
    category: Category.DEVELOPMENT,
    tags: ['themes', 'design-systems', 'dark-mode', 'styling'],
    authorId: USER_IDS.alice,
    teamId: null,
    visibility: Visibility.PRIVATE,
  },
  {
    id: 'skill-algorithmic-art',
    name: 'algorithmic-art',
    slug: 'algorithmic-art',
    description: 'Generate algorithmic and generative art. Create patterns, fractals, procedural graphics, and mathematical visualizations.',
    category: Category.AI_ML,
    tags: ['art', 'generative', 'fractals', 'graphics'],
    authorId: USER_IDS.diana,
    teamId: null,
    visibility: Visibility.PRIVATE,
  },
  {
    id: 'skill-slack-gif-creator',
    name: 'slack-gif-creator',
    slug: 'slack-gif-creator',
    description: 'Create custom GIFs for Slack. Generate animated stickers, reactions, and custom emoji animations for team communication.',
    category: Category.INTEGRATION,
    tags: ['slack', 'gif', 'animations', 'emoji'],
    authorId: USER_IDS.charlie,
    teamId: null,
    visibility: Visibility.PRIVATE,
  },
  {
    id: 'skill-web-artifacts-builder',
    name: 'web-artifacts-builder',
    slug: 'web-artifacts-builder',
    description: 'Build interactive web artifacts. Create self-contained HTML/CSS/JS applications, widgets, and interactive demos.',
    category: Category.DEVELOPMENT,
    tags: ['html', 'css', 'javascript', 'widgets'],
    authorId: USER_IDS.eve,
    teamId: null,
    visibility: Visibility.PRIVATE,
  },
]

export const SKILL_VERSIONS = [
  // PDF versions
  {
    id: 'sv-pdf-1',
    skillId: 'skill-pdf',
    version: '1.0.0',
    changelog: 'Initial release with basic PDF reading and text extraction capabilities',
    filePath: '/uploads/skills/pdf-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.diana,
  },
  {
    id: 'sv-pdf-2',
    skillId: 'skill-pdf',
    version: '1.1.0',
    changelog: 'Added PDF creation, merging, and form filling support. Improved text extraction accuracy.',
    filePath: '/uploads/skills/pdf-1.1.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.diana,
  },
  // PPTX versions
  {
    id: 'sv-pptx-1',
    skillId: 'skill-pptx',
    version: '1.0.0',
    changelog: 'Initial release with slide creation and basic formatting',
    filePath: '/uploads/skills/pptx-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.diana,
  },
  // DOCX versions
  {
    id: 'sv-docx-1',
    skillId: 'skill-docx',
    version: '1.0.0',
    changelog: 'Initial release with document reading and creation',
    filePath: '/uploads/skills/docx-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.bob,
  },
  {
    id: 'sv-docx-2',
    skillId: 'skill-docx',
    version: '2.0.0',
    changelog: 'Major update: Tables, images, headers/footers, and full formatting support',
    filePath: '/uploads/skills/docx-2.0.0.zip',
    status: SkillStatus.PENDING,
    createdBy: USER_IDS.bob,
  },
  // XLSX versions
  {
    id: 'sv-xlsx-1',
    skillId: 'skill-xlsx',
    version: '1.0.0',
    changelog: 'Initial release with workbook reading and basic cell operations',
    filePath: '/uploads/skills/xlsx-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.bob,
  },
  // Skill Creator versions
  {
    id: 'sv-skill-creator-1',
    skillId: 'skill-skill-creator',
    version: '1.0.0',
    changelog: 'Initial release with skill creation guide and best practices',
    filePath: '/uploads/skills/skill-creator-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.alice,
  },
  // MCP Builder versions
  {
    id: 'sv-mcp-builder-1',
    skillId: 'skill-mcp-builder',
    version: '1.0.0',
    changelog: 'Initial release with MCP server scaffolding and tool creation',
    filePath: '/uploads/skills/mcp-builder-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.alice,
  },
  // Frontend Design versions
  {
    id: 'sv-frontend-design-1',
    skillId: 'skill-frontend-design',
    version: '1.0.0',
    changelog: 'Initial release with React, Next.js, and Tailwind support',
    filePath: '/uploads/skills/frontend-design-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.charlie,
  },
  {
    id: 'sv-frontend-design-2',
    skillId: 'skill-frontend-design',
    version: '2.0.0',
    changelog: 'Added Vue, Svelte, SwiftUI, Flutter support. New UI patterns and shadcn/ui integration.',
    filePath: '/uploads/skills/frontend-design-2.0.0.zip',
    status: SkillStatus.EVALUATING,
    createdBy: USER_IDS.charlie,
  },
  // Webapp Testing versions
  {
    id: 'sv-webapp-testing-1',
    skillId: 'skill-webapp-testing',
    version: '1.0.0',
    changelog: 'Initial release with Playwright browser automation',
    filePath: '/uploads/skills/webapp-testing-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.charlie,
    aiSecurityAnalyzed: true,
    aiSecurityReport: {
      riskLevel: 'high',
      threats: [
        {
          id: 'ai-finding-wt-001',
          severity: 'high',
          category: 'Code Injection',
          title: 'Dynamic Code Execution Risk',
          description: 'AI Analysis: The eval() usage in test-runner.ts poses a significant security risk. If user input reaches this code path, it could lead to arbitrary code execution.',
          file: 'scripts/test-runner.ts',
          line: 44,
          recommendation: 'Use a sandboxed JavaScript interpreter or restrict eval to known-safe inputs',
          source: 'ai',
        },
      ],
      recommendations: [
        'Consider using vm2 or isolated-vm for sandboxed code execution',
        'Implement input validation at all entry points',
        'Add rate limiting to prevent abuse',
      ],
      confidence: 85,
    },
  },
  // Brand Guidelines versions
  {
    id: 'sv-brand-guidelines-1',
    skillId: 'skill-brand-guidelines',
    version: '1.0.0',
    changelog: 'Initial team release',
    filePath: '/uploads/skills/brand-guidelines-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.alice,
  },
  // Canvas Design versions
  {
    id: 'sv-canvas-design-1',
    skillId: 'skill-canvas-design',
    version: '1.0.0',
    changelog: 'Initial release with drawing tools and export',
    filePath: '/uploads/skills/canvas-design-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.bob,
  },
  // Doc Coauthoring versions
  {
    id: 'sv-doc-coauthoring-1',
    skillId: 'skill-doc-coauthoring',
    version: '1.0.0',
    changelog: 'Initial release with real-time collaboration',
    filePath: '/uploads/skills/doc-coauthoring-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.diana,
  },
  // Internal Comms versions
  {
    id: 'sv-internal-comms-1',
    skillId: 'skill-internal-comms',
    version: '1.0.0',
    changelog: 'Initial release with announcement drafting',
    filePath: '/uploads/skills/internal-comms-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.eve,
  },
  // Theme Factory versions
  {
    id: 'sv-theme-factory-1',
    skillId: 'skill-theme-factory',
    version: '1.0.0',
    changelog: 'Initial private release',
    filePath: '/uploads/skills/theme-factory-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.alice,
  },
  // Algorithmic Art versions
  {
    id: 'sv-algorithmic-art-1',
    skillId: 'skill-algorithmic-art',
    version: '1.0.0',
    changelog: 'Initial release with pattern generation',
    filePath: '/uploads/skills/algorithmic-art-1.0.0.zip',
    status: SkillStatus.REJECTED,
    createdBy: USER_IDS.diana,
    aiSecurityAnalyzed: true,
    aiSecurityReport: {
      riskLevel: 'critical',
      threats: [
        {
          id: 'ai-finding-aa1-001',
          severity: 'critical',
          category: 'Denial of Service',
          title: 'Recursive Pattern DoS Vulnerability',
          description: 'AI Analysis: The recursive pattern generation without iteration limits creates a critical DoS vulnerability. An attacker could cause system freeze or crash.',
          file: 'scripts/generate.ts',
          line: 23,
          recommendation: 'Implement strict iteration limits and add timeout mechanisms',
          source: 'ai',
        },
        {
          id: 'ai-finding-aa1-002',
          severity: 'high',
          category: 'Memory Management',
          title: 'Memory Exhaustion Risk',
          description: 'AI Analysis: Unbounded canvas allocations can exhaust system memory, potentially affecting other processes.',
          file: 'scripts/generate.ts',
          line: 56,
          recommendation: 'Add memory limits and use streaming/buffering for large operations',
          source: 'ai',
        },
      ],
      recommendations: [
        'Add maximum iteration depth configuration (recommend 1000)',
        'Implement memory usage monitoring',
        'Add timeout protection for long-running operations',
        'Consider Web Workers for heavy computation',
      ],
      confidence: 92,
    },
  },
  {
    id: 'sv-algorithmic-art-2',
    skillId: 'skill-algorithmic-art',
    version: '1.1.0',
    changelog: 'Fixed performance issues, added fractal support',
    filePath: '/uploads/skills/algorithmic-art-1.1.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.diana,
  },
  // Slack GIF Creator versions
  {
    id: 'sv-slack-gif-creator-1',
    skillId: 'skill-slack-gif-creator',
    version: '1.0.0',
    changelog: 'Initial release with basic GIF creation',
    filePath: '/uploads/skills/slack-gif-creator-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.charlie,
  },
  // Web Artifacts Builder versions
  {
    id: 'sv-web-artifacts-builder-1',
    skillId: 'skill-web-artifacts-builder',
    version: '1.0.0',
    changelog: 'Initial release with HTML/CSS/JS generation',
    filePath: '/uploads/skills/web-artifacts-builder-1.0.0.zip',
    status: SkillStatus.APPROVED,
    createdBy: USER_IDS.eve,
    aiSecurityAnalyzed: true,
    aiSecurityReport: {
      riskLevel: 'high',
      threats: [
        {
          id: 'ai-finding-wab-001',
          severity: 'high',
          category: 'Cross-Site Scripting',
          title: 'XSS Vulnerability in HTML Rendering',
          description: 'AI Analysis: User content is directly interpolated into HTML without sanitization. This creates a stored XSS vulnerability that could compromise users viewing generated artifacts.',
          file: 'scripts/html.ts',
          line: 44,
          recommendation: 'Use DOMPurify or similar library to sanitize all user content before HTML insertion',
          source: 'ai',
        },
        {
          id: 'ai-finding-wab-002',
          severity: 'medium',
          category: 'Content Security',
          title: 'Missing Security Headers',
          description: 'AI Analysis: Generated HTML lacks Content-Security-Policy headers which would provide defense-in-depth against XSS attacks.',
          file: 'scripts/builder.ts',
          line: 23,
          recommendation: 'Add CSP headers to all generated HTML documents',
          source: 'ai',
        },
      ],
      recommendations: [
        'Implement HTML sanitization using DOMPurify',
        'Add Content-Security-Policy meta tags',
        'Consider using a template engine with auto-escaping',
        'Add input validation for all user-provided content',
      ],
      confidence: 88,
    },
  },
]

// Sample file content generators
const getSkillMdContent = (name: string, description: string) => `# ${name}

${description}

## Usage

When users ask you to perform tasks, check if this skill can help complete the task more effectively.

## Features

- Full file manipulation support
- Error handling and validation
- Multiple format support

## Examples

\`\`\`typescript
// Example usage
const result = await processFile('document.pdf');
console.log(result);
\`\`\`

## Arguments

This skill accepts the following arguments:
- \`filePath\`: Path to the file to process
- \`options\`: Optional configuration object

## Notes

- Ensure files exist before processing
- Large files may take longer to process
- Some operations require authentication
`

const getTsContent = (name: string, exports: string[]) => `/**
 * ${name}
 * Auto-generated skill script
 */

import { Tool } from '@anthropic-ai/sdk';

interface ${name.replace(/-/g, '_').replace(/\b\w/g, l => l.toUpperCase())}Config {
  inputPath: string;
  outputPath?: string;
  options?: Record<string, unknown>;
}

/**
 * Main processing function for ${name}
 */
export async function process(
  config: ${name.replace(/-/g, '_').replace(/\b\w/g, l => l.toUpperCase())}Config
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    // Validate input
    if (!config.inputPath) {
      throw new Error('Input path is required');
    }

    // Process the file
    console.log(\`Processing: \${config.inputPath}\`);

    // Return result
    return {
      success: true,
      data: { processed: true }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Export all functions
export { ${exports.join(', ')} };
`

const getReferenceMdContent = (topic: string) => `# ${topic} Reference

This document provides detailed reference information for ${topic}.

## Overview

The ${topic} module provides comprehensive functionality for file operations.

## API Reference

### Functions

#### \`read(path: string)\`
Reads content from the specified path.

**Parameters:**
- \`path\`: The file path to read

**Returns:** \`Promise<string>\`

#### \`write(path: string, content: string)\`
Writes content to the specified path.

**Parameters:**
- \`path\`: The file path to write
- \`content\`: The content to write

**Returns:** \`Promise<void>\`

## Best Practices

1. Always validate input paths
2. Handle errors gracefully
3. Use appropriate encoding

## Examples

\`\`\`typescript
// Reading a file
const content = await read('/path/to/file');

// Writing a file
await write('/path/to/output', content);
\`\`\`
`

export const SKILL_FILES = [
  // PDF 1.0.0 files
  { id: 'sf-pdf1-1', skillVersionId: 'sv-pdf-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3245, content: getSkillMdContent('pdf', 'PDF manipulation skill for reading, creating, and editing PDF documents. Supports text extraction, page manipulation, merging, and form handling.') },
  { id: 'sf-pdf1-2', skillVersionId: 'sv-pdf-1', filePath: 'scripts/pdf-reader.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('pdf-reader', ['read', 'extractText', 'getMetadata']) },
  { id: 'sf-pdf1-3', skillVersionId: 'sv-pdf-1', filePath: 'scripts/text-extractor.ts', fileType: 'text/typescript', sizeBytes: 4560, content: getTsContent('text-extractor', ['extract', 'parse', 'clean']) },
  { id: 'sf-pdf1-4', skillVersionId: 'sv-pdf-1', filePath: 'references/pdf-spec.md', fileType: 'text/markdown', sizeBytes: 2100, content: getReferenceMdContent('PDF Specification') },
  // PDF 1.1.0 files
  { id: 'sf-pdf2-1', skillVersionId: 'sv-pdf-2', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 4500, content: getSkillMdContent('pdf', 'PDF manipulation skill for reading, creating, and editing PDF documents. Supports text extraction, page manipulation, merging, and form handling.') },
  { id: 'sf-pdf2-2', skillVersionId: 'sv-pdf-2', filePath: 'scripts/pdf-reader.ts', fileType: 'text/typescript', sizeBytes: 10240, content: getTsContent('pdf-reader', ['read', 'extractText', 'getMetadata', 'getPageCount']) },
  { id: 'sf-pdf2-3', skillVersionId: 'sv-pdf-2', filePath: 'scripts/pdf-creator.ts', fileType: 'text/typescript', sizeBytes: 7680, content: getTsContent('pdf-creator', ['create', 'addPage', 'setFont', 'write']) },
  { id: 'sf-pdf2-4', skillVersionId: 'sv-pdf-2', filePath: 'scripts/pdf-merger.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('pdf-merger', ['merge', 'append', 'prepend']) },
  { id: 'sf-pdf2-5', skillVersionId: 'sv-pdf-2', filePath: 'scripts/form-handler.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('form-handler', ['fillForm', 'getFields', 'setField']) },
  // PPTX 1.0.0 files
  { id: 'sf-pptx1-1', skillVersionId: 'sv-pptx-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3890, content: getSkillMdContent('pptx', 'PowerPoint presentation creation, editing, and analysis. Create slides, add content, work with layouts, add speaker notes, and export presentations.') },
  { id: 'sf-pptx1-2', skillVersionId: 'sv-pptx-1', filePath: 'scripts/presentation.ts', fileType: 'text/typescript', sizeBytes: 12288, content: getTsContent('presentation', ['create', 'open', 'save', 'export']) },
  { id: 'sf-pptx1-3', skillVersionId: 'sv-pptx-1', filePath: 'scripts/slide-builder.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('slide-builder', ['addSlide', 'addText', 'addImage', 'addChart']) },
  { id: 'sf-pptx1-4', skillVersionId: 'sv-pptx-1', filePath: 'assets/templates/blank.xml', fileType: 'application/xml', sizeBytes: 2048 },
  // DOCX 1.0.0 files
  { id: 'sf-docx1-1', skillVersionId: 'sv-docx-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 2800, content: getSkillMdContent('docx', 'Word document manipulation for creating, reading, and editing .docx files. Full support for formatting, tables, images, and document structure.') },
  { id: 'sf-docx1-2', skillVersionId: 'sv-docx-1', filePath: 'scripts/document.ts', fileType: 'text/typescript', sizeBytes: 9216, content: getTsContent('document', ['create', 'read', 'write', 'format']) },
  { id: 'sf-docx1-3', skillVersionId: 'sv-docx-1', filePath: 'scripts/paragraph.ts', fileType: 'text/typescript', sizeBytes: 4096, content: getTsContent('paragraph', ['addParagraph', 'setStyle', 'addRun']) },
  // DOCX 2.0.0 files
  { id: 'sf-docx2-1', skillVersionId: 'sv-docx-2', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 4200, content: getSkillMdContent('docx', 'Word document manipulation for creating, reading, and editing .docx files. Full support for formatting, tables, images, and document structure.') },
  { id: 'sf-docx2-2', skillVersionId: 'sv-docx-2', filePath: 'scripts/document.ts', fileType: 'text/typescript', sizeBytes: 15360, content: getTsContent('document', ['create', 'read', 'write', 'format', 'addHeader', 'addFooter']) },
  { id: 'sf-docx2-3', skillVersionId: 'sv-docx-2', filePath: 'scripts/table.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('table', ['createTable', 'addRow', 'addCell', 'merge']) },
  { id: 'sf-docx2-4', skillVersionId: 'sv-docx-2', filePath: 'scripts/image.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('image', ['addImage', 'resize', 'align']) },
  { id: 'sf-docx2-5', skillVersionId: 'sv-docx-2', filePath: 'scripts/styles.ts', fileType: 'text/typescript', sizeBytes: 4096, content: getTsContent('styles', ['createStyle', 'applyStyle', 'getStyles']) },
  // XLSX 1.0.0 files
  { id: 'sf-xlsx1-1', skillVersionId: 'sv-xlsx-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3100, content: getSkillMdContent('xlsx', 'Excel spreadsheet manipulation. Read and write workbooks, handle formulas, format cells, create charts, and process data tables.') },
  { id: 'sf-xlsx1-2', skillVersionId: 'sv-xlsx-1', filePath: 'scripts/workbook.ts', fileType: 'text/typescript', sizeBytes: 11264, content: getTsContent('workbook', ['create', 'load', 'save', 'addSheet']) },
  { id: 'sf-xlsx1-3', skillVersionId: 'sv-xlsx-1', filePath: 'scripts/cell.ts', fileType: 'text/typescript', sizeBytes: 7168, content: getTsContent('cell', ['getValue', 'setValue', 'format', 'merge']) },
  { id: 'sf-xlsx1-4', skillVersionId: 'sv-xlsx-1', filePath: 'scripts/formula.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('formula', ['setFormula', 'evaluate', 'getDependencies']) },
  // Skill Creator 1.0.0 files
  { id: 'sf-sc1-1', skillVersionId: 'sv-skill-creator-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 12450, content: getSkillMdContent('skill-creator', 'Guide for creating effective skills. Provides specialized knowledge, workflows, and tool integrations for building Claude Code skills with best practices.') },
  { id: 'sf-sc1-2', skillVersionId: 'sv-skill-creator-1', filePath: 'references/skill-anatomy.md', fileType: 'text/markdown', sizeBytes: 5600, content: getReferenceMdContent('Skill Anatomy') },
  { id: 'sf-sc1-3', skillVersionId: 'sv-skill-creator-1', filePath: 'references/principles.md', fileType: 'text/markdown', sizeBytes: 4200, content: getReferenceMdContent('Skill Principles') },
  { id: 'sf-sc1-4', skillVersionId: 'sv-skill-creator-1', filePath: 'references/design-patterns.md', fileType: 'text/markdown', sizeBytes: 3800, content: getReferenceMdContent('Skill Design Patterns') },
  { id: 'sf-sc1-5', skillVersionId: 'sv-skill-creator-1', filePath: 'scripts/validate.ts', fileType: 'text/typescript', sizeBytes: 3072, content: getTsContent('validate', ['validate', 'checkStructure', 'lint']) },
  // MCP Builder 1.0.0 files
  { id: 'sf-mcp1-1', skillVersionId: 'sv-mcp-builder-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 5600, content: getSkillMdContent('mcp-builder', 'Build Model Context Protocol (MCP) servers. Create tool integrations, resource providers, and prompt templates for Claude.') },
  { id: 'sf-mcp1-2', skillVersionId: 'sv-mcp-builder-1', filePath: 'scripts/server.ts', fileType: 'text/typescript', sizeBytes: 10240, content: getTsContent('server', ['start', 'stop', 'registerTool', 'handle']) },
  { id: 'sf-mcp1-3', skillVersionId: 'sv-mcp-builder-1', filePath: 'scripts/tool.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('tool', ['define', 'execute', 'validate']) },
  { id: 'sf-mcp1-4', skillVersionId: 'sv-mcp-builder-1', filePath: 'references/mcp-spec.md', fileType: 'text/markdown', sizeBytes: 8900, content: getReferenceMdContent('MCP Specification') },
  // Frontend Design 1.0.0 files
  { id: 'sf-fd1-1', skillVersionId: 'sv-frontend-design-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 8200, content: getSkillMdContent('frontend-design', 'Frontend design and development assistance. UI/UX design intelligence with support for React, Next.js, Vue, Svelte, Tailwind, and shadcn/ui.') },
  { id: 'sf-fd1-2', skillVersionId: 'sv-frontend-design-1', filePath: 'scripts/component.ts', fileType: 'text/typescript', sizeBytes: 7168, content: getTsContent('component', ['create', 'render', 'update', 'destroy']) },
  { id: 'sf-fd1-3', skillVersionId: 'sv-frontend-design-1', filePath: 'scripts/styles.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('styles', ['generate', 'apply', 'extract']) },
  { id: 'sf-fd1-4', skillVersionId: 'sv-frontend-design-1', filePath: 'references/react-patterns.md', fileType: 'text/markdown', sizeBytes: 4500, content: getReferenceMdContent('React Patterns') },
  // Frontend Design 2.0.0 files
  { id: 'sf-fd2-1', skillVersionId: 'sv-frontend-design-2', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 12400, content: getSkillMdContent('frontend-design', 'Frontend design and development assistance. UI/UX design intelligence with support for React, Next.js, Vue, Svelte, Tailwind, and shadcn/ui.') },
  { id: 'sf-fd2-2', skillVersionId: 'sv-frontend-design-2', filePath: 'scripts/component.ts', fileType: 'text/typescript', sizeBytes: 11264, content: getTsContent('component', ['create', 'render', 'update', 'destroy', 'memoize']) },
  { id: 'sf-fd2-3', skillVersionId: 'sv-frontend-design-2', filePath: 'scripts/vue.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('vue', ['defineComponent', 'setup', 'ref', 'reactive']) },
  { id: 'sf-fd2-4', skillVersionId: 'sv-frontend-design-2', filePath: 'scripts/svelte.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('svelte', ['createStore', 'derive', 'mount']) },
  { id: 'sf-fd2-5', skillVersionId: 'sv-frontend-design-2', filePath: 'references/shadcn-patterns.md', fileType: 'text/markdown', sizeBytes: 6800, content: getReferenceMdContent('shadcn/ui Patterns') },
  // Webapp Testing 1.0.0 files
  { id: 'sf-wt1-1', skillVersionId: 'sv-webapp-testing-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 9800, content: getSkillMdContent('webapp-testing', 'Web application testing with Playwright. Automated browser testing, E2E tests, visual regression, and performance testing.') },
  { id: 'sf-wt1-2', skillVersionId: 'sv-webapp-testing-1', filePath: 'scripts/browser.ts', fileType: 'text/typescript', sizeBytes: 14336, content: getTsContent('browser', ['launch', 'navigate', 'click', 'fill', 'screenshot']) },
  { id: 'sf-wt1-3', skillVersionId: 'sv-webapp-testing-1', filePath: 'scripts/test-runner.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('test-runner', ['run', 'report', 'assert', 'expect']) },
  { id: 'sf-wt1-4', skillVersionId: 'sv-webapp-testing-1', filePath: 'references/commands.md', fileType: 'text/markdown', sizeBytes: 18200, content: getReferenceMdContent('Playwright Commands') },
  // Brand Guidelines 1.0.0 files
  { id: 'sf-bg1-1', skillVersionId: 'sv-brand-guidelines-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 4500, content: getSkillMdContent('brand-guidelines', 'Create and maintain brand guidelines. Define color palettes, typography, logo usage, voice and tone, and design principles.') },
  { id: 'sf-bg1-2', skillVersionId: 'sv-brand-guidelines-1', filePath: 'scripts/guidelines.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('guidelines', ['create', 'validate', 'export']) },
  { id: 'sf-bg1-3', skillVersionId: 'sv-brand-guidelines-1', filePath: 'assets/brand-template.json', fileType: 'application/json', sizeBytes: 2048 },
  // Canvas Design 1.0.0 files
  { id: 'sf-cd1-1', skillVersionId: 'sv-canvas-design-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3800, content: getSkillMdContent('canvas-design', 'Canvas-based design tool for creating graphics, diagrams, and visual content. Supports layers, shapes, text, and export options.') },
  { id: 'sf-cd1-2', skillVersionId: 'sv-canvas-design-1', filePath: 'scripts/canvas.ts', fileType: 'text/typescript', sizeBytes: 10240, content: getTsContent('canvas', ['draw', 'clear', 'export', 'resize']) },
  { id: 'sf-cd1-3', skillVersionId: 'sv-canvas-design-1', filePath: 'scripts/layers.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('layers', ['addLayer', 'removeLayer', 'reorder', 'merge']) },
  // Doc Coauthoring 1.0.0 files
  { id: 'sf-dc1-1', skillVersionId: 'sv-doc-coauthoring-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3200, content: getSkillMdContent('doc-coauthoring', 'Real-time document collaboration. Multi-user editing, comments, suggestions, version history, and conflict resolution.') },
  { id: 'sf-dc1-2', skillVersionId: 'sv-doc-coauthoring-1', filePath: 'scripts/collab.ts', fileType: 'text/typescript', sizeBytes: 9216, content: getTsContent('collab', ['join', 'leave', 'broadcast', 'sync']) },
  { id: 'sf-dc1-3', skillVersionId: 'sv-doc-coauthoring-1', filePath: 'scripts/sync.ts', fileType: 'text/typescript', sizeBytes: 7168, content: getTsContent('sync', ['push', 'pull', 'merge', 'resolve']) },
  // Internal Comms 1.0.0 files
  { id: 'sf-ic1-1', skillVersionId: 'sv-internal-comms-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 2900, content: getSkillMdContent('internal-comms', 'Internal communications assistant. Draft company announcements, meeting notes, team updates, and internal documentation.') },
  { id: 'sf-ic1-2', skillVersionId: 'sv-internal-comms-1', filePath: 'scripts/announce.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('announce', ['draft', 'schedule', 'send']) },
  { id: 'sf-ic1-3', skillVersionId: 'sv-internal-comms-1', filePath: 'scripts/templates.ts', fileType: 'text/typescript', sizeBytes: 4096, content: getTsContent('templates', ['load', 'render', 'save']) },
  // Theme Factory 1.0.0 files
  { id: 'sf-tf1-1', skillVersionId: 'sv-theme-factory-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3600, content: getSkillMdContent('theme-factory', 'Generate custom themes for applications. Create color schemes, typography systems, component styles, and dark mode variants.') },
  { id: 'sf-tf1-2', skillVersionId: 'sv-theme-factory-1', filePath: 'scripts/theme.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('theme', ['create', 'apply', 'export']) },
  { id: 'sf-tf1-3', skillVersionId: 'sv-theme-factory-1', filePath: 'scripts/colors.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('colors', ['generate', 'harmonize', 'contrast']) },
  { id: 'sf-tf1-4', skillVersionId: 'sv-theme-factory-1', filePath: 'scripts/dark-mode.ts', fileType: 'text/typescript', sizeBytes: 4096, content: getTsContent('dark-mode', ['invert', 'adjust', 'toggle']) },
  // Algorithmic Art 1.0.0 files (rejected)
  { id: 'sf-aa1-1', skillVersionId: 'sv-algorithmic-art-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 2400, content: getSkillMdContent('algorithmic-art', 'Generate algorithmic and generative art. Create patterns, fractals, procedural graphics, and mathematical visualizations.') },
  { id: 'sf-aa1-2', skillVersionId: 'sv-algorithmic-art-1', filePath: 'scripts/generate.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('generate', ['render', 'iterate', 'save']) },
  // Algorithmic Art 1.1.0 files
  { id: 'sf-aa2-1', skillVersionId: 'sv-algorithmic-art-2', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 2800, content: getSkillMdContent('algorithmic-art', 'Generate algorithmic and generative art. Create patterns, fractals, procedural graphics, and mathematical visualizations.') },
  { id: 'sf-aa2-2', skillVersionId: 'sv-algorithmic-art-2', filePath: 'scripts/generate.ts', fileType: 'text/typescript', sizeBytes: 9216, content: getTsContent('generate', ['render', 'iterate', 'save', 'optimize']) },
  { id: 'sf-aa2-3', skillVersionId: 'sv-algorithmic-art-2', filePath: 'scripts/fractals.ts', fileType: 'text/typescript', sizeBytes: 7168, content: getTsContent('fractals', ['mandelbrot', 'julia', 'sierpinski']) },
  { id: 'sf-aa2-4', skillVersionId: 'sv-algorithmic-art-2', filePath: 'scripts/patterns.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('patterns', ['tile', 'repeat', 'randomize']) },
  // Slack GIF Creator 1.0.0 files
  { id: 'sf-sg1-1', skillVersionId: 'sv-slack-gif-creator-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 2600, content: getSkillMdContent('slack-gif-creator', 'Create custom GIFs for Slack. Generate animated stickers, reactions, and custom emoji animations for team communication.') },
  { id: 'sf-sg1-2', skillVersionId: 'sv-slack-gif-creator-1', filePath: 'scripts/gif.ts', fileType: 'text/typescript', sizeBytes: 8192, content: getTsContent('gif', ['encode', 'decode', 'optimize', 'resize']) },
  { id: 'sf-sg1-3', skillVersionId: 'sv-slack-gif-creator-1', filePath: 'scripts/animate.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('animate', ['frame', 'loop', 'ease']) },
  // Web Artifacts Builder 1.0.0 files
  { id: 'sf-wab1-1', skillVersionId: 'sv-web-artifacts-builder-1', filePath: 'SKILL.md', fileType: 'text/markdown', sizeBytes: 3400, content: getSkillMdContent('web-artifacts-builder', 'Build interactive web artifacts. Create self-contained HTML/CSS/JS applications, widgets, and interactive demos.') },
  { id: 'sf-wab1-2', skillVersionId: 'sv-web-artifacts-builder-1', filePath: 'scripts/builder.ts', fileType: 'text/typescript', sizeBytes: 10240, content: getTsContent('builder', ['build', 'bundle', 'minify']) },
  { id: 'sf-wab1-3', skillVersionId: 'sv-web-artifacts-builder-1', filePath: 'scripts/html.ts', fileType: 'text/typescript', sizeBytes: 6144, content: getTsContent('html', ['parse', 'render', 'sanitize']) },
  { id: 'sf-wab1-4', skillVersionId: 'sv-web-artifacts-builder-1', filePath: 'scripts/css.ts', fileType: 'text/typescript', sizeBytes: 5120, content: getTsContent('css', ['compile', 'prefix', 'minify']) },
  { id: 'sf-wab1-5', skillVersionId: 'sv-web-artifacts-builder-1', filePath: 'scripts/js.ts', fileType: 'text/typescript', sizeBytes: 7168, content: getTsContent('js', ['transpile', 'bundle', 'uglify']) },
]

export const SKILL_STATS = [
  { id: 'stat-pdf', skillId: 'skill-pdf', downloadsCount: 4523, viewsCount: 28450, lastDownloadedAt: new Date('2024-01-21'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-pptx', skillId: 'skill-pptx', downloadsCount: 3892, viewsCount: 21340, lastDownloadedAt: new Date('2024-01-21'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-docx', skillId: 'skill-docx', downloadsCount: 3456, viewsCount: 19230, lastDownloadedAt: new Date('2024-01-20'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-xlsx', skillId: 'skill-xlsx', downloadsCount: 2890, viewsCount: 16780, lastDownloadedAt: new Date('2024-01-20'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-skill-creator', skillId: 'skill-skill-creator', downloadsCount: 2134, viewsCount: 12450, lastDownloadedAt: new Date('2024-01-21'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-mcp-builder', skillId: 'skill-mcp-builder', downloadsCount: 1876, viewsCount: 9870, lastDownloadedAt: new Date('2024-01-19'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-frontend-design', skillId: 'skill-frontend-design', downloadsCount: 1654, viewsCount: 8920, lastDownloadedAt: new Date('2024-01-20'), lastViewedAt: new Date('2024-01-21') },
  { id: 'stat-webapp-testing', skillId: 'skill-webapp-testing', downloadsCount: 1423, viewsCount: 7650, lastDownloadedAt: new Date('2024-01-18'), lastViewedAt: new Date('2024-01-20') },
  { id: 'stat-brand-guidelines', skillId: 'skill-brand-guidelines', downloadsCount: 234, viewsCount: 1520, lastDownloadedAt: new Date('2024-01-15'), lastViewedAt: new Date('2024-01-20') },
  { id: 'stat-canvas-design', skillId: 'skill-canvas-design', downloadsCount: 189, viewsCount: 980, lastDownloadedAt: new Date('2024-01-14'), lastViewedAt: new Date('2024-01-19') },
  { id: 'stat-doc-coauthoring', skillId: 'skill-doc-coauthoring', downloadsCount: 156, viewsCount: 890, lastDownloadedAt: new Date('2024-01-18'), lastViewedAt: new Date('2024-01-19') },
  { id: 'stat-internal-comms', skillId: 'skill-internal-comms', downloadsCount: 98, viewsCount: 540, lastDownloadedAt: new Date('2024-01-12'), lastViewedAt: new Date('2024-01-17') },
  { id: 'stat-theme-factory', skillId: 'skill-theme-factory', downloadsCount: 67, viewsCount: 340, lastDownloadedAt: new Date('2024-01-10'), lastViewedAt: new Date('2024-01-15') },
  { id: 'stat-algorithmic-art', skillId: 'skill-algorithmic-art', downloadsCount: 45, viewsCount: 230, lastDownloadedAt: new Date('2024-01-08'), lastViewedAt: new Date('2024-01-12') },
  { id: 'stat-slack-gif-creator', skillId: 'skill-slack-gif-creator', downloadsCount: 34, viewsCount: 180, lastDownloadedAt: new Date('2024-01-06'), lastViewedAt: new Date('2024-01-10') },
  { id: 'stat-web-artifacts-builder', skillId: 'skill-web-artifacts-builder', downloadsCount: 28, viewsCount: 150, lastDownloadedAt: new Date('2024-01-05'), lastViewedAt: new Date('2024-01-09') },
]

export const EVAL_QUEUES = [
  {
    id: 'eq-docx-pending',
    skillVersionId: 'sv-docx-2',
    status: JobStatus.PENDING,
    priority: 5,
  },
  {
    id: 'eq-frontend-running',
    skillVersionId: 'sv-frontend-design-2',
    status: JobStatus.RUNNING,
    priority: 3,
    startedAt: new Date('2024-01-21T10:00:00Z'),
  },
  {
    id: 'eq-pdf-completed',
    skillVersionId: 'sv-pdf-2',
    status: JobStatus.COMPLETED,
    priority: 5,
    startedAt: new Date('2024-01-15T08:00:00Z'),
    completedAt: new Date('2024-01-15T08:05:00Z'),
  },
  {
    id: 'eq-algorithmic-failed',
    skillVersionId: 'sv-algorithmic-art-1',
    status: JobStatus.FAILED,
    priority: 5,
    startedAt: new Date('2024-01-10T14:00:00Z'),
    completedAt: new Date('2024-01-10T14:02:00Z'),
    error: 'Memory limit exceeded during fractal generation',
  },
]

export const EVAL_RESULTS = [
  // Completed eval results for pdf-2
  { id: 'er-pdf1', evalQueueId: 'eq-pdf-completed', testName: 'PDF text extraction', status: TestStatus.PASSED, output: 'Successfully extracted text from 10 test PDFs', durationMs: 450 },
  { id: 'er-pdf2', evalQueueId: 'eq-pdf-completed', testName: 'PDF creation', status: TestStatus.PASSED, output: 'Created valid PDF documents with formatting', durationMs: 380 },
  { id: 'er-pdf3', evalQueueId: 'eq-pdf-completed', testName: 'PDF merging', status: TestStatus.PASSED, output: 'Merged multiple PDFs without data loss', durationMs: 520 },
  // Failed eval results for algorithmic-art-1
  { id: 'er-aa1', evalQueueId: 'eq-algorithmic-failed', testName: 'Pattern generation', status: TestStatus.PASSED, output: 'Generated patterns correctly', durationMs: 1200 },
  { id: 'er-aa2', evalQueueId: 'eq-algorithmic-failed', testName: 'Fractal rendering', status: TestStatus.FAILED, output: 'Memory allocation failed at iteration 5000', durationMs: 0 },
]

// Security scans with realistic findings using the new SecurityFinding format
// Each finding includes: id, severity, category, title, description, file, line, recommendation, source
export const SECURITY_SCANS = [
  {
    id: 'ss-pdf-2',
    skillVersionId: 'sv-pdf-2',
    status: JobStatus.COMPLETED,
    score: 75, // Low risk = 75
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-pdf-001',
          severity: 'low',
          category: 'Input Validation',
          title: 'Missing Input Sanitization',
          description: 'Consider adding input sanitization for form field names in form-handler.ts',
          file: 'scripts/form-handler.ts',
          line: 45,
          codeSnippet: '   42 | async function fillForm(fields) {\n   43 |   for (const [name, value] of Object.entries(fields)) {\n>>>44 |     const field = await getField(name);\n   45 |     await field.setValue(value);\n   46 |   }\n   47 | }',
          recommendation: 'Add input validation for user-provided field names',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 5,
      analyzedAt: '2024-01-15T08:10:00Z',
    },
    completedAt: new Date('2024-01-15T08:10:00Z'),
  },
  {
    id: 'ss-pptx-1',
    skillVersionId: 'sv-pptx-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-pptx-001',
          severity: 'low',
          category: 'Configuration',
          title: 'Hardcoded Template Path',
          description: 'Template path uses relative reference which may not work in all environments',
          file: 'scripts/slide-builder.ts',
          line: 23,
          codeSnippet: '   20 | export async function loadTemplate(name: string) {\n   21 |   const templateDir = "./assets/templates";\n>>>22 |   return await readFile(`${templateDir}/${name}.xml`);\n   23 | }',
          recommendation: 'Use configurable template paths via environment variables',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-14T09:00:00Z',
    },
    completedAt: new Date('2024-01-14T09:00:00Z'),
  },
  {
    id: 'ss-docx-1',
    skillVersionId: 'sv-docx-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-docx-001',
          severity: 'low',
          category: 'Input Validation',
          title: 'Text Content Not Sanitized',
          description: 'Text content is not sanitized before being inserted into documents',
          file: 'scripts/paragraph.ts',
          line: 34,
          recommendation: 'Sanitize text input to prevent potential document injection',
          source: 'pattern',
        },
        {
          id: 'finding-docx-002',
          severity: 'info',
          category: 'Logging',
          title: 'Sensitive Data in Debug Logs',
          description: 'Document content is logged at debug level which may expose sensitive information',
          file: 'scripts/document.ts',
          line: 89,
          recommendation: 'Remove sensitive data from debug logs or use conditional logging',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 1, total: 2 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-13T11:00:00Z',
    },
    completedAt: new Date('2024-01-13T11:00:00Z'),
  },
  {
    id: 'ss-xlsx-1',
    skillVersionId: 'sv-xlsx-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-xlsx-001',
          severity: 'low',
          category: 'Formula Injection',
          title: 'Formula Injection Risk',
          description: 'Cell values could contain malicious formulas starting with =, +, -, or @',
          file: 'scripts/cell.ts',
          line: 56,
          codeSnippet: '   53 | export async function setCellValue(cell, value) {\n>>>54 |   cell.value = value;\n   55 |   await cell.save();\n   56 | }',
          recommendation: 'Escape formula prefixes in cell values or use string escaping',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-12T10:30:00Z',
    },
    completedAt: new Date('2024-01-12T10:30:00Z'),
  },
  {
    id: 'ss-skill-creator-1',
    skillVersionId: 'sv-skill-creator-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      analyzedFiles: 5,
      analyzedAt: '2024-01-11T14:00:00Z',
    },
    completedAt: new Date('2024-01-11T14:00:00Z'),
  },
  {
    id: 'ss-mcp-builder-1',
    skillVersionId: 'sv-mcp-builder-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-mcp-001',
          severity: 'info',
          category: 'Network Access',
          title: 'Server Network Configuration',
          description: 'Server listens on configurable port - ensure firewall rules are properly configured',
          file: 'scripts/server.ts',
          line: 12,
          recommendation: 'Document network security requirements and recommended firewall settings',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 1, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-10T16:00:00Z',
    },
    completedAt: new Date('2024-01-10T16:00:00Z'),
  },
  {
    id: 'ss-frontend-design-1',
    skillVersionId: 'sv-frontend-design-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-fd-001',
          severity: 'low',
          category: 'Input Validation',
          title: 'CSS Class Name Validation',
          description: 'CSS class names are not validated against an allowlist',
          file: 'scripts/styles.ts',
          line: 78,
          recommendation: 'Validate CSS class names against an allowlist to prevent injection',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-09T09:00:00Z',
    },
    completedAt: new Date('2024-01-09T09:00:00Z'),
  },
  {
    id: 'ss-webapp-testing-1',
    skillVersionId: 'sv-webapp-testing-1',
    status: JobStatus.COMPLETED,
    score: 50, // medium risk
    reportJson: {
      riskLevel: 'medium',
      findings: [
        {
          id: 'finding-wt-001',
          severity: 'high',
          category: 'Code Injection',
          title: 'Use of eval()',
          description: 'eval() used for dynamic test configuration - this can execute arbitrary code',
          file: 'scripts/test-runner.ts',
          line: 45,
          codeSnippet: '   42 | export async function runTest(configStr) {\n   43 |   try {\n>>>44 |     const config = eval(`(${configStr})`);\n   45 |     return await executeTest(config);\n   46 |   } catch (e) {\n   47 |     return { error: e.message };\n   48 |   }\n   49 | }',
          recommendation: 'Replace eval() with JSON.parse() or a safer configuration parser',
          source: 'pattern',
        },
        {
          id: 'finding-wt-002',
          severity: 'low',
          category: 'File System Access',
          title: 'Unrestricted File System Writes',
          description: 'Writes to filesystem for test artifacts without path validation',
          file: 'scripts/browser.ts',
          line: 23,
          recommendation: 'Sandbox file system access and validate paths',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 1, medium: 0, low: 1, info: 0, total: 2 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-08T11:30:00Z',
    },
    completedAt: new Date('2024-01-08T11:30:00Z'),
  },
  {
    id: 'ss-brand-guidelines-1',
    skillVersionId: 'sv-brand-guidelines-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-07T14:00:00Z',
    },
    completedAt: new Date('2024-01-07T14:00:00Z'),
  },
  {
    id: 'ss-canvas-design-1',
    skillVersionId: 'sv-canvas-design-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-cd-001',
          severity: 'low',
          category: 'Memory Management',
          title: 'Canvas Buffer Not Cleared',
          description: 'Canvas buffer is not cleared after use which may expose previous content',
          file: 'scripts/layers.ts',
          line: 67,
          recommendation: 'Clear canvas buffers after operations to prevent memory exposure',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-06T10:00:00Z',
    },
    completedAt: new Date('2024-01-06T10:00:00Z'),
  },
  {
    id: 'ss-doc-coauthoring-1',
    skillVersionId: 'sv-doc-coauthoring-1',
    status: JobStatus.COMPLETED,
    score: 50,
    reportJson: {
      riskLevel: 'medium',
      findings: [
        {
          id: 'finding-dc-001',
          severity: 'medium',
          category: 'Network Security',
          title: 'WebSocket Without TLS Validation',
          description: 'WebSocket connection established without proper TLS certificate validation',
          file: 'scripts/sync.ts',
          line: 12,
          codeSnippet: '   10 | const ws = new WebSocket(serverUrl, {\n   11 |   rejectUnauthorized: false, // WARNING: Disables TLS validation\n>>>12 | });',
          recommendation: 'Enforce TLS for WebSocket connections and validate certificates',
          source: 'pattern',
        },
        {
          id: 'finding-dc-002',
          severity: 'low',
          category: 'Input Validation',
          title: 'User Input Not Sanitized',
          description: 'User input is not sanitized before being broadcast to other users',
          file: 'scripts/collab.ts',
          line: 45,
          recommendation: 'Sanitize user content before broadcasting to prevent XSS',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 1, low: 1, info: 0, total: 2 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-05T15:00:00Z',
    },
    completedAt: new Date('2024-01-05T15:00:00Z'),
  },
  {
    id: 'ss-internal-comms-1',
    skillVersionId: 'sv-internal-comms-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-04T09:00:00Z',
    },
    completedAt: new Date('2024-01-04T09:00:00Z'),
  },
  {
    id: 'ss-theme-factory-1',
    skillVersionId: 'sv-theme-factory-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-tf-001',
          severity: 'low',
          category: 'Input Validation',
          title: 'Color Hex Value Validation',
          description: 'Color hex values are not validated before use',
          file: 'scripts/colors.ts',
          line: 34,
          recommendation: 'Validate color hex format to prevent injection',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-03T11:00:00Z',
    },
    completedAt: new Date('2024-01-03T11:00:00Z'),
  },
  {
    id: 'ss-algorithmic-art-1',
    skillVersionId: 'sv-algorithmic-art-1',
    status: JobStatus.COMPLETED,
    score: 25, // high risk
    reportJson: {
      riskLevel: 'high',
      findings: [
        {
          id: 'finding-aa1-001',
          severity: 'high',
          category: 'Resource Exhaustion',
          title: 'No Iteration Limit',
          description: 'Recursive pattern generation has no iteration limit which can lead to DoS',
          file: 'scripts/generate.ts',
          line: 23,
          codeSnippet: '   20 | export function generatePattern(depth) {\n   21 |   // No limit on depth!\n>>>22 |   for (let i = 0; i < depth; i++) {\n   23 |     generatePattern(depth - 1); // Recursive without limit\n   24 |   }\n   25 | }',
          recommendation: 'Add iteration limits to prevent resource exhaustion',
          source: 'pattern',
        },
        {
          id: 'finding-aa1-002',
          severity: 'medium',
          category: 'Memory Management',
          title: 'Unbounded Canvas Allocations',
          description: 'Large canvas allocations without bounds checking can exhaust memory',
          file: 'scripts/generate.ts',
          line: 56,
          recommendation: 'Implement memory bounds checking for canvas allocations',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 1, medium: 1, low: 0, info: 0, total: 2 },
      analyzedFiles: 2,
      analyzedAt: '2024-01-02T14:00:00Z',
    },
    completedAt: new Date('2024-01-02T14:00:00Z'),
  },
  {
    id: 'ss-algorithmic-art-2',
    skillVersionId: 'sv-algorithmic-art-2',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-aa2-001',
          severity: 'low',
          category: 'Resource Management',
          title: 'Configurable Iteration Limit',
          description: 'Iteration limit added but could be tuned for better performance',
          file: 'scripts/fractals.ts',
          line: 89,
          recommendation: 'Consider making iteration limits configurable via options',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 1, info: 0, total: 1 },
      analyzedFiles: 4,
      analyzedAt: '2024-01-10T16:00:00Z',
    },
    completedAt: new Date('2024-01-10T16:00:00Z'),
  },
  {
    id: 'ss-slack-gif-creator-1',
    skillVersionId: 'sv-slack-gif-creator-1',
    status: JobStatus.COMPLETED,
    score: 75,
    reportJson: {
      riskLevel: 'low',
      findings: [
        {
          id: 'finding-sg-001',
          severity: 'info',
          category: 'Network Access',
          title: 'External API Dependencies',
          description: 'Potential external API calls for GIF encoding',
          file: 'scripts/gif.ts',
          line: 12,
          recommendation: 'Document any external API dependencies and their privacy implications',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 1, total: 1 },
      analyzedFiles: 3,
      analyzedAt: '2024-01-08T10:00:00Z',
    },
    completedAt: new Date('2024-01-08T10:00:00Z'),
  },
  {
    id: 'ss-web-artifacts-builder-1',
    skillVersionId: 'sv-web-artifacts-builder-1',
    status: JobStatus.COMPLETED,
    score: 50,
    reportJson: {
      riskLevel: 'medium',
      findings: [
        {
          id: 'finding-wab-001',
          severity: 'medium',
          category: 'XSS',
          title: 'XSS Vulnerability',
          description: 'User content is inserted into HTML without proper escaping',
          file: 'scripts/html.ts',
          line: 45,
          codeSnippet: '   42 | export function renderContent(userInput) {\n   43 |   const html = `<div>${userInput}</div>`;\n>>>44 |   return html; // Not escaped!\n   45 | }',
          recommendation: 'Escape user content in HTML output using a sanitization library',
          source: 'pattern',
        },
        {
          id: 'finding-wab-002',
          severity: 'low',
          category: 'Security Headers',
          title: 'Missing Content-Security-Policy',
          description: 'Generated HTML lacks Content-Security-Policy headers',
          file: 'scripts/builder.ts',
          line: 23,
          recommendation: 'Add Content-Security-Policy headers to generated HTML',
          source: 'pattern',
        },
      ],
      summary: { critical: 0, high: 0, medium: 1, low: 1, info: 0, total: 2 },
      analyzedFiles: 5,
      analyzedAt: '2024-01-07T12:00:00Z',
    },
    completedAt: new Date('2024-01-07T12:00:00Z'),
  },
]

export const SKILL_IDS = {
  pdf: 'skill-pdf',
  pptx: 'skill-pptx',
  docx: 'skill-docx',
  xlsx: 'skill-xlsx',
  skillCreator: 'skill-skill-creator',
  mcpBuilder: 'skill-mcp-builder',
  frontendDesign: 'skill-frontend-design',
  webappTesting: 'skill-webapp-testing',
  brandGuidelines: 'skill-brand-guidelines',
  canvasDesign: 'skill-canvas-design',
  docCoauthoring: 'skill-doc-coauthoring',
  internalComms: 'skill-internal-comms',
  themeFactory: 'skill-theme-factory',
  algorithmicArt: 'skill-algorithmic-art',
  slackGifCreator: 'skill-slack-gif-creator',
  webArtifactsBuilder: 'skill-web-artifacts-builder',
}
