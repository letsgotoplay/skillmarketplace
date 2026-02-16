import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  REDIS_URL: z.string().optional(), // Optional - required only for skill evaluation
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // MinIO / S3 Storage
  S3_ENDPOINT: z.string().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin123'),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('skillmarketplace'),
  S3_FORCE_PATH_STYLE: z.string().default('true'),
  // AI Security Analysis (supports Anthropic compatible APIs like GLM)
  AI_SECURITY_ENABLED: z.string().default('true'),
  AI_SECURITY_API_KEY: z.string().optional(),
  AI_SECURITY_BASE_URL: z.string().default('https://api.anthropic.com'),
  AI_SECURITY_MODEL: z.string().default('claude-sonnet-4-20250514'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): Env {
  return envSchema.parse({
    DATABASE_URL: env.DATABASE_URL,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    REDIS_URL: env.REDIS_URL,
    NODE_ENV: env.NODE_ENV,
    S3_ENDPOINT: env.S3_ENDPOINT,
    S3_ACCESS_KEY: env.S3_ACCESS_KEY,
    S3_SECRET_KEY: env.S3_SECRET_KEY,
    S3_REGION: env.S3_REGION,
    S3_BUCKET: env.S3_BUCKET,
    S3_FORCE_PATH_STYLE: env.S3_FORCE_PATH_STYLE,
    AI_SECURITY_ENABLED: env.AI_SECURITY_ENABLED,
    AI_SECURITY_API_KEY: env.AI_SECURITY_API_KEY,
    AI_SECURITY_BASE_URL: env.AI_SECURITY_BASE_URL,
    AI_SECURITY_MODEL: env.AI_SECURITY_MODEL,
  });
}

export const env = parseEnv(process.env);
