import { Worker, Job } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import path from 'path';
import {
  updateEvalStatus,
  storeEvalResult,
  type EvalJobData,
} from './queue';
import { JobStatus, TestStatus } from '@prisma/client';

const execAsync = promisify(exec);

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SANDBOX_TIMEOUT = 60000; // 60 seconds per test
const SANDBOX_MEMORY = '512M';
const SANDBOX_CPU = '1';

/**
 * Execute a command in the Docker sandbox
 */
async function executeInSandbox(
  skillPath: string,
  command: string,
  timeout: number = SANDBOX_TIMEOUT
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const containerName = `eval-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  try {
    // Create a temporary container for isolation
    const { stdout: containerId } = await execAsync(
      `docker run -d --name ${containerName} ` +
        `--memory=${SANDBOX_MEMORY} ` +
        `--cpus=${SANDBOX_CPU} ` +
        `--network=none ` + // No network access
        `--read-only ` + // Read-only filesystem
        `--tmpfs /tmp ` + // Temp directory for work
        `-v ${skillPath}:/skill:ro ` + // Mount skill read-only
        `skillmarketplace-sandbox ` +
        `sleep ${Math.ceil(timeout / 1000) + 10}`
    );

    // Execute the command inside the container
    const { stdout, stderr } = await execAsync(
      `docker exec ${containerId.trim()} timeout ${Math.ceil(timeout / 1000)} ${command}`,
      { timeout: timeout + 5000 }
    );

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.code || 1,
    };
  } finally {
    // Clean up container
    try {
      await execAsync(`docker rm -f ${containerName}`);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run a single test case
 */
async function runTestCase(
  skillPath: string,
  testCase: EvalJobData['testCases'][0]
): Promise<{ status: TestStatus; output: string; durationMs: number }> {
  const startTime = Date.now();

  try {
    // Execute test in sandbox
    const result = await executeInSandbox(
      skillPath,
      `python3 -c "import sys; print('${testCase.input}')"` // Placeholder for actual test execution
    );

    const durationMs = Date.now() - startTime;
    const output = result.stdout || result.stderr;

    // Check if test passed
    let status: TestStatus = TestStatus.PASSED;

    if (result.exitCode !== 0) {
      status = TestStatus.ERROR;
    } else if (testCase.expectedOutput) {
      // Exact match check
      if (output.trim() !== testCase.expectedOutput.trim()) {
        status = TestStatus.FAILED;
      }
    } else if (testCase.expectedPatterns && testCase.expectedPatterns.length > 0) {
      // Pattern match check
      for (const pattern of testCase.expectedPatterns) {
        if (!output.includes(pattern)) {
          status = TestStatus.FAILED;
          break;
        }
      }
    }

    return {
      status,
      output,
      durationMs,
    };
  } catch (error) {
    return {
      status: TestStatus.ERROR,
      output: error instanceof Error ? error.message : 'Unknown error',
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * Process an evaluation job
 */
export async function processEvaluationJob(
  job: Job<EvalJobData>
): Promise<void> {
  const { skillVersionId, testCases, skillPath } = job.data;
  const evalQueueId = job.id;

  if (!evalQueueId) {
    throw new Error('Job ID is required');
  }

  try {
    // Update status to running
    await updateEvalStatus(evalQueueId, 'RUNNING');

    // Run each test case
    for (const testCase of testCases) {
      const result = await runTestCase(skillPath, testCase);

      await storeEvalResult(
        evalQueueId,
        testCase.name,
        result.status,
        result.output,
        result.durationMs
      );
    }

    // Update status to completed
    await updateEvalStatus(evalQueueId, 'COMPLETED');
  } catch (error) {
    // Update status to failed
    await updateEvalStatus(
      evalQueueId,
      'FAILED',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  }
}

/**
 * Create and start the evaluation worker
 */
export function createEvalWorker(): Worker<EvalJobData> {
  const worker = new Worker<EvalJobData>(
    'skill-evaluation',
    processEvaluationJob,
    {
      connection: {
        host: new URL(REDIS_URL).hostname,
        port: parseInt(new URL(REDIS_URL).port || '6379'),
      },
      concurrency: 2, // Process 2 jobs at a time
      limiter: {
        max: 10, // Max 10 jobs per minute
        duration: 60000,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`Evaluation job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Evaluation job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// Start worker if run directly
if (require.main === module) {
  console.log('Starting evaluation worker...');
  const worker = createEvalWorker();

  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...');
    await worker.close();
    process.exit(0);
  });
}
