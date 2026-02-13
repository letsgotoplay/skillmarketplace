import { SecurityFinding, SecurityReport } from './scanner';

// Known vulnerable packages (simplified - in production, use a CVE database)
const KNOWN_VULNERABILITIES: Record<string, Array<{ versions: string; severity: 'critical' | 'high' | 'medium' | 'low'; description: string }>> = {
  'lodash': [
    { versions: '<4.17.21', severity: 'high', description: 'Prototype Pollution vulnerability' },
  ],
  'event-stream': [
    { versions: '*', severity: 'critical', description: 'Malicious package - contains crypto-stealing code' },
  ],
  'node-serialize': [
    { versions: '*', severity: 'critical', description: 'Remote code execution vulnerability' },
  ],
  'serialize-to-js': [
    { versions: '*', severity: 'critical', description: 'Arbitrary code execution vulnerability' },
  ],
};

/**
 * Parse package.json from skill
 */
export function parsePackageJson(content: string): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} | null {
  try {
    const pkg = JSON.parse(content);
    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
    };
  } catch {
    return null;
  }
}

/**
 * Check if version matches vulnerability range
 */
function isVulnerable(installedVersion: string, vulnerableRange: string): boolean {
  if (vulnerableRange === '*') return true;

  // Simple version comparison (in production, use semver library)
  if (vulnerableRange.startsWith('<')) {
    const minVersion = vulnerableRange.slice(1);
    return installedVersion < minVersion;
  }

  if (vulnerableRange.startsWith('>=')) {
    const minVersion = vulnerableRange.slice(2);
    return installedVersion >= minVersion;
  }

  return false;
}

/**
 * Scan dependencies for vulnerabilities
 */
export function scanDependencies(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
): SecurityFinding[] {
  const findings: SecurityFinding[] = [];

  const allDeps = { ...dependencies, ...devDependencies };

  for (const [name, version] of Object.entries(allDeps)) {
    const vulns = KNOWN_VULNERABILITIES[name];
    if (!vulns) continue;

    for (const vuln of vulns) {
      if (isVulnerable(version, vuln.versions)) {
        findings.push({
          severity: vuln.severity,
          category: 'Vulnerable Dependency',
          title: `Vulnerable Package: ${name}`,
          description: vuln.description,
          file: 'package.json',
          recommendation: `Update ${name} to a patched version or find an alternative`,
        });
      }
    }
  }

  return findings;
}

/**
 * Scan package.json for security issues
 */
export async function scanPackageJson(content: string): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];

  const parsed = parsePackageJson(content);
  if (!parsed) {
    findings.push({
      severity: 'medium',
      category: 'Configuration',
      title: 'Invalid package.json',
      description: 'Could not parse package.json',
      file: 'package.json',
      recommendation: 'Ensure package.json is valid JSON',
    });
    return findings;
  }

  // Check for vulnerable dependencies
  const depFindings = scanDependencies(parsed.dependencies, parsed.devDependencies);
  findings.push(...depFindings);

  // Check for suspicious scripts
  const content_lower = content.toLowerCase();
  if (content_lower.includes('curl') || content_lower.includes('wget')) {
    findings.push({
      severity: 'high',
      category: 'Suspicious Scripts',
      title: 'Network Command in Scripts',
      description: 'Found curl or wget in package scripts',
      file: 'package.json',
      recommendation: 'Review scripts for malicious behavior',
    });
  }

  return findings;
}
