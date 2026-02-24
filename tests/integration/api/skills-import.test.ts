/**
 * API Integration Tests for Skills Import Endpoint
 *
 * Tests the GitHub import API endpoint behavior
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/skills/import/route';

// Mock dependencies
jest.mock('@/lib/config/features', () => ({
  GITHUB_IMPORT_ENABLED: true,
}));

jest.mock('@/lib/auth/api-auth', () => ({
  getAuthUser: jest.fn(),
  hasScope: jest.fn(),
}));

jest.mock('@/lib/import', () => ({
  GitHubError: class GitHubError extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      this.name = 'GitHubError';
    }
  },
  scanRepoForSkills: jest.fn(),
  extractSkillFromRepo: jest.fn(),
  parseGitHubUrl: jest.fn(),
  buildGitHubUrl: jest.fn(),
}));

jest.mock('@/lib/skills/upload', () => ({
  processSkillUpload: jest.fn(),
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
  AuditActions: {
    UPLOAD_SKILL: 'UPLOAD_SKILL',
  },
}));

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { getAuthUser, hasScope } from '@/lib/auth/api-auth';
import { scanRepoForSkills, extractSkillFromRepo, parseGitHubUrl, buildGitHubUrl, GitHubError } from '@/lib/import';
import { processSkillUpload } from '@/lib/skills/upload';
import { prisma } from '@/lib/db';

const mockGetAuthUser = getAuthUser as jest.Mock;
const mockHasScope = hasScope as jest.Mock;
const mockScanRepoForSkills = scanRepoForSkills as jest.Mock;
const mockExtractSkillFromRepo = extractSkillFromRepo as jest.Mock;
const mockParseGitHubUrl = parseGitHubUrl as jest.Mock;
const mockBuildGitHubUrl = buildGitHubUrl as jest.Mock;
const mockProcessSkillUpload = processSkillUpload as jest.Mock;
const mockPrismaUserFindUnique = jest.fn();
(prisma as any).user.findUnique = mockPrismaUserFindUnique;

describe('Skills Import API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/skills/import', () => {
    it('should return 400 when URL is missing', async () => {
      const request = new NextRequest('http://localhost/api/skills/import');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('URL parameter is required');
    });

    it('should return 400 for invalid URL format', async () => {
      mockParseGitHubUrl.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/skills/import?url=invalid-url');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid GitHub URL');
    });

    it('should return scan result for valid repo', async () => {
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockScanRepoForSkills.mockResolvedValue({
        repoInfo: {
          owner: 'owner',
          repo: 'repo',
          defaultBranch: 'main',
          url: 'https://github.com/owner/repo',
        },
        skills: [
          {
            path: '',
            name: 'test-skill',
            description: 'A test skill',
            metadata: { name: 'test-skill', description: 'A test skill' },
          },
        ],
      });

      const request = new NextRequest('http://localhost/api/skills/import?url=owner/repo');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.repo.owner).toBe('owner');
      expect(data.skills).toHaveLength(1);
      expect(data.skills[0].name).toBe('test-skill');
    });

    it('should return 404 for repo not found', async () => {
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockScanRepoForSkills.mockRejectedValue(new GitHubError('Not found', 'NOT_FOUND'));

      const request = new NextRequest('http://localhost/api/skills/import?url=owner/repo');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Repository not found');
    });

    it('should return 503 for network errors', async () => {
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockScanRepoForSkills.mockRejectedValue(new GitHubError('Network error', 'UNREACHABLE'));

      const request = new NextRequest('http://localhost/api/skills/import?url=owner/repo');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unable to connect to GitHub');
    });
  });

  describe('POST /api/skills/import', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetAuthUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'owner/repo' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 403 when missing SKILL_WRITE scope', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(false);

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'owner/repo' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('SKILL_WRITE');
    });

    it('should return 400 when URL is missing', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(true);

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('URL is required');
    });

    it('should successfully import a skill', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(true);
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockBuildGitHubUrl.mockReturnValue('https://github.com/owner/repo');
      mockPrismaUserFindUnique.mockResolvedValue({ emailPrefix: 'user' });
      mockExtractSkillFromRepo.mockResolvedValue({
        buffer: Buffer.from('fake-zip'),
        fileName: 'skill.zip',
      });
      mockProcessSkillUpload.mockResolvedValue({
        success: true,
        skillId: 'skill-1',
        versionId: 'version-1',
        slug: 'test-skill',
        fullSlug: 'user/test-skill',
      });

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'owner/repo', skillPath: '' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.skillId).toBe('skill-1');
      expect(mockProcessSkillUpload).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          emailPrefix: 'user',
          visibility: 'PUBLIC',
        })
      );
    });

    it('should return 400 for invalid URL format', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(true);
      mockParseGitHubUrl.mockReturnValue(null);

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'invalid' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid GitHub URL');
    });

    it('should return 403 for private repo', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(true);
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockExtractSkillFromRepo.mockRejectedValue(new GitHubError('Private', 'PRIVATE'));

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'owner/repo' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Only public repositories');
    });

    it('should return 400 when no skill found', async () => {
      mockGetAuthUser.mockResolvedValue({ id: 'user-1' });
      mockHasScope.mockReturnValue(true);
      mockParseGitHubUrl.mockReturnValue({ owner: 'owner', repo: 'repo' });
      mockExtractSkillFromRepo.mockRejectedValue(new GitHubError('No skill', 'NO_SKILL'));

      const request = new NextRequest('http://localhost/api/skills/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'owner/repo' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No skill found');
    });
  });
});
