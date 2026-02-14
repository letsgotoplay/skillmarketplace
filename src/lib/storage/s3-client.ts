import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../env';

// Create S3 client configured for local MinIO or AWS S3
export function createS3Client(): S3Client {
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
    // Force path style for MinIO (required for local development)
    // AWS S3 uses virtual-hosted style by default
    forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
  });
}

// Singleton instance
let s3Client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

export const S3_BUCKET = env.S3_BUCKET;
