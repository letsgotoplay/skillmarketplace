import { prisma } from '@/lib/db';
import JSZip from 'jszip';
import { randomUUID } from 'crypto';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  severity: SeverityLevel;
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  lineEnd?: number;
  /** Code snippet showing the issue */
  codeSnippet?: string;
  recommendation: string;
  /** Source of the finding: 'pattern' or 'ai' */
  source: 'pattern' | 'ai';
}

export interface SecurityReport {
  /** Overall risk level based on most severe finding */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  analyzedFiles: number;
  analyzedAt: string;
}

// Dangerous patterns to detect in code
const DANGEROUS_PATTERNS = [
  {
    pattern: /eval\s*\(/gi,
    severity: 'high' as const,
    category: 'Code Injection',
    title: 'Use of eval()',
    description: 'eval() can execute arbitrary code and should be avoided',
    recommendation: 'Use safer alternatives like JSON.parse() for data parsing',
  },
  {
    pattern: /Function\s*\(/gi,
    severity: 'high' as const,
    category: 'Code Injection',
    title: 'Dynamic Function Creation',
    description: 'Creating functions from strings can lead to code injection',
    recommendation: 'Avoid creating functions from dynamic content',
  },
  {
    pattern: /exec\s*\(/gi,
    severity: 'critical' as const,
    category: 'Command Injection',
    title: 'Command Execution',
    description: 'exec() can execute system commands',
    recommendation: 'Use safer alternatives and validate all inputs',
  },
  {
    pattern: /spawn\s*\(/gi,
    severity: 'high' as const,
    category: 'Command Injection',
    title: 'Process Spawning',
    description: 'spawn() can execute system commands',
    recommendation: 'Validate and sanitize all inputs before spawning processes',
  },
  {
    pattern: /child_process/gi,
    severity: 'medium' as const,
    category: 'System Access',
    title: 'Child Process Import',
    description: 'Importing child_process module',
    recommendation: 'Ensure this is necessary and all usage is secure',
  },
  {
    pattern: /fetch\s*\(\s*['"`]https?:\/\//gi,
    severity: 'low' as const,
    category: 'Network Access',
    title: 'Hardcoded URL',
    description: 'Found hardcoded external URL',
    recommendation: 'Consider making URLs configurable and validate domains',
  },
  {
    pattern: /password\s*=\s*['"`][^'"`]+['"`]/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Hardcoded Password',
    description: 'Found hardcoded password in code',
    recommendation: 'Use environment variables or secure credential storage',
  },
  {
    pattern: /api[_-]?key\s*=\s*['"`][^'"`]+['"`]/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Hardcoded API Key',
    description: 'Found hardcoded API key in code',
    recommendation: 'Use environment variables for API keys',
  },
  {
    pattern: /secret\s*=\s*['"`][^'"`]+['"`]/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Hardcoded Secret',
    description: 'Found hardcoded secret in code',
    recommendation: 'Use secure secret management',
  },
  {
    pattern: /eval\s*\(\s*(atob|btoa)/gi,
    severity: 'critical' as const,
    category: 'Obfuscation',
    title: 'Obfuscated Code Execution',
    description: 'Found eval with base64 encoding - possible obfuscation',
    recommendation: 'Remove obfuscated code execution',
  },
  {
    pattern: /require\s*\(\s*['"`]\.\.\/\.\.\/\.\.\//gi,
    severity: 'high' as const,
    category: 'Path Traversal',
    title: 'Deep Path Traversal',
    description: 'Require with deep relative path detected',
    recommendation: 'Use proper module structure to avoid path traversal risks',
  },
  {
    pattern: /process\.env\.[A-Z_]+/gi,
    severity: 'info' as const,
    category: 'Environment Access',
    title: 'Environment Variable Access',
    description: 'Code accesses environment variables',
    recommendation: 'Ensure environment variable access is intentional and documented',
  },
];

/**
 * Extract code snippet around a line
 */
function extractCodeSnippet(
  content: string,
  lineNumber: number,
  contextLines: number = 3
): string {
  const lines = content.split('\n');
  const start = Math.max(0, lineNumber - contextLines - 1);
  const end = Math.min(lines.length, lineNumber + contextLines);

  return lines
    .slice(start, end)
    .map((line, idx) => {
      const lineNum = start + idx + 1;
      const marker = lineNum === lineNumber ? '>>>' : '   ';
      return `${marker} ${lineNum.toString().padStart(4, ' ')} | ${line}`;
    })
    .join('\n');
}

/**
 * Check if a line is inside a comment
 */
function isInComment(content: string, index: number): boolean {
  const beforeContent = content.substring(0, index);
  const lines = beforeContent.split('\n');
  const currentLine = lines[lines.length - 1] || '';

  // Check for single-line comment
  if (currentLine.trim().startsWith('//') || currentLine.trim().startsWith('#')) {
    return true;
  }

  // Check for multi-line comment (simplified)
  const lastOpenComment = beforeContent.lastIndexOf('/*');
  const lastCloseComment = beforeContent.lastIndexOf('*/');
  if (lastOpenComment > lastCloseComment && lastOpenComment !== -1) {
    return true;
  }

  return false;
}

/**
 * Scan file content for security issues
 */
function scanContent(content: string, filePath: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  for (const { pattern, severity, category, title, description, recommendation } of DANGEROUS_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Skip if in comment
      if (isInComment(content, match.index)) {
        continue;
      }

      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Extract code snippet
      const codeSnippet = extractCodeSnippet(content, lineNumber);

      findings.push({
        id: randomUUID(),
        severity,
        category,
        title,
        description,
        file: filePath,
        line: lineNumber,
        codeSnippet,
        recommendation,
        source: 'pattern',
      });
    }
  }

  return findings;
}

/**
 * Determine overall risk level based on findings
 */
function determineRiskLevel(summary: SecurityReport['summary']): 'low' | 'medium' | 'high' | 'critical' {
  if (summary.critical > 0) return 'critical';
  if (summary.high > 0) return 'high';
  if (summary.medium > 0) return 'medium';
  return 'low';
}

/**
 * Scan skill package for security issues
 */
export async function scanSkill(zipBuffer: Buffer): Promise<SecurityReport> {
  const findings: SecurityFinding[] = [];
  let analyzedFiles = 0;

  try {
    const zip = await JSZip.loadAsync(zipBuffer);

    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Only scan text-based files
      const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json', '.yaml', '.yml', '.sh'];
      const isTextFile = textExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));

      if (!isTextFile) continue;

      try {
        const content = await zipEntry.async('string');
        const fileFindings = scanContent(content, filePath);
        findings.push(...fileFindings);
        analyzedFiles++;
      } catch {
        // Skip binary or unreadable files
      }
    }

    // Calculate summary
    const summary = {
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
      info: findings.filter((f) => f.severity === 'info').length,
      total: findings.length,
    };

    return {
      riskLevel: determineRiskLevel(summary),
      findings,
      summary,
      analyzedFiles,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      riskLevel: 'critical',
      findings: [
        {
          id: randomUUID(),
          severity: 'critical',
          category: 'Scan Error',
          title: 'Failed to Scan Package',
          description: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Ensure the skill package is a valid ZIP file',
          source: 'pattern',
        },
      ],
      summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0, total: 1 },
      analyzedFiles: 0,
      analyzedAt: new Date().toISOString(),
    };
  }
}

/**
 * Store security scan results in database
 */
export async function storeSecurityScan(
  skillVersionId: string,
  report: SecurityReport
): Promise<void> {
  await prisma.securityScan.create({
    data: {
      skillVersionId,
      status: 'COMPLETED',
      // Keep score for backward compatibility, but it's derived from riskLevel now
      score: report.riskLevel === 'critical' ? 0 :
             report.riskLevel === 'high' ? 25 :
             report.riskLevel === 'medium' ? 50 : 75,
      reportJson: JSON.parse(JSON.stringify(report)),
    },
  });
}

/**
 * Get security scan for a skill version
 */
export async function getSecurityScan(skillVersionId: string) {
  return prisma.securityScan.findFirst({
    where: { skillVersionId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get combined security report (pattern + AI) for a skill version
 */
export async function getCombinedSecurityReport(skillVersionId: string): Promise<{
  patternScan: SecurityReport | null;
  aiReport: Record<string, unknown> | null;
  combinedRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
}> {
  const [scan, skillVersion] = await Promise.all([
    getSecurityScan(skillVersionId),
    prisma.skillVersion.findUnique({
      where: { id: skillVersionId },
      select: { aiSecurityReport: true, aiSecurityAnalyzed: true },
    }),
  ]);

  const patternScan = scan?.reportJson as SecurityReport | null;
  const aiReport = skillVersion?.aiSecurityReport as Record<string, unknown> | null;
  const aiRiskLevel = (aiReport?.riskLevel as string) || undefined;

  // Determine combined risk level (take the higher one)
  const riskLevels = ['low', 'medium', 'high', 'critical'] as const;
  let combinedRiskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown' = 'unknown';

  if (patternScan || aiRiskLevel) {
    const patternLevel = patternScan?.riskLevel;
    const patternIndex = patternLevel ? riskLevels.indexOf(patternLevel) : -1;
    const aiIndex = aiRiskLevel ? riskLevels.indexOf(aiRiskLevel as typeof riskLevels[number]) : -1;

    const maxIndex = Math.max(patternIndex, aiIndex);
    if (maxIndex >= 0) {
      combinedRiskLevel = riskLevels[maxIndex];
    }
  }

  return {
    patternScan,
    aiReport,
    combinedRiskLevel,
  };
}
