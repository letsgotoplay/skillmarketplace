import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from '@/lib/db';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const EVAL_QUEUE_NAME = 'skill-evaluation';

// Redis connection options
const connectionOptions = {
  host: new URL(REDIS_URL).hostname || 'localhost',
  port: parseInt(new URL(REDIS_URL).port) || 6379,
  maxRetriesPerRequest: null,
};

// Evaluation job data
export interface EvalJobData {
  skillVersionId: string;
  testCases: Array<{
    name: string;
    input: string;
    expectedOutput?: string;
    expectedPatterns?: string[];
    timeout: number;
  }>;
  skillPath: string;
}

// Evaluation job result
export interface EvalJobResult {
  skillVersionId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  results: Array<{
    testName: string;
    status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR';
    output: string;
    durationMs: number;
  }>;
  error?: string;
}

// Create the evaluation queue
export const evalQueue = new Queue<EvalJobData>(EVAL_QUEUE_NAME, {
  connection: connectionOptions,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Add an evaluation job to the queue
 */
export async function queueEvaluation(
  skillVersionId: string,
  testCases: EvalJobData['testCases'],
  skillPath: string
): Promise<string> {
  // Create eval queue record in database
  const evalRecord = await prisma.evalQueue.create({
    data: {
      skillVersionId,
      status: 'PENDING',
      priority: 5,
    },
  });

  // Add job to BullMQ
  await evalQueue.add(
    'evaluate-skill',
    {
      skillVersionId,
      testCases,
      skillPath,
    },
    {
      jobId: evalRecord.id,
    }
  );

  return evalRecord.id;
}

/**
 * Update eval status in database
 */
export async function updateEvalStatus(
  evalQueueId: string,
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
  error?: string
): Promise<void> {
  await prisma.evalQueue.update({
    where: { id: evalQueueId },
    data: {
      status,
      ...(status === 'RUNNING' && { startedAt: new Date() }),
      ...(status === 'COMPLETED' && { completedAt: new Date() }),
      ...(status === 'FAILED' && { completedAt: new Date(), error }),
    },
  });
}

/**
 * Store evaluation result in database
 */
export async function storeEvalResult(
  evalQueueId: string,
  testName: string,
  status: 'PASSED' | 'FAILED' | 'SKIPPED' | 'ERROR',
  output: string,
  durationMs: number
): Promise<void> {
  await prisma.evalResult.create({
    data: {
      evalQueueId,
      testName,
      status,
      output,
      durationMs,
    },
  });
}

/**
 * Get evaluation status and results
 */
export async function getEvalResults(evalQueueId: string) {
  const evalQueue = await prisma.evalQueue.findUnique({
    where: { id: evalQueueId },
    include: {
      results: true,
      skillVersion: {
        include: {
          skill: true,
        },
      },
    },
  });

  return evalQueue;
}

/**
 * Get all evaluations for a skill version
 */
export async function getSkillVersionEvals(skillVersionId: string) {
  return prisma.evalQueue.findMany({
    where: { skillVersionId },
    include: {
      results: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Close connection on process exit
process.on('SIGTERM', async () => {
  await evalQueue.close();
});
