/**
 * Feature Flags Configuration
 *
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables.
 */

/**
 * Enable GitHub repository import feature
 * @default true
 */
export const GITHUB_IMPORT_ENABLED =
  process.env.GITHUB_IMPORT_ENABLED !== 'false';

/**
 * Feature flags object for easy access
 */
export const features = {
  githubImport: GITHUB_IMPORT_ENABLED,
} as const;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}
