import Anthropic from '@anthropic-ai/sdk';
import JSZip from 'jszip';
import { randomUUID } from 'crypto';
import type { ParsedSkill } from '@/lib/skills/types';
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
 */
interface FileForAnalysis {
  path: string;
  content: string;
  size: number;
  type: 'md' | 'script' | 'other';
}

// Get AI configuration from environment
function getAIConfig() {
  const apiKey = env.AI_SECURITY_API_KEY || process.env.ANTHROPIC_API_KEY;
  const baseUrl = env.AI_SECURITY_BASE_URL || 'https://api.anthropic.com';
  const model = env.AI_SECURITY_MODEL || 'claude-sonnet-4-20250514';

  return { apiKey, baseUrl, model };
}

// Initialize Anthropic client with configurable endpoint
function createAnthropicClient(): Anthropic | null {
  const { apiKey, baseUrl } = getAIConfig();

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
 * Get the configured model name
 */
export function getConfiguredModel(): string {
  return getAIConfig().model;
}

/**
 * Determine file type based on extension
 */
function getFileType(path: string): 'md' | 'script' | 'other' {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'md') return 'md';
  if (['py', 'sh', 'js', 'ts', 'jsx', 'tsx', 'bash', 'zsh'].includes(ext || '')) return 'script';
  return 'other';
}

/**
 * Extract files from skill for analysis, categorized by type
 */
async function extractFilesForAnalysis(
  skillBuffer: Buffer,
  parsedSkill?: ParsedSkill
): Promise<{ mdFiles: FileForAnalysis[]; scriptFiles: FileForAnalysis[]; otherFiles: FileForAnalysis[] }> {
  const mdFiles: FileForAnalysis[] = [];
  const scriptFiles: FileForAnalysis[] = [];
  const otherFiles: FileForAnalysis[] = [];

  const zip = await JSZip.loadAsync(skillBuffer);

  const textExtensions = [
    '.md', '.markdown',
    '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
    '.py', '.pyw',
    '.sh', '.bash', '.zsh',
    '.json', '.yaml', '.yml',
  ];

  const maxFileSize = 100 * 1024; // 100KB per file max
  const maxTotalSize = 500 * 1024; // 500KB total max

  let totalSize = 0;

  // First, add SKILL.md from parsed skill if available
  if (parsedSkill?.skillMd) {
    const skillMdContent = parsedSkill.skillMd;
    mdFiles.unshift({
      path: 'SKILL.md',
      content: skillMdContent,
      size: skillMdContent.length,
      type: 'md',
    });
    totalSize += skillMdContent.length;
  }

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    // Skip SKILL.md if already added
    if (path === 'SKILL.md' && parsedSkill?.skillMd) continue;

    const ext = '.' + path.split('.').pop()?.toLowerCase();
    if (!textExtensions.includes(ext)) continue;

    try {
      const content = await zipEntry.async('string');
      const size = content.length;

      // Skip large files
      if (size > maxFileSize) {
        continue;
      }

      // Check total size limit
      if (totalSize + size > maxTotalSize) {
        break;
      }

      totalSize += size;
      const fileType = getFileType(path);
      const file: FileForAnalysis = { path, content, size, type: fileType };

      if (fileType === 'md') {
        mdFiles.push(file);
      } else if (fileType === 'script') {
        scriptFiles.push(file);
      } else {
        otherFiles.push(file);
      }
    } catch {
      // Skip binary or unreadable files
    }
  }

  return { mdFiles, scriptFiles, otherFiles };
}

/**
 * Parse AI response into structured report
 */
function parseAIResponse(response: string, modelUsed: string): AISecurityReport {
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

    return {
      riskLevel: parsed.riskLevel || 'medium',
      threats,
      recommendations: parsed.recommendations || [],
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      analyzedAt: new Date().toISOString(),
      modelUsed,
      summary: parsed.summary,
      blockExecution: hasBlockingFinding,
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
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
 * Analyze a skill package using AI for semantic security analysis
 */
export async function analyzeWithAI(
  skillBuffer: Buffer,
  parsedSkill?: ParsedSkill
): Promise<AISecurityReport> {
  const anthropic = getAnthropicClient();
  const { model } = getAIConfig();

  // Check if AI is available
  if (!anthropic) {
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
    const { mdFiles, scriptFiles } = await extractFilesForAnalysis(skillBuffer, parsedSkill);

    if (mdFiles.length === 0 && scriptFiles.length === 0) {
      return {
        riskLevel: 'low',
        threats: [],
        recommendations: ['No analyzable files found in skill package'],
        confidence: 90,
        analyzedAt: new Date().toISOString(),
        modelUsed: model,
        blockExecution: false,
      };
    }

    // Build the prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildSecurityAnalysisPrompt(
      mdFiles.map(f => ({ path: f.path, content: f.content })),
      scriptFiles.map(f => ({ path: f.path, content: f.content }))
    );

    // Call AI API
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

    // Extract response text
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    // Parse and return the report
    return parseAIResponse(responseText, model);
  } catch (error) {
    console.error('AI security analysis error:', error);

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

  return `Risk Level: ${report.riskLevel.toUpperCase()} | ` +
    `Critical: ${severityCounts.critical}, High: ${severityCounts.high}, ` +
    `Medium: ${severityCounts.medium}, Low: ${severityCounts.low} | ` +
    `Confidence: ${report.confidence}%${blockStatus}`;
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
  skillDescription: string | null | undefined,
  parsedSkill?: ParsedSkill
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
    console.log('[MetadataAnalysis] AI client not available, using defaults');
    return defaultResult;
  }

  try {
    // Extract files for analysis
    const { mdFiles, scriptFiles } = await extractFilesForAnalysis(skillBuffer, parsedSkill);

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

    return {
      category,
      tags,
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
    };
  } catch (error) {
    console.error('[MetadataAnalysis] Error:', error);
    return defaultResult;
  }
}
