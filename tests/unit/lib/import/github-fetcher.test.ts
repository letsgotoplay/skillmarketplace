import JSZip from 'jszip';
import {
  GitHubError,
  verifyGitHubRepo,
  scanRepoForSkills,
  extractSkillFromRepo,
} from '@/lib/import/github-fetcher';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create a mock repo ZIP
async function createMockRepoZip(files: Record<string, string>): Promise<Buffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('GitHubError', () => {
  it('should create error with code', () => {
    const error = new GitHubError('Test error', 'NOT_FOUND');
    expect(error.message).toBe('Test error');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('GitHubError');
  });
});

describe('verifyGitHubRepo', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return repo info for valid public repo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const result = await verifyGitHubRepo('owner/repo');

    expect(result).toEqual({
      owner: 'owner',
      repo: 'repo',
      defaultBranch: 'main',
      url: 'https://github.com/owner/repo',
    });
  });

  it('should throw INVALID_URL for invalid URL format', async () => {
    await expect(verifyGitHubRepo('invalid-url')).rejects.toThrow(GitHubError);
    await expect(verifyGitHubRepo('invalid-url')).rejects.toMatchObject({
      code: 'INVALID_URL',
    });
  });

  it('should throw NOT_FOUND for 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(verifyGitHubRepo('owner/repo')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('should throw PRIVATE for private repo', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: true,
        default_branch: 'main',
      }),
    });

    await expect(verifyGitHubRepo('owner/repo')).rejects.toMatchObject({
      code: 'PRIVATE',
    });
  });

  it('should throw PRIVATE for 403 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    await expect(verifyGitHubRepo('owner/repo')).rejects.toMatchObject({
      code: 'PRIVATE',
    });
  });

  it('should throw TIMEOUT on abort', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    await expect(verifyGitHubRepo('owner/repo')).rejects.toMatchObject({
      code: 'TIMEOUT',
    });
  });
});

describe('scanRepoForSkills', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should discover single skill at root', async () => {
    // Mock repo info check
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    // Mock archive download
    const zipBuffer = await createMockRepoZip({
      'repo-main/SKILL.md': `---
name: test-skill
description: A test skill
---
# Test Skill`,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    const result = await scanRepoForSkills('owner/repo');

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0].name).toBe('test-skill');
    expect(result.skills[0].path).toBe('');
  });

  it('should discover multiple skills in subdirectories', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const zipBuffer = await createMockRepoZip({
      'repo-main/skills/skill-a/SKILL.md': `---
name: skill-a
description: Skill A
---
# Skill A`,
      'repo-main/skills/skill-b/SKILL.md': `---
name: skill-b
description: Skill B
---
# Skill B`,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    const result = await scanRepoForSkills('owner/repo');

    expect(result.skills).toHaveLength(2);
    expect(result.skills.map(s => s.name)).toContain('skill-a');
    expect(result.skills.map(s => s.name)).toContain('skill-b');
  });

  it('should throw NO_SKILL when no SKILL.md found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const zipBuffer = await createMockRepoZip({
      'repo-main/README.md': '# No skill here',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    await expect(scanRepoForSkills('owner/repo')).rejects.toMatchObject({
      code: 'NO_SKILL',
    });
  });
});

describe('extractSkillFromRepo', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should extract root skill and filter irrelevant files', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const zipBuffer = await createMockRepoZip({
      'repo-main/SKILL.md': `---
name: test-skill
description: A test skill
---
# Test Skill`,
      'repo-main/scripts/helper.py': 'print("hello")',
      'repo-main/references/REF.md': '# Reference',
      'repo-main/.gitignore': 'node_modules',
      'repo-main/package.json': '{}',
      'repo-main/.github/workflows/ci.yml': 'name: CI',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    const { buffer, fileName } = await extractSkillFromRepo('owner/repo', '');

    // Verify the extracted ZIP contains correct files
    const extractedZip = await JSZip.loadAsync(buffer);
    const fileNames = Object.keys(extractedZip.files).filter(f => !extractedZip.files[f].dir);

    expect(fileNames).toContain('SKILL.md');
    expect(fileNames).toContain('scripts/helper.py');
    expect(fileNames).toContain('references/REF.md');
    expect(fileNames).not.toContain('.gitignore');
    expect(fileNames).not.toContain('package.json');
    expect(fileNames).not.toContain('.github/workflows/ci.yml');
    expect(fileName).toBe('owner-repo.zip');
  });

  it('should extract skill from subdirectory', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const zipBuffer = await createMockRepoZip({
      'repo-main/skills/my-skill/SKILL.md': `---
name: my-skill
description: My skill
---
# My Skill`,
      'repo-main/skills/my-skill/scripts/run.sh': '#!/bin/bash',
      'repo-main/other-skill/SKILL.md': `---
name: other-skill
description: Other
---
# Other`,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    const { buffer, fileName } = await extractSkillFromRepo('owner/repo', 'skills/my-skill');

    const extractedZip = await JSZip.loadAsync(buffer);
    const fileNames = Object.keys(extractedZip.files).filter(f => !extractedZip.files[f].dir);

    expect(fileNames).toContain('SKILL.md');
    expect(fileNames).toContain('scripts/run.sh');
    expect(fileNames).not.toContain('skills/my-skill/SKILL.md');
    expect(fileName).toBe('skills-my-skill.zip');
  });

  it('should throw NO_SKILL for invalid skill path', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        private: false,
        default_branch: 'main',
      }),
    });

    const zipBuffer = await createMockRepoZip({
      'repo-main/SKILL.md': `---
name: test
description: test
---
# Test`,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      arrayBuffer: async () => zipBuffer,
      headers: new Headers({ 'content-length': zipBuffer.length.toString() }),
    });

    await expect(extractSkillFromRepo('owner/repo', 'nonexistent')).rejects.toMatchObject({
      code: 'NO_SKILL',
    });
  });
});
