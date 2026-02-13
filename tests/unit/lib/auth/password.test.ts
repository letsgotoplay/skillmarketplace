import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from '@/lib/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'mySecurePassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
    });

    it('should handle special characters', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(specialPassword);
      expect(hash).toBeDefined();
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'mySecurePassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('somePassword');

      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('should handle case sensitivity', async () => {
      const password = 'MySecurePassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword('mysecurepassword123', hash);
      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate a strong password', () => {
      const result = validatePasswordStrength('StrongPass123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long'
      );
    });

    it('should reject password without uppercase letter', () => {
      const result = validatePasswordStrength('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });

    it('should reject password without lowercase letter', () => {
      const result = validatePasswordStrength('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter'
      );
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbers');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number'
      );
    });

    it('should return multiple errors for weak password', () => {
      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should accept password with special characters', () => {
      const result = validatePasswordStrength('Strong!Pass123');
      expect(result.valid).toBe(true);
    });
  });
});
