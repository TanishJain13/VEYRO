/**
 * Server-side environment configuration.
 * All values are validated at startup.
 */

function getEnvInt(key: string, defaultValue: number): number {
  const raw = process.env[key];
  if (!raw) return defaultValue;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 0) {
    console.warn(`Invalid env var ${key}="${raw}", using default ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

function getEnvString(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const serverConfig = {
  /** GitHub personal access token for increased rate limits */
  githubToken: process.env.GITHUB_TOKEN || '',

  /** Maximum files to consider during analysis */
  maxFiles: getEnvInt('VEYRO_MAX_FILES', 1500),

  /** Maximum individual file size in bytes */
  maxFileBytes: getEnvInt('VEYRO_MAX_FILE_BYTES', 300_000),

  /** Maximum total source bytes to retrieve */
  maxTotalSourceBytes: getEnvInt('VEYRO_MAX_TOTAL_SOURCE_BYTES', 15_000_000),

  /** Maximum concurrent content requests */
  maxConcurrency: getEnvInt('VEYRO_MAX_CONCURRENCY', 8),

  /** Analysis timeout in milliseconds */
  analysisTimeoutMs: getEnvInt('VEYRO_ANALYSIS_TIMEOUT_MS', 45_000),

  /** Maximum graph nodes returned to browser */
  maxGraphNodes: getEnvInt('VEYRO_MAX_GRAPH_NODES', 1500),

  /** Maximum graph edges returned to browser */
  maxGraphEdges: getEnvInt('VEYRO_MAX_GRAPH_EDGES', 5000),
} as const;

export const publicConfig = {
  appUrl: getEnvString('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  sourceRepositoryUrl: process.env.NEXT_PUBLIC_SOURCE_REPOSITORY_URL || '',
} as const;

export const ANALYSIS_VERSION = '0.1.0';

/** File patterns to always exclude from analysis */
export const DEFAULT_EXCLUDED_PATTERNS = [
  /^\.git\//,
  /^node_modules\//,
  /^\.next\//,
  /^dist\//,
  /^build\//,
  /^out\//,
  /^\.cache\//,
  /^coverage\//,
  /^\.nyc_output\//,
  /^vendor\//,
  /^__pycache__\//,
  /^\.pytest_cache\//,
  /^\.venv\//,
  /^venv\//,
  /^env\//,
  /^\.env$/,
  /^\.env\./,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.bundle\.js$/,
  /\.map$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.lock$/,
  /\.ico$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.svg$/,
  /\.webp$/,
  /\.mp4$/,
  /\.mp3$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.otf$/,
  /\.pdf$/,
  /\.zip$/,
  /\.tar$/,
  /\.gz$/,
  /\.exe$/,
  /\.dll$/,
  /\.so$/,
  /\.dylib$/,
  /\.wasm$/,
  /\.pem$/,
  /\.key$/,
  /\.crt$/,
  /\.cert$/,
  /id_rsa/,
  /id_ed25519/,
];

/** Sensitive file patterns to never retrieve */
export const SENSITIVE_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.pem$/,
  /\.key$/,
  /\.crt$/,
  /\.cert$/,
  /id_rsa/,
  /id_ed25519/,
  /\.secret/,
  /credentials/i,
];

/** Supported language extensions */
export const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.json': 'json',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.html': 'html',
  '.htm': 'html',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.graphql': 'graphql',
  '.gql': 'graphql',
  '.sql': 'sql',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.dockerfile': 'dockerfile',
};

/** Languages with full parser support */
export const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python', 'json', 'css'];

/** Source extensions for import resolution */
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py'];
