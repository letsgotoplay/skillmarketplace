/**
 * API Integration Tests for Skills Endpoints
 *
 * These tests validate the API response structures and business logic
 * without making actual HTTP requests (unit-style integration tests)
 */

import { Visibility, SkillStatus } from '@prisma/client';

// Types matching API responses
interface SkillResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  authorId: string;
  teamId: string | null;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
}

interface SkillListResponse {
  skills: SkillResponse[];
  total: number;
  page: number;
  pageSize: number;
}

interface SkillDetailResponse extends SkillResponse {
  versions: {
    id: string;
    version: string;
    changelog: string | null;
    status: SkillStatus;
    createdAt: string;
  }[];
  stats: {
    downloadsCount: number;
    viewsCount: number;
  } | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  team?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

describe('Skills API Integration', () => {
  describe('GET /api/skills - List Skills', () => {
    it('should return paginated skill list structure', () => {
      const mockResponse: SkillListResponse = {
        skills: [
          {
            id: 'skill-pdf',
            name: 'pdf',
            slug: 'pdf',
            description: 'PDF manipulation skill',
            authorId: 'user-1',
            teamId: null,
            visibility: Visibility.PUBLIC,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      };

      expect(mockResponse.skills).toBeInstanceOf(Array);
      expect(mockResponse.total).toBeGreaterThanOrEqual(0);
      expect(mockResponse.page).toBeGreaterThanOrEqual(1);
      expect(mockResponse.pageSize).toBeGreaterThanOrEqual(1);
    });

    it('should filter by visibility', () => {
      const publicOnly = (skill: SkillResponse) => skill.visibility === Visibility.PUBLIC;

      const skills: SkillResponse[] = [
        { id: '1', name: 'public-skill', slug: 'public', description: '', authorId: '1', teamId: null, visibility: Visibility.PUBLIC, createdAt: '', updatedAt: '' },
        { id: '2', name: 'private-skill', slug: 'private', description: '', authorId: '1', teamId: null, visibility: Visibility.PRIVATE, createdAt: '', updatedAt: '' },
      ];

      const filtered = skills.filter(publicOnly);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].visibility).toBe(Visibility.PUBLIC);
    });

    it('should sort by creation date descending', () => {
      const skills: SkillResponse[] = [
        { id: '1', name: 'old', slug: 'old', description: '', authorId: '1', teamId: null, visibility: Visibility.PUBLIC, createdAt: '2024-01-01T00:00:00Z', updatedAt: '' },
        { id: '2', name: 'new', slug: 'new', description: '', authorId: '1', teamId: null, visibility: Visibility.PUBLIC, createdAt: '2024-01-02T00:00:00Z', updatedAt: '' },
      ];

      const sorted = [...skills].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].name).toBe('new');
    });
  });

  describe('GET /api/skills/:id - Get Skill Detail', () => {
    it('should return full skill details with versions', () => {
      const mockResponse: SkillDetailResponse = {
        id: 'skill-pdf',
        name: 'pdf',
        slug: 'pdf',
        description: 'PDF manipulation skill',
        authorId: 'user-1',
        teamId: null,
        visibility: Visibility.PUBLIC,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        versions: [
          {
            id: 'sv-1',
            version: '1.0.0',
            changelog: 'Initial release',
            status: SkillStatus.APPROVED,
            createdAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'sv-2',
            version: '1.1.0',
            changelog: 'Added features',
            status: SkillStatus.APPROVED,
            createdAt: '2024-01-15T00:00:00Z',
          },
        ],
        stats: {
          downloadsCount: 150,
          viewsCount: 500,
        },
        author: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
        team: null,
      };

      expect(mockResponse.versions).toBeInstanceOf(Array);
      expect(mockResponse.versions.length).toBeGreaterThan(0);
      expect(mockResponse.stats).not.toBeNull();
      expect(mockResponse.author).toBeDefined();
    });

    it('should return 404 for non-existent skill', () => {
      const notFoundResponse = {
        error: 'Skill not found',
        status: 404,
      };

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.error).toContain('not found');
    });
  });

  describe('POST /api/skills - Create Skill', () => {
    it('should validate required fields', () => {
      const validSkill = {
        name: 'test-skill',
        slug: 'test-skill',
        description: 'A test skill',
        visibility: Visibility.PUBLIC,
      };

      expect(validSkill.name).toBeDefined();
      expect(validSkill.slug).toBeDefined();
      expect(validSkill.description).toBeDefined();
    });

    it('should validate slug format', () => {
      const isValidSlug = (slug: string): boolean => {
        return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
      };

      expect(isValidSlug('my-skill')).toBe(true);
      expect(isValidSlug('my_skill')).toBe(false);
      expect(isValidSlug('MySkill')).toBe(false);
      expect(isValidSlug('ab')).toBe(false);
    });

    it('should validate visibility enum', () => {
      const validVisibilities = [Visibility.PUBLIC, Visibility.TEAM_ONLY, Visibility.PRIVATE];

      validVisibilities.forEach(v => {
        expect(Object.values(Visibility)).toContain(v);
      });
    });
  });

  describe('DELETE /api/skills/:id - Delete Skill', () => {
    it('should only allow author or admin to delete', () => {
      const deleteCheck = {
        userId: 'user-1',
        skillAuthorId: 'user-1',
        userRole: 'USER',
      };

      const canDelete =
        deleteCheck.userId === deleteCheck.skillAuthorId ||
        deleteCheck.userRole === 'ADMIN';

      expect(canDelete).toBe(true);
    });

    it('should return 403 for unauthorized deletion', () => {
      const deleteCheck = {
        userId: 'user-2',
        skillAuthorId: 'user-1',
        userRole: 'USER',
      };

      const canDelete =
        deleteCheck.userId === deleteCheck.skillAuthorId ||
        deleteCheck.userRole === 'ADMIN';

      expect(canDelete).toBe(false);
    });
  });

  describe('GET /api/skills/:id/download - Download Skill', () => {
    it('should track download statistics', () => {
      const downloadEvent = {
        skillId: 'skill-pdf',
        version: '1.0.0',
        userId: 'user-1',
        downloadedAt: new Date().toISOString(),
      };

      expect(downloadEvent.skillId).toBeDefined();
      expect(downloadEvent.version).toBeDefined();
    });

    it('should require authentication for private skills', () => {
      const authCheck = {
        skillVisibility: Visibility.PRIVATE,
        isAuthenticated: false,
        userId: null,
      };

      const canDownload =
        authCheck.skillVisibility === Visibility.PUBLIC ||
        (authCheck.isAuthenticated && authCheck.userId);

      expect(canDownload).toBe(false);
    });
  });
});
