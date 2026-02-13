import { prisma } from '@/lib/db';
import { readFile } from 'fs/promises';
import JSZip from 'jszip';

export interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

export interface SecurityReport {
  score: number;
  findings: SecurityFinding[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
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
 * Scan file content for security issues
 */
function scanContent(content: string, filePath: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const lines = content.split('\n');

  for (const { pattern, severity, category, title, description, recommendation } of DANGEROUS_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;

      findings.push({
        severity,
        category,
        title,
        description,
        file: filePath,
        line: lineNumber,
        recommendation,
      });
    }
  }

  return findings;
}

/**
 * Scan skill package for security issues
 */
export async function scanSkill(zipBuffer: Buffer): Promise<SecurityReport> {
  const findings: SecurityFinding[] = [];

  try {
    const zip = await JSZip.loadAsync(zipBuffer);

    for (const [filePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Only scan text-based files
      const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json', '.md', '.yaml', '.yml', '.sh'];
      const isTextFile = textExtensions.some((ext) => filePath.toLowerCase().endsWith(ext));

      if (!isTextFile) continue;

      try {
        const content = await zipEntry.async('string');
        const fileFindings = scanContent(content, filePath);
        findings.push(...fileFindings);
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
    };

    // Calculate security score (0-100)
    const score = calculateSecurityScore(summary);

    return {
      score,
      findings,
      summary,
    };
  } catch (error) {
    return {
      score: 0,
      findings: [
        {
          severity: 'critical',
          category: 'Scan Error',
          title: 'Failed to Scan Package',
          description: error instanceof Error ? error.message : 'Unknown error',
          recommendation: 'Ensure the skill package is a valid ZIP file',
        },
      ],
      summary: { critical: 1, high: 0, medium: 0, low: 0, info: 0 },
    };
  }
}

/**
 * Calculate security score based on findings
 */
export function calculateSecurityScore(summary: SecurityReport['summary']): number {
  let score = 100;

  // Deduct points based on severity
  score -= summary.critical * 25;
  score -= summary.high * 15;
  score -= summary.medium * 8;
  score -= summary.low * 3;
  // Info level doesn't deduct points

  return Math.max(0, Math.min(100, score));
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
      score: report.score,
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
