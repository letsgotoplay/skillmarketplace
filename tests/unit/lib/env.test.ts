import { parseEnv, type Env } from '@/lib/env';

describe('Environment Configuration', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    NEXTAUTH_SECRET: 'test-secret-key',
    NEXTAUTH_URL: 'http://localhost:3000',
    REDIS_URL: 'redis://localhost:6379',
    UPLOAD_DIR: './uploads',
    NODE_ENV: 'development' as const,
  };

  describe('parseEnv', () => {
    it('should parse valid environment variables', () => {
      const result = parseEnv(validEnv);
      expect(result).toEqual(validEnv);
    });

    it('should use default values for optional fields', () => {
      const minimalEnv = {
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
        NEXTAUTH_SECRET: 'test-secret-key',
        NEXTAUTH_URL: 'http://localhost:3000',
        REDIS_URL: 'redis://localhost:6379',
      };
      const result = parseEnv(minimalEnv);
      expect(result.UPLOAD_DIR).toBe('./uploads');
    });

    it('should throw for invalid DATABASE_URL', () => {
      expect(() =>
        parseEnv({ ...validEnv, DATABASE_URL: 'invalid-url' })
      ).toThrow();
    });

    it('should throw for empty NEXTAUTH_SECRET', () => {
      expect(() =>
        parseEnv({ ...validEnv, NEXTAUTH_SECRET: '' })
      ).toThrow();
    });

    it('should throw for invalid NEXTAUTH_URL', () => {
      expect(() =>
        parseEnv({ ...validEnv, NEXTAUTH_URL: 'not-a-url' })
      ).toThrow();
    });

    it('should accept valid NODE_ENV values', () => {
      const envs: Array<'development' | 'production' | 'test'> = ['development', 'production', 'test'];
      envs.forEach((nodeEnv) => {
        const result = parseEnv({ ...validEnv, NODE_ENV: nodeEnv });
        expect(result.NODE_ENV).toBe(nodeEnv);
      });
    });
  });
});
