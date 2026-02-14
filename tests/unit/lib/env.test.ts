import { parseEnv, type Env } from '@/lib/env';

describe('Environment Configuration', () => {
  const validEnv: Env = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    NEXTAUTH_SECRET: 'test-secret-key',
    NEXTAUTH_URL: 'http://localhost:3000',
    REDIS_URL: 'redis://localhost:6379',
    UPLOAD_DIR: './uploads',
    NODE_ENV: 'development' as const,
    S3_ENDPOINT: 'http://localhost:9000',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin123',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'skillmarketplace',
    S3_FORCE_PATH_STYLE: 'true',
    AI_SECURITY_API_KEY: 'test-api-key',
    AI_SECURITY_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
    AI_SECURITY_MODEL: 'GLM-4',
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
      expect(result.S3_ENDPOINT).toBe('http://localhost:9000');
      expect(result.S3_BUCKET).toBe('skillmarketplace');
      expect(result.AI_SECURITY_BASE_URL).toBe('https://api.anthropic.com');
      expect(result.AI_SECURITY_MODEL).toBe('claude-sonnet-4-20250514');
    });

    it('should accept GLM configuration', () => {
      const glmEnv = {
        ...validEnv,
        AI_SECURITY_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
        AI_SECURITY_MODEL: 'GLM-4',
        AI_SECURITY_API_KEY: 'glm-api-key',
      };
      const result = parseEnv(glmEnv);
      expect(result.AI_SECURITY_BASE_URL).toBe('https://open.bigmodel.cn/api/anthropic');
      expect(result.AI_SECURITY_MODEL).toBe('GLM-4');
      expect(result.AI_SECURITY_API_KEY).toBe('glm-api-key');
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
