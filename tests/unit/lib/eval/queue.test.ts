import { type EvalJobData, type EvalJobResult } from '@/lib/eval/queue';

// Mock BullMQ for testing
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  Worker: jest.fn(),
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('Evaluation Queue', () => {
  describe('EvalJobData type', () => {
    it('should have correct structure', () => {
      const jobData: EvalJobData = {
        skillVersionId: 'skill-123',
        testCases: [
          {
            name: 'Test 1',
            input: 'Hello',
            expectedOutput: 'World',
            timeout: 30000,
          },
        ],
        skillPath: '/path/to/skill.zip',
      };

      expect(jobData.skillVersionId).toBe('skill-123');
      expect(jobData.testCases).toHaveLength(1);
      expect(jobData.testCases[0].name).toBe('Test 1');
    });

    it('should support pattern matching', () => {
      const jobData: EvalJobData = {
        skillVersionId: 'skill-123',
        testCases: [
          {
            name: 'Pattern Test',
            input: 'Test input',
            expectedPatterns: ['pattern1', 'pattern2'],
            timeout: 10000,
          },
        ],
        skillPath: '/path/to/skill.zip',
      };

      expect(jobData.testCases[0].expectedPatterns).toEqual(['pattern1', 'pattern2']);
    });
  });

  describe('EvalJobResult type', () => {
    it('should have correct structure', () => {
      const result: EvalJobResult = {
        skillVersionId: 'skill-123',
        status: 'COMPLETED',
        results: [
          {
            testName: 'Test 1',
            status: 'PASSED',
            output: 'Expected output',
            durationMs: 150,
          },
        ],
      };

      expect(result.status).toBe('COMPLETED');
      expect(result.results).toHaveLength(1);
      expect(result.results[0].status).toBe('PASSED');
    });

    it('should support failed status with error', () => {
      const result: EvalJobResult = {
        skillVersionId: 'skill-123',
        status: 'FAILED',
        results: [],
        error: 'Test execution failed',
      };

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Test execution failed');
    });
  });
});
