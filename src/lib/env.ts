import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  REDIS_URL: z.string(),
  UPLOAD_DIR: z.string().default('./uploads'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(env: Record<string, string | undefined>): Env {
  return envSchema.parse({
    DATABASE_URL: env.DATABASE_URL,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    REDIS_URL: env.REDIS_URL,
    UPLOAD_DIR: env.UPLOAD_DIR,
    NODE_ENV: env.NODE_ENV,
  });
}

export const env = parseEnv(process.env);
