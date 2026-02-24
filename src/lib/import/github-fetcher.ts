/**
 * GitHub Repository Fetcher
 * Downloads repositories and discovers skills
 */

import JSZip from 'jszip';
import {
  parseGitHubUrl,
  buildGitHubApiUrl,
  buildGitHubArchiveUrl,
  buildGitHubUrl,
} from './url-parser';
import { parseSkillMetadata } from '../skills/validation';
import type { SkillMetadata } from '../skills/types';

// Allowed domains for SSRF protection
const ALLOWED_DOMAINS = ['github.com', 'api.github.com', 'codeload.github.com'];

// Timeout for GitHub API requests (30 seconds)
const REQUEST_TIMEOUT = 30000;

// Maximum repository size to download (50MB)
const MAX_REPO_SIZE = 50 * 1024 * 1024;

// Standard skill directories and files to keep
const KEEP_PATTERNS = [
  /^SKILL\.md$/i,
  /^scripts\//,
  /^references\//,
  /^assets\//,
  /^LICENSE$/i,
  /\.md$/i,            // Keep all markdown files (includes README.md, SKILL.md, etc.)
];

// Patterns to always filter out
const FILTER_PATTERNS = [
  /^\.git\//,
  /^\.github\//,
  /^\.gitignore$/i,
  /^node_modules\//,
  /^package(-lock)?\.json$/i,
  /^pnpm-lock\.yaml$/i,
  /^yarn\.lock$/i,
  /^tsconfig\.json$/i,
  /^jest\.config\./i,
  /^\.env/i,
  /\.config\.(js|ts|mjs|cjs)$/i,
];

// Custom error types
export class GitHubError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_URL' | 'NOT_FOUND' | 'PRIVATE' | 'UNREACHABLE' | 'TIMEOUT' | 'DOWNLOAD_FAILED' | 'NO_SKILL'
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  defaultBranch: string;
  url: string;
}

export interface DiscoveredSkill {
  path: string; // Relative path from repo root (empty string for root)
  name: string;
  description: string;
  metadata: SkillMetadata;
}

export interface ScanResult {
  repoInfo: GitHubRepoInfo;
  skills: DiscoveredSkill[];
}

/**
 * Fetch with timeout and error handling
 */
async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'SkillHub-Import/1.0',
        ...options?.headers,
      },
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GitHubError('GitHub API request timed out', 'TIMEOUT');
    }
    // Check for network errors
    const errorCode = (error as any)?.cause?.code;
    if (errorCode === 'ENOTFOUND' || errorCode === 'ECONNREFUSED') {
      throw new GitHubError('Unable to connect to GitHub', 'UNREACHABLE');
    }
    throw new GitHubError(
      `Failed to fetch from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNREACHABLE'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Verify repository exists and is public
 */
export async function verifyGitHubRepo(input: string): Promise<GitHubRepoInfo> {
  const parsed = parseGitHubUrl(input);
  if (!parsed) {
    throw new GitHubError('Invalid GitHub URL format', 'INVALID_URL');
  }

  const apiUrl = buildGitHubApiUrl(parsed);

  // Validate domain for SSRF protection
  const url = new URL(apiUrl);
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    throw new GitHubError('Invalid domain - only GitHub.com is allowed', 'INVALID_URL');
  }

  const response = await fetchWithTimeout(apiUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (response.status === 404) {
    throw new GitHubError('Repository not found', 'NOT_FOUND');
  }

  if (response.status === 401 || response.status === 403) {
    throw new GitHubError('Only public repositories can be imported', 'PRIVATE');
  }

  if (!response.ok) {
    throw new GitHubError(`GitHub API error: ${response.status}`, 'UNREACHABLE');
  }

  const data = await response.json();

  if (data.private) {
    throw new GitHubError('Only public repositories can be imported', 'PRIVATE');
  }

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    defaultBranch: data.default_branch || 'main',
    url: buildGitHubUrl(parsed),
  };
}

/**
 * Download repository as ZIP buffer
 */
async function downloadRepoArchive(repoInfo: GitHubRepoInfo): Promise<Buffer> {
  const archiveUrl = buildGitHubArchiveUrl(
    { owner: repoInfo.owner, repo: repoInfo.repo },
    repoInfo.defaultBranch
  );

  // Validate domain for SSRF protection
  const url = new URL(archiveUrl);
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    throw new GitHubError('Invalid domain', 'INVALID_URL');
  }

  const response = await fetchWithTimeout(archiveUrl);

  if (!response.ok) {
    if (response.status === 404) {
      throw new GitHubError(`Branch '${repoInfo.defaultBranch}' not found`, 'NOT_FOUND');
    }
    throw new GitHubError(`Failed to download repository: ${response.status}`, 'DOWNLOAD_FAILED');
  }

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_REPO_SIZE) {
    throw new GitHubError(
      `Repository too large (${Math.round(parseInt(contentLength) / 1024 / 1024)}MB). Maximum size is 50MB.`,
      'DOWNLOAD_FAILED'
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_REPO_SIZE) {
    throw new GitHubError(
      `Repository too large (${Math.round(buffer.length / 1024 / 1024)}MB). Maximum size is 50MB.`,
      'DOWNLOAD_FAILED'
    );
  }

  return buffer;
}

/**
 * Check if a file path should be kept
 */
function shouldKeepFile(path: string): boolean {
  // First check if it matches any filter pattern
  for (const pattern of FILTER_PATTERNS) {
    if (pattern.test(path)) {
      return false;
    }
  }
  // Then check if it matches any keep pattern
  for (const pattern of KEEP_PATTERNS) {
    if (pattern.test(path)) {
      return true;
    }
  }
  return false;
}

/**
 * Scan repository ZIP for skills
 * Returns list of discovered skills with their paths
 */
export async function scanRepoForSkills(input: string): Promise<ScanResult> {
  // Verify repo is public
  const repoInfo = await verifyGitHubRepo(input);

  // Download repo archive
  const archiveBuffer = await downloadRepoArchive(repoInfo);

  // Load ZIP
  const zip = await JSZip.loadAsync(archiveBuffer);

  // GitHub archives have a root folder like "repo-branch/"
  // Find the root prefix
  let rootPrefix = '';
  const entries = Object.keys(zip.files);
  if (entries.length > 0) {
    const firstEntry = entries[0];
    const slashIndex = firstEntry.indexOf('/');
    if (slashIndex > 0) {
      rootPrefix = firstEntry.substring(0, slashIndex + 1);
    }
  }

  // Find all SKILL.md files
  const skillMdPaths: string[] = [];
  for (const relativePath of entries) {
    if (relativePath.endsWith('SKILL.md')) {
      skillMdPaths.push(relativePath);
    }
  }

  if (skillMdPaths.length === 0) {
    throw new GitHubError('No skill found in this repository (missing SKILL.md)', 'NO_SKILL');
  }

  // Parse each SKILL.md to get metadata
  const skills: DiscoveredSkill[] = [];

  for (const skillMdPath of skillMdPaths) {
    const file = zip.file(skillMdPath);
    if (!file) continue;

    const content = await file.async('string');
    const parsed = parseSkillMetadata(content);

    if (!parsed) {
      // Skip invalid SKILL.md files
      continue;
    }

    // Calculate the skill directory path (relative to repo root)
    const skillPath = skillMdPath
      .replace(rootPrefix, '') // Remove repo root prefix
      .replace(/\/SKILL\.md$/i, '') // Remove SKILL.md filename
      .replace(/SKILL\.md$/i, ''); // Handle root-level SKILL.md

    skills.push({
      path: skillPath,
      name: parsed.metadata.name,
      description: parsed.metadata.description,
      metadata: parsed.metadata,
    });
  }

  if (skills.length === 0) {
    throw new GitHubError('No valid skill found in this repository', 'NO_SKILL');
  }

  return { repoInfo, skills };
}

/**
 * Extract a specific skill from the repository
 * Returns a ZIP buffer containing only the skill files
 */
export async function extractSkillFromRepo(
  input: string,
  skillPath: string
): Promise<{ buffer: Buffer; fileName: string }> {
  // Verify repo and download
  const repoInfo = await verifyGitHubRepo(input);
  const archiveBuffer = await downloadRepoArchive(repoInfo);

  // Load ZIP
  const zip = await JSZip.loadAsync(archiveBuffer);

  // Find root prefix
  let rootPrefix = '';
  const entries = Object.keys(zip.files);
  if (entries.length > 0) {
    const firstEntry = entries[0];
    const slashIndex = firstEntry.indexOf('/');
    if (slashIndex > 0) {
      rootPrefix = firstEntry.substring(0, slashIndex + 1);
    }
  }

  // Create new ZIP with only skill files
  const skillZip = new JSZip();

  // Build the full path prefix for the skill
  const skillPrefix = skillPath ? `${rootPrefix}${skillPath}/` : rootPrefix;

  // Copy relevant files
  let foundSkill = false;
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    // Get path relative to repo root (or skill subdirectory)
    const relativeToRoot = relativePath.replace(rootPrefix, '');

    // If skill is in a subdirectory, check if file is in that subdirectory
    if (skillPath) {
      if (!relativeToRoot.startsWith(skillPath + '/') && relativeToRoot !== skillPath + '/SKILL.md') {
        // Check if it's SKILL.md in the skill directory
        if (relativePath !== `${skillPrefix}SKILL.md`) {
          continue;
        }
      }
    }

    // Get the path relative to skill root
    let skillRelativePath: string;
    if (skillPath) {
      skillRelativePath = relativeToRoot.replace(skillPath + '/', '');
    } else {
      skillRelativePath = relativeToRoot;
    }

    // Check if this file should be kept
    if (!shouldKeepFile(skillRelativePath)) {
      continue;
    }

    // Check for SKILL.md specifically
    if (skillRelativePath === 'SKILL.md' || relativePath === `${skillPrefix}SKILL.md`) {
      foundSkill = true;
    }

    // Copy file to new ZIP
    const content = await zipEntry.async('nodebuffer');
    skillZip.file(skillRelativePath, content);
  }

  if (!foundSkill) {
    throw new GitHubError('SKILL.md not found in specified path', 'NO_SKILL');
  }

  const buffer = await skillZip.generateAsync({ type: 'nodebuffer' });

  // Generate filename
  const sanitizedName = skillPath
    ? skillPath.replace(/\//g, '-')
    : `${repoInfo.owner}-${repoInfo.repo}`;

  return {
    buffer,
    fileName: `${sanitizedName}.zip`,
  };
}
