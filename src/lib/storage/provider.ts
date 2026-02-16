/**
 * Storage Provider Interface
 * Supports both S3 (MinIO/AWS) and local filesystem
 */

export interface StorageProvider {
  upload(key: string, data: Buffer, options?: { contentType?: string; metadata?: Record<string, string> }): Promise<void>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<{ size: number; contentType: string; lastModified: Date }>;
  getUrl?(key: string): string; // For local storage, returns file path
}

import { env } from '../env';

// Lazy-loaded provider
let _s3Provider: StorageProvider | null = null;

/**
 * S3/MinIO Storage Provider
 */
class S3StorageProvider implements StorageProvider {
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
  }

  private async getClient() {
    const { getS3Client } = await import('./s3-client');
    return getS3Client();
  }

  async upload(key: string, data: Buffer, options?: { contentType?: string; metadata?: Record<string, string> }): Promise<void> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    await client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    }));
  }

  async download(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    const response = await client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));

    if (!response.Body) {
      throw new Error('No body in response');
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    await client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getMetadata(key);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<{ size: number; contentType: string; lastModified: Date }> {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();

    const response = await client.send(new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));

    return {
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? 'application/octet-stream',
      lastModified: response.LastModified ?? new Date(),
    };
  }
}

/**
 * Get the storage provider (S3/MinIO only)
 */
export function getStorageProvider(): StorageProvider {
  if (!_s3Provider) {
    _s3Provider = new S3StorageProvider();
  }
  return _s3Provider;
}

/**
 * Get S3 URL for a key (only works with S3 provider)
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string | null> {
  const useS3 = env.S3_ENDPOINT && env.S3_ENDPOINT !== '';
  if (!useS3) return null;

  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getS3Client } = await import('./s3-client');

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}
