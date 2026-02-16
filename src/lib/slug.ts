/**
 * Slug utility functions for GitHub-style skill identification
 * Format: {emailPrefix}/{skillSlug} e.g., alice/pdf-reader
 */

/**
 * Extract email prefix (part before @)
 * alice@example.com → alice
 * alice.wang@company.com → alice.wang
 */
export function extractEmailPrefix(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email.toLowerCase();
  return email.substring(0, atIndex).toLowerCase();
}

/**
 * Generate a URL-friendly slug from a name
 * "PDF Reader" → "pdf-reader"
 * "My Cool Skill!" → "my-cool-skill"
 */
export function generateSkillSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Generate full slug in GitHub format
 * ("alice", "pdf-reader") → "alice/pdf-reader"
 */
export function generateFullSlug(emailPrefix: string, skillSlug: string): string {
  return `${emailPrefix}/${skillSlug}`;
}

/**
 * Parse full slug into components
 * "alice/pdf-reader" → { emailPrefix: "alice", skillSlug: "pdf-reader" }
 */
export function parseFullSlug(fullSlug: string): { emailPrefix: string; skillSlug: string } | null {
  const parts = fullSlug.split('/');
  if (parts.length !== 2) return null;
  return {
    emailPrefix: parts[0],
    skillSlug: parts[1],
  };
}

/**
 * Check if a string is a UUID
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Resolve skill identifier - could be UUID or fullSlug
 * Returns the appropriate where clause for Prisma
 */
export function resolveSkillIdentifier(identifier: string): { id: string } | { fullSlug: string } {
  if (isUUID(identifier)) {
    return { id: identifier };
  }
  return { fullSlug: identifier };
}
