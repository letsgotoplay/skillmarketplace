/**
 * GitHub URL Parser
 * Parses GitHub repository URLs and shorthands
 */

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
}

// GitHub URL patterns:
// - owner/repo
// - https://github.com/owner/repo
// - http://github.com/owner/repo

const GITHUB_SHORTHAND_REGEX = /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)$/;
const GITHUB_URL_REGEX = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)/;

/**
 * Parse a GitHub URL or shorthand
 * @param input - GitHub URL or owner/repo shorthand
 * @returns Parsed GitHub URL or null if invalid
 */
export function parseGitHubUrl(input: string): ParsedGitHubUrl | null {
  const trimmed = input.trim();

  // Try shorthand format: owner/repo
  const shorthandMatch = trimmed.match(GITHUB_SHORTHAND_REGEX);
  if (shorthandMatch) {
    return {
      owner: shorthandMatch[1],
      repo: shorthandMatch[2],
    };
  }

  // Try full URL format
  const urlMatch = trimmed.match(GITHUB_URL_REGEX);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2].split('/')[0], // Handle potential trailing paths
    };
  }

  return null;
}

/**
 * Check if a string looks like a GitHub URL or shorthand
 */
export function isGitHubUrl(input: string): boolean {
  return parseGitHubUrl(input) !== null;
}

/**
 * Build a GitHub repository URL from parsed components
 */
export function buildGitHubUrl(parsed: ParsedGitHubUrl): string {
  return `https://github.com/${parsed.owner}/${parsed.repo}`;
}

/**
 * Build a GitHub API URL for repository info
 */
export function buildGitHubApiUrl(parsed: ParsedGitHubUrl): string {
  return `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;
}

/**
 * Build a GitHub archive download URL
 */
export function buildGitHubArchiveUrl(parsed: ParsedGitHubUrl, branch: string): string {
  return `https://codeload.github.com/${parsed.owner}/${parsed.repo}/zip/refs/heads/${branch}`;
}
