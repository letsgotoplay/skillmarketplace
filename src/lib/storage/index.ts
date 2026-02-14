import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, S3_BUCKET } from './s3-client';

export interface UploadOptions {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface FileMetadata {
  key: string;
  size: number;
  contentType: string;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface ListResult {
  files: FileMetadata[];
  isTruncated: boolean;
  continuationToken?: string;
}

/**
 * Ensure the bucket exists, create if not
 */
export async function ensureBucket(): Promise<void> {
  const client = getS3Client();

  try {
    await client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    // Bucket doesn't exist, create it
    await client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
  }
}

/**
 * Upload a file to S3
 */
export async function uploadFile(options: UploadOptions): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType,
    Metadata: options.metadata,
  });

  await client.send(command);
  return options.key;
}

/**
 * Download a file from S3
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error('No body in response');
  }

  // Convert stream to buffer
  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get file metadata without downloading
 */
export async function getFileMetadata(key: string): Promise<FileMetadata> {
  const client = getS3Client();

  const command = new HeadObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const response = await client.send(command);

  return {
    key,
    size: response.ContentLength ?? 0,
    contentType: response.ContentType ?? 'application/octet-stream',
    lastModified: response.LastModified ?? new Date(),
    metadata: response.Metadata,
  };
}

/**
 * Check if a file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await getFileMetadata(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * List files in a bucket with optional prefix
 */
export async function listFiles(options: ListOptions = {}): Promise<ListResult> {
  const client = getS3Client();

  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: options.prefix,
    MaxKeys: options.maxKeys ?? 100,
    ContinuationToken: options.continuationToken,
  });

  const response = await client.send(command);

  const files: FileMetadata[] = (response.Contents ?? []).map((item) => ({
    key: item.Key ?? '',
    size: item.Size ?? 0,
    contentType: 'application/octet-stream',
    lastModified: item.LastModified ?? new Date(),
  }));

  return {
    files,
    isTruncated: response.IsTruncated ?? false,
    continuationToken: response.NextContinuationToken,
  };
}

/**
 * Generate a presigned URL for direct upload (client-side)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType?: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a presigned URL for direct download (client-side)
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate a unique key for a file
 */
export function generateKey(prefix: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${prefix}/${timestamp}-${random}-${sanitized}`;
}

// Re-export bucket name
export { S3_BUCKET };
