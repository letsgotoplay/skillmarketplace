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

// Dangerous patterns to detect in code and markdown files
const DANGEROUS_PATTERNS = [
  // ===== Code Injection Patterns =====
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

  // ===== Credential Patterns =====
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
    pattern: /token\s*=\s*['"`][^'"`]+['"`]/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Hardcoded Token',
    description: 'Found hardcoded token in code',
    recommendation: 'Use environment variables for tokens',
  },
  {
    pattern: /bearer\s+[a-zA-Z0-9_-]+/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Bearer Token Exposure',
    description: 'Found bearer token in code',
    recommendation: 'Remove hardcoded bearer tokens',
  },
  {
    pattern: /aws_access_key_id\s*=\s*[A-Z0-9]{16,}/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'AWS Access Key',
    description: 'Found AWS access key ID',
    recommendation: 'Use IAM roles or environment variables',
  },
  {
    pattern: /aws_secret_access_key\s*=\s*[a-zA-Z0-9/+=]{30,}/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'AWS Secret Key',
    description: 'Found AWS secret access key',
    recommendation: 'Use IAM roles or environment variables',
  },
  {
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/gi,
    severity: 'critical' as const,
    category: 'Credentials',
    title: 'Private Key Exposure',
    description: 'Found embedded private key',
    recommendation: 'Never include private keys in code or documentation',
  },

  // ===== Network and URL Patterns =====
  {
    pattern: /fetch\s*\(\s*['"`]https?:\/\//gi,
    severity: 'low' as const,
    category: 'Network Access',
    title: 'Hardcoded URL',
    description: 'Found hardcoded external URL',
    recommendation: 'Consider making URLs configurable and validate domains',
  },
  {
    pattern: /curl\s+.*\|\s*(bash|sh|zsh)/gi,
    severity: 'critical' as const,
    category: 'Remote Code Execution',
    title: 'curl | bash Pattern',
    description: 'Remote code execution pattern detected',
    recommendation: 'Never pipe curl output directly to shell',
  },
  {
    pattern: /wget\s+.*\|\s*(bash|sh|zsh)/gi,
    severity: 'critical' as const,
    category: 'Remote Code Execution',
    title: 'wget | bash Pattern',
    description: 'Remote code execution pattern detected',
    recommendation: 'Never pipe wget output directly to shell',
  },

  // ===== Obfuscation Patterns =====
  {
    pattern: /eval\s*\(\s*(atob|btoa)/gi,
    severity: 'critical' as const,
    category: 'Obfuscation',
    title: 'Obfuscated Code Execution',
    description: 'Found eval with base64 encoding - possible obfuscation',
    recommendation: 'Remove obfuscated code execution',
  },
  {
    pattern: /atob\s*\(/gi,
    severity: 'medium' as const,
    category: 'Obfuscation',
    title: 'Base64 Decoding',
    description: 'Found base64 decoding - could be used for obfuscation',
    recommendation: 'Verify base64 usage is legitimate',
  },

  // ===== Path Traversal Patterns =====
  {
    pattern: /require\s*\(\s*['"`]\.\.\/\.\.\/\.\.\//gi,
    severity: 'high' as const,
    category: 'Path Traversal',
    title: 'Deep Path Traversal',
    description: 'Require with deep relative path detected',
    recommendation: 'Use proper module structure to avoid path traversal risks',
  },
  {
    pattern: /\.\.\/\.\.\/\.\./g,
    severity: 'high' as const,
    category: 'Path Traversal',
    title: 'Path Traversal Pattern',
    description: 'Potential path traversal pattern detected',
    recommendation: 'Validate and sanitize file paths',
  },

  // ===== System Access Patterns =====
  {
    pattern: /process\.env\.[A-Z_]+/gi,
    severity: 'info' as const,
    category: 'Environment Access',
    title: 'Environment Variable Access',
    description: 'Code accesses environment variables',
    recommendation: 'Ensure environment variable access is intentional and documented',
  },
  {
    pattern: /\/etc\/(passwd|shadow|hosts)/gi,
    severity: 'critical' as const,
    category: 'System Access',
    title: 'Sensitive System File Access',
    description: 'Attempt to access sensitive system files',
    recommendation: 'Never access system credential files',
  },
  {
    pattern: /~\/\.ssh\//gi,
    severity: 'critical' as const,
    category: 'System Access',
    title: 'SSH Key Access',
    description: 'Attempt to access SSH keys',
    recommendation: 'Never access user SSH keys',
  },
  {
    pattern: /~\/\.aws\//gi,
    severity: 'critical' as const,
    category: 'System Access',
    title: 'AWS Credentials Access',
    description: 'Attempt to access AWS credentials',
    recommendation: 'Never access AWS credential files',
  },

  // ===== Destructive Operation Patterns =====
  {
    pattern: /rm\s+-rf\s+\//gi,
    severity: 'critical' as const,
    category: 'Destructive Operations',
    title: 'Destructive rm Command',
    description: 'rm -rf with root path detected',
    recommendation: 'Remove destructive file operations',
  },
  {
    pattern: /rm\s+-rf\s+\*/gi,
    severity: 'critical' as const,
    category: 'Destructive Operations',
    title: 'Destructive rm Command',
    description: 'rm -rf with wildcard detected',
    recommendation: 'Remove destructive file operations',
  },
  {
    pattern: /chmod\s+777/gi,
    severity: 'high' as const,
    category: 'Privilege Escalation',
    title: 'World-Writable Permission',
    description: 'chmod 777 makes files world-writable',
    recommendation: 'Use more restrictive permissions',
  },
  {
    pattern: /kill\s+-9/gi,
    severity: 'high' as const,
    category: 'Destructive Operations',
    title: 'Force Kill Command',
    description: 'Force kill command detected',
    recommendation: 'Ensure process termination is intentional',
  },

  // ===== MD-Specific Security Patterns =====
  {
    pattern: /allowed-paths\s*:\s*\/\//gi,
    severity: 'high' as const,
    category: 'Excessive Permissions',
    title: 'Root Path Access',
    description: 'allowed-paths grants access to entire filesystem',
    recommendation: 'Restrict allowed-paths to specific directories',
  },
  {
    pattern: /allowed-paths\s*:\s*\//gi,
    severity: 'high' as const,
    category: 'Excessive Permissions',
    title: 'Root Path Access',
    description: 'allowed-paths grants root access',
    recommendation: 'Restrict allowed-paths to specific directories',
  },
  {
    pattern: /allowed-tools\s*:\s*(All|\*|all)/gi,
    severity: 'high' as const,
    category: 'Excessive Permissions',
    title: 'Unrestricted Tool Access',
    description: 'allowed-tools grants access to all tools',
    recommendation: 'Specify only required tools',
  },
  {
    pattern: /ignore\s+(all\s+)?(security|permission|restriction)/gi,
    severity: 'critical' as const,
    category: 'Security Bypass',
    title: 'Security Bypass Instruction',
    description: 'Instruction to ignore security measures detected',
    recommendation: 'Remove security bypass instructions',
  },
  {
    pattern: /bypass\s+(security|permission|auth)/gi,
    severity: 'critical' as const,
    category: 'Security Bypass',
    title: 'Security Bypass Instruction',
    description: 'Instruction to bypass security detected',
    recommendation: 'Remove security bypass instructions',
  },
  {
    pattern: /disable\s+(security|validation|check)/gi,
    severity: 'critical' as const,
    category: 'Security Bypass',
    title: 'Security Disable Instruction',
    description: 'Instruction to disable security detected',
    recommendation: 'Remove security disable instructions',
  },

  // ===== Persistence Patterns =====
  {
    pattern: /crontab\s+-e/gi,
    severity: 'high' as const,
    category: 'Persistence',
    title: 'Cron Job Modification',
    description: 'Modifying cron jobs detected',
    recommendation: 'Avoid adding persistent cron jobs',
  },
  {
    pattern: /launchctl\s+load/gi,
    severity: 'high' as const,
    category: 'Persistence',
    title: 'Launch Agent Installation',
    description: 'Installing launch agents detected',
    recommendation: 'Avoid installing persistent launch agents',
  },
  {
    pattern: /systemctl\s+enable/gi,
    severity: 'high' as const,
    category: 'Persistence',
    title: 'Systemd Service Enable',
    description: 'Enabling systemd services detected',
    recommendation: 'Avoid enabling persistent services',
  },

  // ===== SSRF Patterns =====
  {
    pattern: /169\.254\.(169|170)\./gi,
    severity: 'critical' as const,
    category: 'SSRF',
    title: 'Cloud Metadata Access',
    description: 'Attempt to access cloud metadata service',
    recommendation: 'Block access to metadata endpoints',
  },
  {
    pattern: /metadata\.google/gi,
    severity: 'critical' as const,
    category: 'SSRF',
    title: 'GCP Metadata Access',
    description: 'Attempt to access GCP metadata',
    recommendation: 'Block access to metadata endpoints',
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
 * Placeholder patterns that indicate example/fake credentials
 */
const PLACEHOLDER_PATTERNS = [
  /^token\d+$/i,                    // token123, token456
  /^xxx+$/i,                        // xxx, xxxx
  /^placeholder$/i,                 // placeholder
  /^sample[_-]?(key|token)?$/i,     // sample, sample_key, sample-token
  /^dummy[_-]?(key|token)?$/i,      // dummy, dummy_key, dummy-token
  /^test[_-]?(key|token)?$/i,       // test, test_key, test-token
  /^your[_-].*[_-]here$/i,          // your_token_here, your_key_here
  /^<[^>]+>$/,                      // <token>, <api_key>, <your-key>
  /^\[[^\]]+\]$/,                   // [token], [your-key]
  /^sk-test/i,                      // sk-test... (fake OpenAI keys)
  /^sk-dummy/i,                     // sk-dummy...
  /^AKIAIOSFODNN7EXAMPLE$/i,        // AWS example key
  /^wJalrXUtnFEMI\/K7MDENG\/bPxRfiCYEXAMPLEKEY$/i, // AWS example secret
  /^fake[_-]/i,                     // fake_key, fake-token
  /^example[_-]/i,                  // example_key, example-token
  /^abc123$/i,                      // common placeholder
  /^123456$/i,                      // common placeholder
  /^password123$/i,                 // common example password
  /^changeme$/i,                    // common placeholder
  /^insert[_-]?(your)?[_-]?(key|token|password)$/i, // insert_your_key
];

/**
 * Check if matched value looks like a placeholder/example
 */
function isPlaceholderValue(matchedValue: string): boolean {
  const value = matchedValue.trim();

  // Check against placeholder patterns
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if position is inside a markdown code block (``` ... ```)
 */
function isInMarkdownCodeBlock(content: string, index: number): boolean {
  const beforeContent = content.substring(0, index);
  const afterContent = content.substring(index);

  // Count code block markers before the position
  const codeBlockStarts = (beforeContent.match(/```/g) || []).length;

  // If odd number of markers before, we're inside a code block
  if (codeBlockStarts % 2 === 1) {
    // Verify there's a closing marker after
    const closingMarker = afterContent.indexOf('```');
    if (closingMarker !== -1) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the line is in an example/documentation context
 */
function isInExampleContext(content: string, index: number): boolean {
  const beforeContent = content.substring(0, index);
  const lines = beforeContent.split('\n');
  const currentLine = lines[lines.length - 1] || '';

  // Check current line for example indicators
  const examplePatterns = [
    /^[\s]*(example|e\.g\.|for example|usage|sample)[:：]?\s*/i,
    /```[\s]*\w*$/,  // End of code block start
    /^\s*#\s*(example|usage|sample)/i,  // Comment with example
    /^\s*\/\/\s*(example|usage|sample)/i,  // JS comment with example
    /^\s*\*\s*(example|usage|sample)/i,  // JSDoc style
    /as\s+(shown\s+)?(below|follows)/i,
    /replace\s+(with\s+)?(your|the)\s+(key|token|secret)/i,
  ];

  for (const pattern of examplePatterns) {
    if (pattern.test(currentLine)) {
      return true;
    }
  }

  // Check previous 2 lines for example context
  for (let i = 2; i <= 3; i++) {
    const prevLine = lines[lines.length - i] || '';
    for (const pattern of examplePatterns) {
      if (pattern.test(prevLine)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if the position is in a documentation/reference section
 */
function isInDocumentationSection(content: string, index: number): boolean {
  const beforeContent = content.substring(0, index);
  const lines = beforeContent.split('\n');
  const currentLine = lines[lines.length - 1] || '';

  // Documentation section headers
  const docSectionPatterns = [
    /^#+\s*(reference|references|documentation|docs|example|examples|usage|configuration|config)/i,
    /^[\s]*[-*]\s*\[.*\]\(.*\)/,  // Markdown links in lists
    /^[\s]*\|.*\|/,  // Table rows
    /```\s*(bash|shell|json|yaml|yml|javascript|typescript|python)\s*$/i,  // Code blocks with language
  ];

  // Check last 10 lines for section headers
  for (let i = 1; i <= 10 && lines.length - i >= 0; i++) {
    const line = lines[lines.length - i] || '';
    for (const pattern of docSectionPatterns) {
      if (pattern.test(line)) {
        return true;
      }
    }
  }

  // Check if line looks like documentation
  const docLinePatterns = [
    /^\s*>\s*/,  // Blockquote
    /^\s*\*\s+.*:\s*$/,  // Definition list
    /`[^`]+`/,  // Inline code
  ];

  for (const pattern of docLinePatterns) {
    if (pattern.test(currentLine)) {
      // Only consider it documentation if also has example indicators
      if (/example|sample|your|placeholder|token\d+/i.test(currentLine)) {
        return true;
      }
    }
  }

  return false;
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
 * Check if a finding should be skipped due to context (false positive prevention)
 */
function shouldSkipFinding(content: string, match: RegExpExecArray): boolean {
  // Skip if in comment
  if (isInComment(content, match.index)) {
    return true;
  }

  // Skip if in markdown code block
  if (isInMarkdownCodeBlock(content, match.index)) {
    return true;
  }

  // Skip if in example context
  if (isInExampleContext(content, match.index)) {
    return true;
  }

  // Skip if in documentation section
  if (isInDocumentationSection(content, match.index)) {
    return true;
  }

  // Skip if matched value is a placeholder
  const matchedValue = match[0] || '';
  if (isPlaceholderValue(matchedValue)) {
    return true;
  }

  return false;
}

/**
 * Scan file content for security issues
 */
function scanContent(content: string, filePath: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  // Track seen findings to prevent duplicates (file + line + category + title)
  const seenFindings = new Set<string>();

  for (const { pattern, severity, category, title, description, recommendation } of DANGEROUS_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Skip if in a context that indicates false positive
      if (shouldSkipFinding(content, match)) {
        continue;
      }

      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Create a unique key for deduplication
      const findingKey = `${filePath}:${lineNumber}:${category}:${title}`;

      // Skip if we've already found this exact issue on this line
      if (seenFindings.has(findingKey)) {
        continue;
      }
      seenFindings.add(findingKey);

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
 * Calculate security score from summary (for backward compatibility)
 * Score is 0-100, with deductions based on severity
 */
export function calculateSecurityScore(summary: SecurityReport['summary']): number {
  let score = 100;
  score -= summary.critical * 25;
  score -= summary.high * 15;
  score -= summary.medium * 8;
  score -= summary.low * 3;
  // info level doesn't affect score
  return Math.max(0, score);
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

      // Only scan text-based files (including .md for security checks)
      const textExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.json', '.yaml', '.yml', '.sh', '.md', '.markdown'];
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
