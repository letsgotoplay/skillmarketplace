import Anthropic from '@anthropic-ai/sdk';
import JSZip from 'jszip';
import { randomUUID } from 'crypto';
import type { SecurityFinding } from './scanner';
import { buildSystemPrompt, buildSecurityAnalysisPrompt } from './prompts';
import { env } from '@/lib/env';

/**
 * AI Security Analysis Report
 */
export interface AISecurityReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: SecurityFinding[];
  recommendations: string[];
  confidence: number;
  analyzedAt: string;
  modelUsed: string;
  summary?: string;
  /** Whether execution should be blocked due to critical issues */
  blockExecution: boolean;
  /** Files that were skipped due to size limits */
  skippedFiles?: string[];
}

/**
 * Finding from AI analysis
 */
interface AIFindingRaw {
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  file?: string | null;
  line?: number | null;
  evidence?: string;
  confidence?: number;
  description: string;
  harm: string;
  blockExecution?: boolean;
}

/**
 * Raw AI response structure
 */
interface AIResponseRaw {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: AIFindingRaw[];
  summary?: string;
  recommendations?: string[];
  confidence?: number;
}

/**
 * File content for analysis
 * @internal Exported for testing
 */
export interface FileForAnalysis {
  path: string;
  content: string;
  size: number;
  type: 'md' | 'script' | 'other';
}

// File size limits
const MAX_FILE_SIZE = 100 * 1024; // 100KB per file max
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB total max

// Log prefix for AI analyzer
const LOG_PREFIX = '[AIAnalyzer]';

// Get AI configuration from environment
function getAIConfig() {
  const enabled = env.AI_SECURITY_ENABLED !== 'false'; // default true
  const apiKey = env.AI_SECURITY_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseUrl = env.AI_SECURITY_BASE_URL || 'https://api.anthropic.com';
  const model = env.AI_SECURITY_MODEL || 'claude-sonnet-4-20250514';

  return { enabled, apiKey, baseUrl, model };
}

// Initialize Anthropic client with configurable endpoint
function createAnthropicClient(): Anthropic | null {
  const { enabled, apiKey, baseUrl } = getAIConfig();

  if (!enabled) {
    console.log(`${LOG_PREFIX} AI security analysis is disabled by feature flag`);
    return null;
  }

  if (!apiKey) {
    return null;
  }

  return new Anthropic({
    apiKey,
    baseURL: baseUrl,
  });
}

// Lazy-loaded client
let _anthropicClient: Anthropic | null | undefined;

function getAnthropicClient(): Anthropic | null {
  if (_anthropicClient === undefined) {
    _anthropicClient = createAnthropicClient();
  }
  return _anthropicClient;
}

/**
 * Check if AI analysis is available
 */
export function isAIAnalysisAvailable(): boolean {
  return getAnthropicClient() !== null;
}

/**
 * Check if AI analysis feature is enabled (regardless of API key)
 */
export function isAIAnalysisEnabled(): boolean {
  return getAIConfig().enabled;
}

/**
 * Get the configured model name
 */
export function getConfiguredModel(): string {
  return getAIConfig().model;
}

/**
 * Determine file type based on extension
 * @internal Exported for testing
 */
export function getFileType(path: string): 'md' | 'script' | 'other' {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'md';
  if (['py', 'sh', 'js', 'ts', 'jsx', 'tsx', 'bash', 'zsh'].includes(ext || '')) return 'script';
  return 'other';
}

/**
 * Sensitive patterns to highlight for AI analysis
 * @internal Exported for testing
 */
export const SENSITIVE_PATTERNS = [
  /password\s*[=:]/i,
  /secret\s*[=:]/i,
  /api[_-]?key\s*[=:]/i,
  /token\s*[=:]/i,
  /credential/i,
  /private[_-]?key/i,
  /bearer\s+/i,
  /exec\s*\(/i,
  /eval\s*\(/i,
  /system\s*\(/i,
  /subprocess/i,
  /curl\s+/i,
  /wget\s+/i,
  /rm\s+-rf/i,
  /chmod\s+777/i,
  /sudo\s+/i,
  /\/etc\//,
  /~\/\.ssh/,
  /\.env/,
];

/**
 * Smart truncation for large files - keeps sensitive sections
 * @internal Exported for testing
 */
export function smartTruncate(content: string, maxSize: number): { content: string; wasTruncated: boolean } {
  if (content.length <= maxSize) {
    return { content, wasTruncated: false };
  }

  const lines = content.split('\n');
  const sensitiveLines: Set<number> = new Set();

  // Find lines with sensitive patterns
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(lines[i])) {
        // Add the line and its context
        for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) {
          sensitiveLines.add(j);
        }
        break;
      }
    }
  }

  // Build truncated content
  const keepLines = new Set<number>();

  // Keep beginning
  for (let i = 0; i < 30 && i < lines.length; i++) keepLines.add(i);
  // Keep end
  for (let i = Math.max(0, lines.length - 15); i < lines.length; i++) keepLines.add(i);
  // Keep sensitive lines
  for (const idx of sensitiveLines) keepLines.add(idx);

  // Build result
  const result: string[] = [];
  let lastAdded = -2;

  for (let i = 0; i < lines.length; i++) {
    if (keepLines.has(i)) {
      if (i > lastAdded + 1) {
        result.push('\n... [truncated for analysis] ...\n');
      }
      result.push(lines[i]);
      lastAdded = i;
    }
  }

  const truncatedContent = result.join('\n');
  console.log(`${LOG_PREFIX} Smart truncated: ${content.length} -> ${truncatedContent.length} chars, kept ${sensitiveLines.size} sensitive lines`);

  return { content: truncatedContent, wasTruncated: true };
}

/**
 * Hotspot detected during preprocessing
 * @internal Exported for testing
 */
export interface SecurityHotspot {
  file: string;
  line: number;
  pattern: string;
  context: string;
}

/**
 * Preprocess files to find security hotspots
 * @internal Exported for testing
 */
export function findSecurityHotspots(files: FileForAnalysis[]): SecurityHotspot[] {
  const hotspots: SecurityHotspot[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(lines[i])) {
          hotspots.push({
            file: file.path,
            line: i + 1,
            pattern: pattern.source,
            context: lines[i].trim().substring(0, 100),
          });
          break; // Only report once per line
        }
      }
    }
  }

  return hotspots.slice(0, 20); // Limit to 20 hotspots
}

/**
 * Validate AI findings against actual files
 * @internal Exported for testing
 */
export function validateFindings(
  report: AISecurityReport,
  files: FileForAnalysis[]
): AISecurityReport {
  const fileMap = new Map(files.map(f => [f.path, f]));
  const validatedFindings: SecurityFinding[] = [];
  let removedCount = 0;

  for (const finding of report.threats) {
    // Check if file exists
    if (finding.file) {
      const file = fileMap.get(finding.file);
      if (!file) {
        // File doesn't exist - might be hallucination
        console.warn(`${LOG_PREFIX}[Validator] File not found: ${finding.file}, removing finding`);
        removedCount++;
        continue;
      }

      // Validate line number
      if (finding.line) {
        const lines = file.content.split('\n');
        if (finding.line < 1 || finding.line > lines.length) {
          console.warn(`${LOG_PREFIX}[Validator] Invalid line number: ${finding.file}:${finding.line}, removing line ref`);
          finding.line = undefined;
        }
      }
    }

    validatedFindings.push(finding);
  }

  if (removedCount > 0) {
    console.log(`${LOG_PREFIX}[Validator] Removed ${removedCount} findings with invalid file references`);
  }

  report.threats = validatedFindings;
  return report;
}

/**
 * Extract files from skill for analysis, categorized by type
 * @internal Exported for testing
 */
export async function extractFilesForAnalysis(
  skillBuffer: Buffer
): Promise<{
  mdFiles: FileForAnalysis[];
  scriptFiles: FileForAnalysis[];
  otherFiles: FileForAnalysis[];
  skippedFiles: string[];
}> {
  const mdFiles: FileForAnalysis[] = [];
  const scriptFiles: FileForAnalysis[] = [];
  const otherFiles: FileForAnalysis[] = [];
  const skippedFiles: string[] = [];

  const zip = await JSZip.loadAsync(skillBuffer);

  const textExtensions = [
    '.md', '.markdown',
    '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.py', '.pyw',
    '.sh', '.bash', '.zsh',
    '.json', '.yaml', '.yml',
  ];

  let totalSize = 0;
  let totalFiles = 0;
  let skippedByTotal = 0;

  // Sort files to prioritize SKILL.md and scripts
  const entries = Object.entries(zip.files)
    .filter(([_, zipEntry]) => !zipEntry.dir)
    .sort(([pathA], [pathB]) => {
      // SKILL.md first
      if (pathA === 'SKILL.md') return -1;
      if (pathB === 'SKILL.md') return 1;
      // Then scripts
      const aIsScript = ['py', 'sh', 'js', 'ts'].includes(pathA.split('.').pop()?.toLowerCase() || '');
      const bIsScript = ['py', 'sh', 'js', 'ts'].includes(pathB.split('.').pop()?.toLowerCase() || '');
      if (aIsScript && !bIsScript) return -1;
      if (!aIsScript && bIsScript) return 1;
      return 0;
    });

  for (const [path, zipEntry] of entries) {
    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (!textExtensions.includes(ext)) continue;

    try {
      let content = await zipEntry.async('string');
      const originalSize = content.length;
      totalFiles++;

      // Smart truncate large files instead of skipping
      let wasTruncated = false;
      if (originalSize > MAX_FILE_SIZE) {
        const result = smartTruncate(content, MAX_FILE_SIZE);
        content = result.content;
        wasTruncated = result.wasTruncated;
        console.log(`${LOG_PREFIX} Smart truncated large file: ${path} (${(originalSize / 1024).toFixed(1)}KB -> ${(content.length / 1024).toFixed(1)}KB)`);
      }

      const size = content.length;

      // Check total size limit
      if (totalSize + size > MAX_TOTAL_SIZE) {
        skippedFiles.push(`${path} (total size limit reached)`);
        skippedByTotal++;
        continue;
      }

      totalSize += size;
      const fileType = getFileType(path);
      const file: FileForAnalysis = {
        path,
        content,
        size,
        type: fileType
      };

      if (wasTruncated) {
        // Mark that this file was truncated
        skippedFiles.push(`${path} (truncated from ${(originalSize / 1024).toFixed(1)}KB for analysis)`);
      }

      if (fileType === 'md') {
        mdFiles.push(file);
      } else if (fileType === 'script') {
        scriptFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    } catch {
      console.log(`${LOG_PREFIX} Skipped unreadable file: ${path}`);
      skippedFiles.push(`${path} (unreadable)`);
    }
  }

  console.log(`${LOG_PREFIX} File extraction summary:`);
  console.log(`  - MD files: ${mdFiles.length} (${(mdFiles.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)}KB)`);
  console.log(`  - Script files: ${scriptFiles.length} (${(scriptFiles.reduce((s, f) => s + f.size, 0) / 1024).toFixed(1)}KB)`);
  console.log(`  - Other files: ${otherFiles.length}`);
  console.log(`  - Total size: ${(totalSize / 1024).toFixed(1)}KB / ${MAX_TOTAL_SIZE / 1024}KB`);
  if (skippedFiles.length > 0) {
    console.log(`  - Processed with limits: ${skippedFiles.length} files (truncated or skipped)`);
  }

  return { mdFiles, scriptFiles, otherFiles, skippedFiles };
}

/**
 * Parse AI response into structured report
 * @internal Exported for testing
 */
export function parseAIResponse(response: string, modelUsed: string): AISecurityReport {
  console.log(`${LOG_PREFIX} Parsing AI response (${response.length} chars)`);

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed: AIResponseRaw = JSON.parse(jsonStr);

    // Check if any finding requires blocking execution
    const hasBlockingFinding = parsed.findings.some(
      f => f.severity === 'critical' || f.blockExecution === true
    );

    // Map findings to SecurityFinding format
    const threats: SecurityFinding[] = (parsed.findings || []).map((t: AIFindingRaw): SecurityFinding => ({
      id: randomUUID(),
      severity: t.severity || 'medium',
      category: t.category || t.ruleId || 'Security Issue',
      title: t.title || t.ruleId || 'Security Issue',
      description: t.description || '',
      file: t.file || undefined,
      line: t.line || undefined,
      recommendation: `Harm: ${t.harm || 'Unknown'}`,
      source: 'ai' as const,
    }));

    const report: AISecurityReport = {
      riskLevel: parsed.riskLevel || 'medium',
      threats,
      recommendations: parsed.recommendations || [],
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      analyzedAt: new Date().toISOString(),
      modelUsed,
      summary: parsed.summary,
      blockExecution: hasBlockingFinding,
    };

    console.log(`${LOG_PREFIX} Parsed report: riskLevel=${report.riskLevel}, threats=${threats.length}, confidence=${report.confidence}%`);

    return report;
  } catch (error) {
    console.error(`${LOG_PREFIX} Failed to parse AI response:`, error);
    console.error(`${LOG_PREFIX} Raw response preview:`, response.substring(0, 500));

    // If parsing fails, return a generic report
    return {
      riskLevel: 'medium',
      threats: [
        {
          id: randomUUID(),
          severity: 'medium',
          category: 'Analysis Error',
          title: 'Could not parse AI analysis',
          description: 'Could not parse AI analysis results. Manual review recommended.',
          recommendation: 'Review the skill manually for security concerns',
          source: 'ai',
        },
      ],
      recommendations: ['Perform manual security review of the skill'],
      confidence: 50,
      analyzedAt: new Date().toISOString(),
      modelUsed,
      blockExecution: false,
    };
  }
}

/**
 * Optional configuration for AI analysis
 */
export interface AIAnalysisConfig {
  systemPrompt?: string;
  rules?: Array<{
    id: string;
    category: string;
    name: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    appliesTo: ('md' | 'scripts')[];
    checkDescription: string;
    harmDescription: string;
  }>;
}

/**
 * Build user prompt with custom rules
 */
function buildCustomSecurityAnalysisPrompt(
  mdFiles: { path: string; content: string }[],
  scriptFiles: { path: string; content: string }[],
  rules: AIAnalysisConfig['rules']
): string {
  const mdRules = (rules || []).filter(r => r.appliesTo.includes('md'));
  const scriptRules = (rules || []).filter(r => r.appliesTo.includes('scripts'));

  let prompt = `# Security Analysis Task

Analyze the following skill files for security vulnerabilities. This is a security-only review.

## Files to Analyze

`;

  if (mdFiles.length > 0) {
    prompt += `### MD (Markdown) Files:\n\n`;
    for (const file of mdFiles) {
      prompt += `--- FILE: ${file.path} ---\n${file.content}\n--- END FILE: ${file.path} ---\n\n`;
    }
  }

  if (scriptFiles.length > 0) {
    prompt += `### Script Files:\n\n`;
    for (const file of scriptFiles) {
      prompt += `--- FILE: ${file.path} ---\n${file.content}\n--- END FILE: ${file.path} ---\n\n`;
    }
  }

  prompt += `## Security Check Rules

### MD File Security Checks (apply to all .md files including SKILL.md):

`;
  for (const rule of mdRules) {
    prompt += `#### ${rule.name} [${rule.severity.toUpperCase()}]
ID: ${rule.id}
${rule.checkDescription}
Harm: ${rule.harmDescription}

`;
  }

  prompt += `### Script Security Checks (apply to all .py, .sh, .js, .ts files in scripts/):

`;
  for (const rule of scriptRules) {
    prompt += `#### ${rule.name} [${rule.severity.toUpperCase()}]
ID: ${rule.id}
${rule.checkDescription}
Harm: ${rule.harmDescription}

`;
  }

  prompt += `## Output Requirements

1. ONLY output security risks - no format/syntax/style issues
2. Risk levels: critical, high, medium, low
3. For each finding include:
   - File path and line number (if applicable)
   - Rule ID that was violated
   - Risk type/category
   - Detailed explanation of the vulnerability
   - Potential harm

4. CRITICAL findings should be marked with "BLOCK_EXECUTION: true"

## Response Format

Respond with a JSON object in this exact format:

\`\`\`json
{
  "riskLevel": "critical" | "high" | "medium" | "low",
  "findings": [
    {
      "ruleId": "the rule ID that was violated",
      "severity": "critical" | "high" | "medium" | "low",
      "category": "category name",
      "title": "brief title",
      "file": "file path or null",
      "line": line number or null,
      "description": "detailed explanation of the security issue",
      "harm": "what harm this could cause",
      "blockExecution": true/false (true only for critical issues)
    }
  ],
  "summary": "brief overall security assessment",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "confidence": 0-100
}
\`\`\`

Analyze all files now and provide your security assessment.`;

  return prompt;
}

/**
 * Analyze a skill package using AI for semantic security analysis
 */
export async function analyzeWithAI(
  skillBuffer: Buffer,
  config?: AIAnalysisConfig
): Promise<AISecurityReport> {
  const anthropic = getAnthropicClient();
  const { model } = getAIConfig();

  console.log(`${LOG_PREFIX} Starting analysis, model=${model}, hasConfig=${!!config}`);

  // Check if AI is available
  if (!anthropic) {
    console.log(`${LOG_PREFIX} AI client not available`);
    return {
      riskLevel: 'medium',
      threats: [
        {
          id: randomUUID(),
          severity: 'low',
          category: 'AI Analysis Unavailable',
          title: 'AI Analysis Unavailable',
          description: 'AI security analysis is not configured. Set AI_SECURITY_API_KEY environment variable.',
          recommendation: 'Configure AI_SECURITY_API_KEY to enable AI-powered security analysis',
          source: 'ai',
        },
      ],
      recommendations: ['Enable AI analysis for better security detection'],
      confidence: 30,
      analyzedAt: new Date().toISOString(),
      modelUsed: 'none',
      blockExecution: false,
    };
  }

  try {
    // Extract files for analysis, categorized by type
    const { mdFiles, scriptFiles, skippedFiles } = await extractFilesForAnalysis(skillBuffer);

    if (mdFiles.length === 0 && scriptFiles.length === 0) {
      console.log(`${LOG_PREFIX} No analyzable files found`);
      return {
        riskLevel: 'low',
        threats: [],
        recommendations: ['No analyzable files found in skill package'],
        confidence: 90,
        analyzedAt: new Date().toISOString(),
        modelUsed: model,
        blockExecution: false,
        skippedFiles,
      };
    }

    // Find security hotspots for AI to focus on
    const allFiles = [...mdFiles, ...scriptFiles];
    const hotspots = findSecurityHotspots(allFiles);
    if (hotspots.length > 0) {
      console.log(`${LOG_PREFIX} Found ${hotspots.length} security hotspots to prioritize`);
      hotspots.slice(0, 5).forEach(h => {
        console.log(`  - ${h.file}:${h.line} - "${h.context}"`);
      });
    }

    // Build the prompts - use custom config if provided
    const systemPrompt = config?.systemPrompt || buildSystemPrompt();
    const userPrompt = config?.rules
      ? buildCustomSecurityAnalysisPrompt(
          mdFiles.map(f => ({ path: f.path, content: f.content })),
          scriptFiles.map(f => ({ path: f.path, content: f.content })),
          config.rules
        )
      : buildSecurityAnalysisPrompt(
          mdFiles.map(f => ({ path: f.path, content: f.content })),
          scriptFiles.map(f => ({ path: f.path, content: f.content }))
        );

    // Log prompt sizes
    const systemPromptTokens = Math.ceil(systemPrompt.length / 4); // rough estimate
    const userPromptTokens = Math.ceil(userPrompt.length / 4);
    console.log(`${LOG_PREFIX} Prompt sizes:`);
    console.log(`  - System prompt: ${systemPrompt.length} chars (~${systemPromptTokens} tokens)`);
    console.log(`  - User prompt: ${userPrompt.length} chars (~${userPromptTokens} tokens)`);

    // Warn if prompt might be too large
    const totalEstimatedTokens = systemPromptTokens + userPromptTokens;
    if (totalEstimatedTokens > 100000) {
      console.warn(`${LOG_PREFIX} WARNING: Prompt may be too large (~${totalEstimatedTokens} tokens). Consider reducing file sizes.`);
    }

    // Log user prompt preview (first 500 chars)
    console.log(`${LOG_PREFIX} User prompt preview:\n${userPrompt.substring(0, 500)}...`);

    // Call AI API
    console.log(`${LOG_PREFIX} Calling AI API...`);
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const duration = Date.now() - startTime;
    console.log(`${LOG_PREFIX} AI API call completed in ${duration}ms`);

    // Extract response text
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Log response
    console.log(`${LOG_PREFIX} AI response: ${responseText.length} chars, ${message.usage?.input_tokens || 0} input tokens, ${message.usage?.output_tokens || 0} output tokens`);

    // Log response preview
    console.log(`${LOG_PREFIX} Response preview:\n${responseText.substring(0, 500)}...`);

    // Parse and return the report
    let report = parseAIResponse(responseText, model);

    // Validate findings against actual files (remove hallucinations)
    report = validateFindings(report, allFiles);

    // Add skipped files info to report
    if (skippedFiles.length > 0) {
      report.skippedFiles = skippedFiles;
      // Add warning to recommendations
      report.recommendations = [
        `Note: ${skippedFiles.length} file(s) were skipped due to size limits`,
        ...report.recommendations,
      ];
    }

    return report;
  } catch (error) {
    console.error(`${LOG_PREFIX} Analysis error:`, error);

    return {
      riskLevel: 'medium',
      threats: [
        {
          id: randomUUID(),
          severity: 'medium',
          category: 'Analysis Error',
          title: 'Analysis Error',
          description: error instanceof Error ? error.message : 'Unknown error during AI analysis',
          recommendation: 'Try again later or perform manual security review',
          source: 'ai',
        },
      ],
      recommendations: ['Retry AI analysis or perform manual review'],
      confidence: 40,
      analyzedAt: new Date().toISOString(),
      modelUsed: 'error',
      blockExecution: false,
    };
  }
}

/**
 * Get a summary of the AI security report
 */
export function getSecurityReportSummary(report: AISecurityReport): string {
  const severityCounts = {
    critical: report.threats.filter(t => t.severity === 'critical').length,
    high: report.threats.filter(t => t.severity === 'high').length,
    medium: report.threats.filter(t => t.severity === 'medium').length,
    low: report.threats.filter(t => t.severity === 'low').length,
  };

  const blockStatus = report.blockExecution ? ' | BLOCKED' : '';
  const skippedStatus = report.skippedFiles?.length ? ` | ${report.skippedFiles.length} files skipped` : '';

  return `Risk Level: ${report.riskLevel.toUpperCase()} | ` +
    `Critical: ${severityCounts.critical}, High: ${severityCounts.high}, ` +
    `Medium: ${severityCounts.medium}, Low: ${severityCounts.low} | ` +
    `Confidence: ${report.confidence}%${blockStatus}${skippedStatus}`;
}

/**
 * Skill metadata result from AI analysis
 */
export interface SkillMetadataResult {
  category: 'DEVELOPMENT' | 'SECURITY' | 'DATA_ANALYTICS' | 'AI_ML' | 'TESTING' | 'INTEGRATION';
  tags: string[];
  confidence: number;
}

/**
 * Valid category values
 */
const VALID_CATEGORIES = ['DEVELOPMENT', 'SECURITY', 'DATA_ANALYTICS', 'AI_ML', 'TESTING', 'INTEGRATION'] as const;

/**
 * Analyze skill content and suggest category and tags
 */
export async function analyzeSkillMetadata(
  skillBuffer: Buffer,
  skillName: string,
  skillDescription: string | null | undefined
): Promise<SkillMetadataResult> {
  const anthropic = getAnthropicClient();
  const { model } = getAIConfig();

  // Default result if AI is unavailable
  const defaultResult: SkillMetadataResult = {
    category: 'DEVELOPMENT',
    tags: [],
    confidence: 30,
  };

  if (!anthropic) {
    console.log(`${LOG_PREFIX}[Metadata] AI client not available, using defaults`);
    return defaultResult;
  }

  try {
    // Extract files for analysis
    const { mdFiles, scriptFiles } = await extractFilesForAnalysis(skillBuffer);

    // Build context from skill info
    const skillInfo = `Skill Name: ${skillName}
Skill Description: ${skillDescription || 'No description provided'}`;

    // Get SKILL.md content if available
    const skillMdContent = mdFiles.find(f => f.path === 'SKILL.md')?.content || '';
    const otherFilesContent = [...mdFiles.filter(f => f.path !== 'SKILL.md'), ...scriptFiles]
      .slice(0, 3)
      .map(f => `--- ${f.path} ---\n${f.content.slice(0, 2000)}`)
      .join('\n\n');

    const systemPrompt = `You are an expert at categorizing AI agent skills. Analyze the skill content and determine the most appropriate category and relevant tags.

Valid Categories:
- DEVELOPMENT: Code generation, programming tools, software development
- SECURITY: Security analysis, vulnerability detection, penetration testing
- DATA_ANALYTICS: Data processing, visualization, reporting, statistics
- AI_ML: Machine learning, AI model operations, LLM tools
- TESTING: Test automation, QA, validation, verification
- INTEGRATION: API integrations, webhooks, third-party services

Guidelines for tags:
- Use lowercase only
- 3-5 relevant tags
- Include technology names when relevant (e.g., "python", "react", "api")
- Include use case tags (e.g., "code-generation", "testing", "automation")
- Be specific and descriptive

Respond with ONLY a JSON object in this format:
{
  "category": "CATEGORY_NAME",
  "tags": ["tag1", "tag2", "tag3"],
  "confidence": 85
}`;

    const userPrompt = `Analyze this AI agent skill and categorize it:

${skillInfo}

${skillMdContent ? `--- SKILL.md ---\n${skillMdContent.slice(0, 3000)}` : ''}

${otherFilesContent ? `\n--- Other Files ---\n${otherFilesContent}` : ''}

Respond with the JSON categorization.`;

    console.log(`${LOG_PREFIX}[Metadata] Analyzing skill: ${skillName}`);

    const message = await anthropic.messages.create({
      model,
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse response
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    // Validate category
    const category = VALID_CATEGORIES.includes(parsed.category?.toUpperCase())
      ? parsed.category.toUpperCase() as SkillMetadataResult['category']
      : 'DEVELOPMENT';

    // Validate and clean tags
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t: unknown): t is string => typeof t === 'string')
          .map((t: string) => t.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'))
          .filter((t: string) => t.length > 0 && t.length < 30)
          .slice(0, 5)
      : [];

    console.log(`${LOG_PREFIX}[Metadata] Result: category=${category}, tags=${tags.join(',')}, confidence=${parsed.confidence || 70}`);

    return {
      category,
      tags,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
    };
  } catch (error) {
    console.error(`${LOG_PREFIX}[Metadata] Error:`, error);
    return defaultResult;
  }
}
