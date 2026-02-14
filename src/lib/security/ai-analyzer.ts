import Anthropic from '@anthropic-ai/sdk';
import JSZip from 'jszip';
import { randomUUID } from 'crypto';
import type { ParsedSkill } from '@/lib/skills/types';
import type { SecurityFinding } from './scanner';

/**
 * AI Security Analysis Report
 */
export interface AISecurityReport {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: SecurityFinding[]; // Use same format as pattern scan
  recommendations: string[];
  confidence: number;
  analyzedAt: string;
  modelUsed: string;
}

/**
 * Individual threat detected by AI (legacy format for parsing)
 */
interface AIThreatRaw {
  type: string;
  description: string;
  file?: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  remediation: string;
}

/**
 * File content for analysis
 */
interface FileForAnalysis {
  path: string;
  content: string;
  size: number;
}

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  : null;

/**
 * Check if AI analysis is available
 */
export function isAIAnalysisAvailable(): boolean {
  return anthropic !== null;
}

/**
 * Extract text files from skill for analysis
 */
async function extractFilesForAnalysis(
  skillBuffer: Buffer,
  parsedSkill?: ParsedSkill
): Promise<FileForAnalysis[]> {
  const files: FileForAnalysis[] = [];
  const zip = await JSZip.loadAsync(skillBuffer);

  const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json', '.md', '.yaml', '.yml', '.sh'];
  const maxFileSize = 100 * 1024; // 100KB per file max
  const maxTotalSize = 500 * 1024; // 500KB total max

  let totalSize = 0;

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

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
      files.push({ path, content, size });
    } catch {
      // Skip binary or unreadable files
    }
  }

  // Add SKILL.md content from parsed skill if available
  if (parsedSkill?.skillMd && !files.some(f => f.path === 'SKILL.md')) {
    files.unshift({
      path: 'SKILL.md',
      content: parsedSkill.skillMd,
      size: parsedSkill.skillMd.length,
    });
  }

  return files;
}

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt(files: FileForAnalysis[]): string {
  const fileContents = files
    .map(f => `--- FILE: ${f.path} ---\n${f.content}\n--- END FILE: ${f.path} ---\n`)
    .join('\n');

  return `You are a security expert analyzing an AI agent skill package for potential security threats. Analyze the following files and identify any security concerns.

Focus on:
1. Code injection vulnerabilities (eval, Function constructor, exec, spawn with user input)
2. Credential exposure (hardcoded API keys, passwords, secrets)
3. Data exfiltration risks (network calls to suspicious endpoints, data logging)
4. Malicious patterns (obfuscation, suspicious file operations, privilege escalation)
5. Supply chain risks (suspicious dependencies, external resource loading)
6. Privacy concerns (collecting user data without consent)

For each threat found, provide:
- The type of threat
- A clear description of the risk
- The file and approximate line number (if applicable)
- Severity level (low, medium, high, critical)
- A remediation recommendation

After analyzing, provide:
1. An overall risk level (low/medium/high/critical)
2. A list of specific threats
3. General recommendations for improving security
4. A confidence score (0-100) for your analysis

Respond in the following JSON format:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "threats": [
    {
      "type": "threat category",
      "description": "what the issue is",
      "file": "file path or null",
      "line": line number or null,
      "severity": "low" | "medium" | "high" | "critical",
      "remediation": "how to fix it"
    }
  ],
  "recommendations": ["general recommendation 1", "general recommendation 2"],
  "confidence": 0-100
}

Files to analyze:

${fileContents}`;
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

    const parsed = JSON.parse(jsonStr);

    return {
      riskLevel: parsed.riskLevel || 'medium',
      threats: (parsed.threats || []).map((t: AIThreatRaw): SecurityFinding => ({
        id: randomUUID(),
        severity: t.severity || 'medium',
        category: t.type || 'Unknown',
        title: t.type || 'Security Issue',
        description: t.description || '',
        file: t.file || undefined,
        line: t.line || undefined,
        recommendation: t.remediation || 'Review and address this security concern',
        source: 'ai' as const,
      })),
      recommendations: parsed.recommendations || [],
      confidence: Math.min(100, Math.max(0, parsed.confidence || 70)),
      analyzedAt: new Date().toISOString(),
      modelUsed,
    };
  } catch {
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
          description: 'AI security analysis is not configured. Set ANTHROPIC_API_KEY environment variable.',
          recommendation: 'Configure ANTHROPIC_API_KEY to enable AI-powered security analysis',
          source: 'ai',
        },
      ],
      recommendations: ['Enable AI analysis for better security detection'],
      confidence: 30,
      analyzedAt: new Date().toISOString(),
      modelUsed: 'none',
    };
  }

  try {
    // Extract files for analysis
    const files = await extractFilesForAnalysis(skillBuffer, parsedSkill);

    if (files.length === 0) {
      return {
        riskLevel: 'low',
        threats: [],
        recommendations: ['No analyzable files found in skill package'],
        confidence: 90,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'claude-3-sonnet',
      };
    }

    // Build the prompt
    const prompt = buildAnalysisPrompt(files);

    // Call Claude API
    const model = 'claude-sonnet-4-20250514';
    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
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

  return `Risk Level: ${report.riskLevel.toUpperCase()} | ` +
    `Critical: ${severityCounts.critical}, High: ${severityCounts.high}, ` +
    `Medium: ${severityCounts.medium}, Low: ${severityCounts.low} | ` +
    `Confidence: ${report.confidence}%`;
}
