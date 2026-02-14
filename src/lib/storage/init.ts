import { ensureBucket } from './index';

let initialized = false;

/**
 * Initialize storage (ensure bucket exists)
 * Call this when the app starts
 */
export async function initializeStorage(): Promise<void> {
  if (initialized) return;

  try {
    await ensureBucket();
    console.log(`[Storage] Bucket initialized successfully`);
    initialized = true;
  } catch (error) {
    console.error('[Storage] Failed to initialize bucket:', error);
    throw error;
  }
}
