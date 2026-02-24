import { NextResponse } from 'next/server';
import { GITHUB_IMPORT_ENABLED } from '@/lib/config/features';

/**
 * @openapi
 * /features:
 *   get:
 *     tags: [System]
 *     summary: Get feature flags
 *     description: Returns the current state of feature flags
 *     responses:
 *       200:
 *         description: Feature flags
 */
export async function GET() {
  return NextResponse.json({
    githubImport: GITHUB_IMPORT_ENABLED,
  });
}
