/**
 * File Preview Configuration
 *
 * This config is used by both server-side (upload) and client-side (preview)
 * to determine which files can be previewed and stored in the database.
 */

/**
 * Maximum file size for storing content in database (in bytes)
 * Files larger than this will not have their content stored for preview
 */
export const MAX_CONTENT_SIZE = 100 * 1024; // 100KB

/**
 * Text file extensions that should have their content stored for preview
 * Add or remove extensions as needed
 */
export const TEXT_FILE_EXTENSIONS = new Set([
  // Documentation
  'md', 'txt', 'rst',

  // Data formats
  'json', 'jsonl', 'yaml', 'yml', 'toml', 'ini', 'env', 'conf', 'csv', 'tsv',

  // Programming languages
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'pyw',
  'rb', 'rake',
  'go', 'mod', 'sum',
  'rs', 'toml',
  'java', 'kt', 'kts',
  'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hxx',
  'cs',
  'php',
  'swift',
  'scala', 'sc',
  'lua',
  'r',
  'sql',
  'sh', 'bash', 'zsh', 'fish', 'ps1', 'psm1', 'bat', 'cmd',

  // Web technologies
  'html', 'htm', 'xhtml',
  'css', 'scss', 'sass', 'less', 'styl',
  'vue', 'svelte',
  'astro',

  // Config/Data
  'xml', 'xsl', 'xslt',
  'svg',
  'graphql', 'gql',
  'proto',
  'tf', 'tfvars', 'hcl',

  // Other text formats
  'log',
  'gitignore', 'dockerignore', 'editorconfig',
  'license',
  'makefile', 'cmake', 'mk',
  'dockerfile',
  'helmfile',
]);

/**
 * Check if a file should have its content stored based on extension and size
 */
export function shouldStoreContent(filePath: string, size: number): boolean {
  if (size > MAX_CONTENT_SIZE) return false;

  const ext = filePath.split('.').pop()?.toLowerCase() || '';

  // Check exact extension match
  if (TEXT_FILE_EXTENSIONS.has(ext)) return true;

  // Check for files without extensions or special names
  const filename = filePath.split('/').pop()?.toLowerCase() || '';
  const specialFiles = [
    'makefile', 'dockerfile', 'rakefile', 'gemfile', 'procfile',
    'license', 'readme', 'changelog', 'authors', 'contributors',
    '.gitignore', '.dockerignore', '.editorignore', '.npmrc', '.nvmrc',
    '.env', '.env.local', '.env.development', '.env.production', '.env.test',
  ];

  return specialFiles.some(sf => filename === sf || filename.endsWith(sf));
}

/**
 * Get text content from a file buffer if it's a text file
 */
export function getTextContent(content: Buffer, filePath: string, size: number): string | null {
  if (!shouldStoreContent(filePath, size)) return null;

  try {
    return content.toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
