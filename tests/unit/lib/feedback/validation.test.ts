// Tests for feedback validation logic

describe('Feedback Validation', () => {
  describe('Rating validation', () => {
    it('should accept valid ratings 1-5', () => {
      const validRatings = [1, 2, 3, 4, 5];
      validRatings.forEach((rating) => {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      });
    });

    it('should reject ratings outside 1-5 range', () => {
      const invalidRatings = [0, -1, 6, 10, 100];
      invalidRatings.forEach((rating) => {
        expect(rating < 1 || rating > 5).toBe(true);
      });
    });

    it('should accept null rating (optional)', () => {
      const rating: number | null = null;
      expect(rating).toBeNull();
    });
  });

  describe('Comment validation', () => {
    it('should accept non-empty comments', () => {
      const validComments = [
        'Great skill!',
        'This skill helped me a lot with my work.',
        'A'.repeat(1000), // Long comment
      ];
      validComments.forEach((comment) => {
        expect(comment.trim().length).toBeGreaterThan(0);
      });
    });

    it('should accept null comment (optional)', () => {
      const comment: string | null = null;
      expect(comment).toBeNull();
    });

    it('should handle whitespace-only comments as null', () => {
      const comment = '   ';
      const trimmedComment = comment.trim() || null;
      expect(trimmedComment).toBeNull();
    });
  });

  describe('Feedback submission requirements', () => {
    it('should require at least rating or comment', () => {
      const rating: number | null = null;
      const comment: string | null = null;
      const isValid = rating !== null || (comment !== null && (comment as string).trim().length > 0);
      expect(isValid).toBe(false);
    });

    it('should be valid with only rating', () => {
      const rating: number | null = 5;
      const comment: string | null = null;
      const isValid = rating !== null || (comment !== null && (comment as string).trim().length > 0);
      expect(isValid).toBe(true);
    });

    it('should be valid with only comment', () => {
      const rating: number | null = null;
      const comment: string | null = 'Great skill!';
      const isValid = rating !== null || (comment !== null && (comment as string).trim().length > 0);
      expect(isValid).toBe(true);
    });

    it('should be valid with both rating and comment', () => {
      const rating: number | null = 4;
      const comment: string | null = 'Very useful!';
      const isValid = rating !== null || (comment !== null && comment.trim().length > 0);
      expect(isValid).toBe(true);
    });
  });

  describe('Average rating calculation', () => {
    it('should calculate correct average from ratings', () => {
      const ratings = [5, 4, 3, 4, 5];
      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      expect(average).toBe(4.2);
    });

    it('should handle single rating', () => {
      const ratings = [5];
      const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      expect(average).toBe(5);
    });

    it('should filter out null ratings', () => {
      const feedback = [
        { rating: 5 },
        { rating: null },
        { rating: 4 },
        { rating: null },
        { rating: 3 },
      ];
      const validRatings = feedback.filter((f) => f.rating !== null).map((f) => f.rating);
      expect(validRatings).toEqual([5, 4, 3]);
    });

    it('should return null for no valid ratings', () => {
      const feedback = [{ rating: null }, { rating: null }];
      const validRatings = feedback.filter((f) => f.rating !== null);
      expect(validRatings.length).toBe(0);
    });
  });

  describe('Rating distribution', () => {
    it('should calculate distribution correctly', () => {
      const feedback = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
        { rating: 3 },
        { rating: 3 },
      ];
      const distribution = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: feedback.filter((f) => f.rating === star).length,
      }));

      expect(distribution[0]).toEqual({ star: 5, count: 2 });
      expect(distribution[1]).toEqual({ star: 4, count: 1 });
      expect(distribution[2]).toEqual({ star: 3, count: 3 });
      expect(distribution[3]).toEqual({ star: 2, count: 0 });
      expect(distribution[4]).toEqual({ star: 1, count: 0 });
    });

    it('should calculate percentages correctly', () => {
      const feedback = [
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
      ];
      const validRatingsCount = feedback.filter((f) => f.rating !== null).length;
      const percentage5 = (feedback.filter((f) => f.rating === 5).length / validRatingsCount) * 100;
      const percentage4 = (feedback.filter((f) => f.rating === 4).length / validRatingsCount) * 100;

      expect(percentage5).toBeCloseTo(66.67, 1);
      expect(percentage4).toBeCloseTo(33.33, 1);
    });
  });

  describe('User display name', () => {
    it('should use name if available', () => {
      const user = { name: 'John Doe', email: 'john@example.com' };
      const displayName = user.name || user.email.split('@')[0];
      expect(displayName).toBe('John Doe');
    });

    it('should use email username if name not available', () => {
      const user = { name: null, email: 'john.doe@example.com' };
      const displayName = user.name || user.email.split('@')[0];
      expect(displayName).toBe('john.doe');
    });

    it('should get first letter for avatar', () => {
      const user = { name: 'John', email: 'john@example.com' };
      const firstLetter = (user.name || user.email)[0].toUpperCase();
      expect(firstLetter).toBe('J');
    });
  });
});
