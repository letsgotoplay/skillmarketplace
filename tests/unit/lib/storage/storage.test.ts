import {
  uploadFile,
  downloadFile,
  deleteFile,
  fileExists,
  getFileMetadata,
  listFiles,
  generateKey,
  ensureBucket,
} from '@/lib/storage';

describe('Storage Library', () => {
  beforeAll(async () => {
    // Ensure bucket exists before running tests
    await ensureBucket();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      const key = generateKey('test', 'hello.txt');
      const content = Buffer.from('Hello, MinIO!');

      const result = await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
      });

      expect(result).toBe(key);

      // Cleanup
      await deleteFile(key);
    });

    it('should upload a file with metadata', async () => {
      const key = generateKey('test', 'metadata.txt');
      const content = Buffer.from('Test with metadata');

      await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
        metadata: { userId: '123', uploadedBy: 'test' },
      });

      const metadata = await getFileMetadata(key);
      expect(metadata.metadata?.userid).toBe('123');

      // Cleanup
      await deleteFile(key);
    });
  });

  describe('downloadFile', () => {
    it('should download an uploaded file', async () => {
      const key = generateKey('test', 'download.txt');
      const content = Buffer.from('Download test content');

      await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
      });

      const downloaded = await downloadFile(key);
      expect(downloaded.toString()).toBe('Download test content');

      // Cleanup
      await deleteFile(key);
    });

    it('should throw error for non-existent file', async () => {
      await expect(downloadFile('non-existent-file.txt')).rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const key = generateKey('test', 'delete.txt');
      const content = Buffer.from('To be deleted');

      await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
      });

      await deleteFile(key);

      const exists = await fileExists(key);
      expect(exists).toBe(false);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const key = generateKey('test', 'exists.txt');
      const content = Buffer.from('I exist');

      await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
      });

      const exists = await fileExists(key);
      expect(exists).toBe(true);

      // Cleanup
      await deleteFile(key);
    });

    it('should return false for non-existing file', async () => {
      const exists = await fileExists('non-existent-file.txt');
      expect(exists).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should return correct metadata', async () => {
      const key = generateKey('test', 'metadata-check.txt');
      const content = Buffer.from('Metadata check');

      await uploadFile({
        key,
        body: content,
        contentType: 'text/plain',
      });

      const metadata = await getFileMetadata(key);

      expect(metadata.key).toBe(key);
      expect(metadata.size).toBe(14);
      expect(metadata.contentType).toBe('text/plain');
      expect(metadata.lastModified).toBeInstanceOf(Date);

      // Cleanup
      await deleteFile(key);
    });
  });

  describe('listFiles', () => {
    it('should list files with prefix', async () => {
      const prefix = `test-list-${Date.now()}`;
      const keys = [
        generateKey(prefix, 'file1.txt'),
        generateKey(prefix, 'file2.txt'),
        generateKey(prefix, 'file3.txt'),
      ];

      // Upload multiple files
      for (const key of keys) {
        await uploadFile({
          key,
          body: Buffer.from(`Content for ${key}`),
          contentType: 'text/plain',
        });
      }

      const result = await listFiles({ prefix });

      expect(result.files.length).toBeGreaterThanOrEqual(3);
      expect(result.files.some((f) => f.key === keys[0])).toBe(true);

      // Cleanup
      for (const key of keys) {
        await deleteFile(key);
      }
    });

    it('should respect maxKeys parameter', async () => {
      const prefix = `test-maxkeys-${Date.now()}`;
      const keys = Array.from({ length: 5 }, (_, i) =>
        generateKey(prefix, `file${i}.txt`)
      );

      // Upload multiple files
      for (const key of keys) {
        await uploadFile({
          key,
          body: Buffer.from(`Content for ${key}`),
          contentType: 'text/plain',
        });
      }

      const result = await listFiles({ prefix, maxKeys: 2 });

      expect(result.files.length).toBeLessThanOrEqual(2);
      expect(result.isTruncated).toBe(true);

      // Cleanup
      for (const key of keys) {
        await deleteFile(key);
      }
    });
  });

  describe('generateKey', () => {
    it('should generate unique keys', () => {
      const key1 = generateKey('skills', 'test.zip');
      const key2 = generateKey('skills', 'test.zip');

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^skills\/\d+-[a-z0-9]+-test\.zip$/);
    });

    it('should sanitize special characters', () => {
      const key = generateKey('skills', 'test file @#$%.zip');

      expect(key).not.toContain(' ');
      expect(key).not.toContain('@');
      expect(key).toMatch(/test_file_____\.zip$/);
    });
  });
});
