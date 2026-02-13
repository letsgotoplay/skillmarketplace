import { loginSchema, registerSchema } from '@/lib/validations/auth';

describe('Auth Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate valid login credentials', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({});

      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    };

    it('should validate valid registration data', () => {
      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name shorter than 2 characters', () => {
      const result = registerSchema.safeParse({
        ...validData,
        name: 'J',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.name).toBeDefined();
      }
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        ...validData,
        email: 'invalid-email',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'short',
        confirmPassword: 'short',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });

    it('should reject mismatched passwords', () => {
      const result = registerSchema.safeParse({
        ...validData,
        password: 'Password123',
        confirmPassword: 'DifferentPassword',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten();
        expect(errors.fieldErrors.confirmPassword).toBeDefined();
      }
    });

    it('should reject missing fields', () => {
      const result = registerSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
