import {
  parseGitHubUrl,
  isGitHubUrl,
  buildGitHubUrl,
  buildGitHubApiUrl,
  buildGitHubArchiveUrl,
} from '@/lib/import/url-parser';

describe('parseGitHubUrl', () => {
  describe('shorthand format (owner/repo)', () => {
    it('should parse owner/repo shorthand', () => {
      const result = parseGitHubUrl('vercel-labs/agent-skills');
      expect(result).toEqual({
        owner: 'vercel-labs',
        repo: 'agent-skills',
      });
    });

    it('should parse shorthand with dots in repo name', () => {
      const result = parseGitHubUrl('owner/repo.name');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo.name',
      });
    });

    it('should parse shorthand with underscores', () => {
      const result = parseGitHubUrl('user_name/repo_name');
      expect(result).toEqual({
        owner: 'user_name',
        repo: 'repo_name',
      });
    });

    it('should parse shorthand with numbers', () => {
      const result = parseGitHubUrl('user123/repo456');
      expect(result).toEqual({
        owner: 'user123',
        repo: 'repo456',
      });
    });
  });

  describe('full GitHub URL format', () => {
    it('should parse https://github.com/owner/repo', () => {
      const result = parseGitHubUrl('https://github.com/vercel-labs/agent-skills');
      expect(result).toEqual({
        owner: 'vercel-labs',
        repo: 'agent-skills',
      });
    });

    it('should parse http://github.com/owner/repo', () => {
      const result = parseGitHubUrl('http://github.com/owner/repo');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse URL with trailing slash', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo/');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse URL with additional path (ignores extra path)', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo/tree/main/skills');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should parse URL with query params', () => {
      const result = parseGitHubUrl('https://github.com/owner/repo?tab=readme');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });
  });

  describe('invalid inputs', () => {
    it('should return null for invalid URL', () => {
      expect(parseGitHubUrl('not-a-valid-url')).toBeNull();
    });

    it('should return null for non-GitHub URL', () => {
      expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(parseGitHubUrl('')).toBeNull();
    });

    it('should return null for whitespace only', () => {
      expect(parseGitHubUrl('   ')).toBeNull();
    });

    it('should return null for single word', () => {
      expect(parseGitHubUrl('owner')).toBeNull();
    });

    it('should return null for too many slashes', () => {
      expect(parseGitHubUrl('owner/repo/extra')).toBeNull();
    });
  });

  describe('trimmed input', () => {
    it('should trim whitespace from shorthand', () => {
      const result = parseGitHubUrl('  owner/repo  ');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });

    it('should trim whitespace from URL', () => {
      const result = parseGitHubUrl('  https://github.com/owner/repo  ');
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      });
    });
  });
});

describe('isGitHubUrl', () => {
  it('should return true for valid shorthand', () => {
    expect(isGitHubUrl('owner/repo')).toBe(true);
  });

  it('should return true for valid GitHub URL', () => {
    expect(isGitHubUrl('https://github.com/owner/repo')).toBe(true);
  });

  it('should return false for invalid URL', () => {
    expect(isGitHubUrl('not-a-url')).toBe(false);
  });

  it('should return false for non-GitHub URL', () => {
    expect(isGitHubUrl('https://gitlab.com/owner/repo')).toBe(false);
  });
});

describe('buildGitHubUrl', () => {
  it('should build correct GitHub URL', () => {
    const result = buildGitHubUrl({ owner: 'vercel-labs', repo: 'agent-skills' });
    expect(result).toBe('https://github.com/vercel-labs/agent-skills');
  });
});

describe('buildGitHubApiUrl', () => {
  it('should build correct GitHub API URL', () => {
    const result = buildGitHubApiUrl({ owner: 'owner', repo: 'repo' });
    expect(result).toBe('https://api.github.com/repos/owner/repo');
  });
});

describe('buildGitHubArchiveUrl', () => {
  it('should build correct archive URL with branch', () => {
    const result = buildGitHubArchiveUrl({ owner: 'owner', repo: 'repo' }, 'main');
    expect(result).toBe('https://codeload.github.com/owner/repo/zip/refs/heads/main');
  });

  it('should build correct archive URL with develop branch', () => {
    const result = buildGitHubArchiveUrl({ owner: 'owner', repo: 'repo' }, 'develop');
    expect(result).toBe('https://codeload.github.com/owner/repo/zip/refs/heads/develop');
  });
});
