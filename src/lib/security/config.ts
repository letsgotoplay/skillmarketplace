import { prisma } from '@/lib/db';
import type { AIAnalysisConfig } from './ai-analyzer';

/**
 * Get the active security configuration from database.
 * Returns undefined if no config exists (will use default in ai-analyzer).
 */
export async function getActiveSecurityConfig(): Promise<AIAnalysisConfig | undefined> {
  const config = await prisma.securityConfig.findFirst({
    where: { isActive: true },
    select: { systemPrompt: true, rulesJson: true },
  });

  if (!config) return undefined;

  return {
    systemPrompt: config.systemPrompt,
    rules: Array.isArray(config.rulesJson)
      ? (config.rulesJson as AIAnalysisConfig['rules'])
      : undefined,
  };
}
