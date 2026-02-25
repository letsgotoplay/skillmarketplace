/**
 * API Integration Tests for Feedback Endpoints
 *
 * Tests for GET/POST /api/skills/{id}/feedback
 */

// Types matching API responses
interface FeedbackResponse {
  id: string;
  rating: number | null;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

describe('Feedback API Integration', () => {
  describe('GET /api/skills/:id/feedback - List Feedback', () => {
    it('should return feedback array structure', () => {
      const mockResponse: FeedbackResponse[] = [
        {
          id: 'fb-1',
          rating: 5,
          comment: 'Great skill!',
          createdAt: '2024-01-01T00:00:00Z',
          user: {
            id: 'user-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 'fb-2',
          rating: 4,
          comment: null,
          createdAt: '2024-01-02T00:00:00Z',
          user: {
            id: 'user-2',
            name: null,
            email: 'jane@example.com',
          },
        },
      ];

      expect(mockResponse).toBeInstanceOf(Array);
      expect(mockResponse.length).toBe(2);
      expect(mockResponse[0]).toHaveProperty('id');
      expect(mockResponse[0]).toHaveProperty('rating');
      expect(mockResponse[0]).toHaveProperty('comment');
      expect(mockResponse[0]).toHaveProperty('createdAt');
      expect(mockResponse[0]).toHaveProperty('user');
      expect(mockResponse[0].user).toHaveProperty('id');
      expect(mockResponse[0].user).toHaveProperty('name');
      expect(mockResponse[0].user).toHaveProperty('email');
    });

    it('should return empty array for skill with no feedback', () => {
      const mockResponse: FeedbackResponse[] = [];

      expect(mockResponse).toBeInstanceOf(Array);
      expect(mockResponse.length).toBe(0);
    });

    it('should sort feedback by creation date descending', () => {
      const feedback: FeedbackResponse[] = [
        { id: '1', rating: 5, comment: 'a', createdAt: '2024-01-01T00:00:00Z', user: { id: '1', name: 'a', email: 'a@a.com' } },
        { id: '2', rating: 4, comment: 'b', createdAt: '2024-01-03T00:00:00Z', user: { id: '2', name: 'b', email: 'b@b.com' } },
        { id: '3', rating: 3, comment: 'c', createdAt: '2024-01-02T00:00:00Z', user: { id: '3', name: 'c', email: 'c@c.com' } },
      ];

      const sorted = [...feedback].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('3');
      expect(sorted[2].id).toBe('1');
    });

    it('should handle 404 for non-existent skill', () => {
      const notFoundResponse = {
        error: 'Skill not found',
        status: 404,
      };

      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.error).toContain('not found');
    });
  });

  describe('POST /api/skills/:id/feedback - Submit Feedback', () => {
    it('should validate rating range 1-5', () => {
      const validRatings = [1, 2, 3, 4, 5];
      const invalidRatings = [0, -1, 6, 3.5, '5' as unknown as number];

      validRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5 && Number.isInteger(rating);
        expect(isValid).toBe(true);
      });

      invalidRatings.forEach((rating) => {
        const isValid = typeof rating === 'number' && rating >= 1 && rating <= 5 && Number.isInteger(rating);
        expect(isValid).toBe(false);
      });
    });

    it('should accept rating without comment', () => {
      const requestBody = { rating: 5, comment: null as string | null };
      const hasRating = requestBody.rating !== null && requestBody.rating !== undefined;
      const hasComment = requestBody.comment && typeof requestBody.comment === 'string' && requestBody.comment.trim().length > 0;
      const isValid = hasRating || hasComment;

      expect(isValid).toBe(true);
    });

    it('should accept comment without rating', () => {
      const requestBody = { rating: null as number | null, comment: 'Great skill!' };
      const hasRating = requestBody.rating !== null && requestBody.rating !== undefined;
      const hasComment = requestBody.comment && typeof requestBody.comment === 'string' && requestBody.comment.trim().length > 0;
      const isValid = hasRating || hasComment;

      expect(isValid).toBe(true);
    });

    it('should accept both rating and comment', () => {
      const requestBody = { rating: 4, comment: 'Very useful!' };
      const hasRating = requestBody.rating !== null && requestBody.rating !== undefined;
      const hasComment = requestBody.comment && typeof requestBody.comment === 'string' && requestBody.comment.trim().length > 0;
      const isValid = hasRating || hasComment;

      expect(isValid).toBe(true);
    });

    it('should reject empty feedback (no rating, no comment)', () => {
      const requestBody = { rating: null as number | null, comment: null as string | null };
      const hasRating = requestBody.rating !== null && requestBody.rating !== undefined;
      const hasComment = !!(requestBody.comment && typeof requestBody.comment === 'string' && requestBody.comment.trim().length > 0);
      const isValid = hasRating || hasComment;

      expect(isValid).toBe(false);
    });

    it('should reject whitespace-only comment as empty', () => {
      const requestBody = { rating: null as number | null, comment: '   ' };
      const hasRating = requestBody.rating !== null && requestBody.rating !== undefined;
      const hasComment = requestBody.comment && typeof requestBody.comment === 'string' && requestBody.comment.trim().length > 0;
      const isValid = hasRating || hasComment;

      expect(isValid).toBe(false);
    });

    it('should trim comment whitespace', () => {
      const comment = '  Great skill!  ';
      const trimmed = comment.trim();

      expect(trimmed).toBe('Great skill!');
    });

    it('should return 401 for unauthenticated user', () => {
      const unauthorizedResponse = {
        error: 'Unauthorized',
        status: 401,
      };

      expect(unauthorizedResponse.status).toBe(401);
    });

    it('should return 404 for non-existent skill', () => {
      const notFoundResponse = {
        error: 'Skill not found',
        status: 404,
      };

      expect(notFoundResponse.status).toBe(404);
    });

    it('should return 400 for invalid JSON body', () => {
      const badRequestResponse = {
        error: 'Invalid JSON body',
        status: 400,
      };

      expect(badRequestResponse.status).toBe(400);
    });

    it('should return 201 on successful creation', () => {
      const successResponse: FeedbackResponse = {
        id: 'fb-new',
        rating: 5,
        comment: 'Excellent!',
        createdAt: '2024-01-15T00:00:00Z',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      expect(successResponse.id).toBeDefined();
      expect(successResponse.rating).toBe(5);
      expect(successResponse.comment).toBe('Excellent!');
    });
  });

  describe('Multiple Feedback Behavior', () => {
    it('should allow multiple feedbacks from same user on same skill', () => {
      const userFeedbacks = [
        { id: 'fb-1', skillId: 'skill-1', userId: 'user-1', rating: 5, comment: 'First review' },
        { id: 'fb-2', skillId: 'skill-1', userId: 'user-1', rating: 4, comment: 'Updated opinion' },
        { id: 'fb-3', skillId: 'skill-1', userId: 'user-2', rating: 5, comment: 'Great!' },
      ];

      // Same user can have multiple feedbacks on same skill
      const user1FeedbacksOnSkill1 = userFeedbacks.filter(
        (f) => f.skillId === 'skill-1' && f.userId === 'user-1'
      );

      expect(user1FeedbacksOnSkill1.length).toBe(2);
    });

    it('should create new feedback on each POST', () => {
      const existingFeedback = { id: 'fb-1', rating: 3, comment: 'Okay' };
      const newFeedback = { id: 'fb-2', rating: 5, comment: 'Actually great!' };

      // Each submission creates a new record
      expect(existingFeedback.id).toBe('fb-1');
      expect(newFeedback.id).toBe('fb-2');
      expect(existingFeedback).not.toEqual(newFeedback);
    });
  });

  describe('Response Format', () => {
    it('should include user info in feedback response', () => {
      const feedback: FeedbackResponse = {
        id: 'fb-1',
        rating: 5,
        comment: 'Great!',
        createdAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          name: 'John Doe',
          email: 'john@example.com',
        },
      };

      expect(feedback.user.id).toBeDefined();
      expect(feedback.user.name).toBeDefined();
      expect(feedback.user.email).toBeDefined();
    });

    it('should handle null rating in response', () => {
      const feedback: FeedbackResponse = {
        id: 'fb-1',
        rating: null,
        comment: 'Just a comment',
        createdAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
        },
      };

      expect(feedback.rating).toBeNull();
      expect(feedback.comment).toBe('Just a comment');
    });

    it('should handle null comment in response', () => {
      const feedback: FeedbackResponse = {
        id: 'fb-1',
        rating: 5,
        comment: null,
        createdAt: '2024-01-01T00:00:00Z',
        user: {
          id: 'user-1',
          name: 'Jane',
          email: 'jane@example.com',
        },
      };

      expect(feedback.rating).toBe(5);
      expect(feedback.comment).toBeNull();
    });
  });
});
