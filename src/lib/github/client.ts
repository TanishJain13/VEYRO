/**
 * Server-only GitHub API client.
 * Handles authentication, rate limits, and error normalization.
 */
import { serverConfig } from '@/lib/config';

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface GitHubError {
  status: number;
  message: string;
  rateLimitExceeded: boolean;
  rateLimit: GitHubRateLimit | null;
  retryAfter: number | null;
}

let lastRateLimit: GitHubRateLimit | null = null;

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'VEYRO-Codebase-Explorer/0.1',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (serverConfig.githubToken) {
    headers.Authorization = `Bearer ${serverConfig.githubToken}`;
  }

  return headers;
}

function parseRateLimit(response: Response): GitHubRateLimit | null {
  const limit = response.headers.get('x-ratelimit-limit');
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  const used = response.headers.get('x-ratelimit-used');

  if (!limit || !remaining || !reset) return null;

  const rl: GitHubRateLimit = {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: parseInt(reset, 10),
    used: used ? parseInt(used, 10) : 0,
  };

  lastRateLimit = rl;
  return rl;
}

export function getLastRateLimit(): GitHubRateLimit | null {
  return lastRateLimit;
}

/**
 * Make a GitHub API request with error handling and SSRF safeguards.
 */
export async function githubFetch<T>(
  path: string,
  options: {
    method?: string;
    signal?: AbortSignal;
    accept?: string;
  } = {}
): Promise<{ data: T; rateLimit: GitHubRateLimit | null }> {
  // SSRF guard: strictly permit api.github.com
  let url: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    const parsed = new URL(path);
    if (parsed.hostname !== 'api.github.com') {
      throw createGitHubError(400, `SSRF Guard: Unauthorized host ${parsed.hostname}`, null);
    }
    url = path;
  } else {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    url = `https://api.github.com${cleanPath}`;
  }

  const headers = getHeaders();
  if (options.accept) {
    (headers as Record<string, string>).Accept = options.accept;
  }

  // Enforce bounded timeout (15s default if no external signal provided)
  const timeoutSignal = AbortSignal.timeout(15_000);
  const effectiveSignal = options.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      signal: effectiveSignal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createGitHubError(408, 'GitHub API request timed out or was cancelled', null);
    }
    throw createGitHubError(0, 'Network error connecting to GitHub', null);
  }

  const rateLimit = parseRateLimit(response);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    let message = `GitHub API error: ${response.status}`;

    try {
      const json = JSON.parse(body);
      if (json.message) message = json.message;
    } catch {
      // use default message
    }

    const error = createGitHubError(response.status, message, rateLimit);

    if (response.status === 429 || (response.status === 403 && rateLimit && rateLimit.remaining === 0)) {
      error.rateLimitExceeded = true;
      const retryAfter = response.headers.get('retry-after');
      if (retryAfter) {
        error.retryAfter = parseInt(retryAfter, 10);
      } else if (rateLimit) {
        error.retryAfter = Math.max(0, rateLimit.reset - Math.floor(Date.now() / 1000));
      }
    }

    throw error;
  }

  const data = (await response.json()) as T;
  return { data, rateLimit };
}

/**
 * Fetch raw file content from GitHub with path traversal prevention and size boundaries.
 */
export async function githubFetchRaw(
  owner: string,
  repo: string,
  sha: string,
  path: string,
  signal?: AbortSignal
): Promise<string> {
  // Guard against path traversal or malicious path characters
  if (path.includes('..') || path.startsWith('/') || path.startsWith('\\') || path.includes('\0')) {
    throw createGitHubError(400, `Path traversal or invalid path detected: ${path}`, null);
  }

  // Support deterministic in-memory sample fixture repository
  if (owner === 'veyro-sample' && repo === 'fixture') {
    const { SAMPLE_FILES } = await import('@/lib/fixtures/sample-repo');
    const content = SAMPLE_FILES[path];
    if (content === undefined) {
      throw createGitHubError(404, `File not found in sample repository: ${path}`, null);
    }
    return content;
  }

  const cleanPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(sha)}/${cleanPath}`;

  const timeoutSignal = AbortSignal.timeout(15_000);
  const effectiveSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'VEYRO-Codebase-Explorer/0.1',
      },
      signal: effectiveSignal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw createGitHubError(408, 'File retrieval request timed out or was cancelled', null);
    }
    throw createGitHubError(0, 'Network error fetching file content', null);
  }

  if (!response.ok) {
    throw createGitHubError(
      response.status,
      `Failed to fetch file: ${path} (${response.status})`,
      null
    );
  }

  // Check Content-Length header against max file size limit
  const contentLengthHeader = response.headers.get('content-length');
  if (contentLengthHeader) {
    const length = parseInt(contentLengthHeader, 10);
    if (!isNaN(length) && length > serverConfig.maxFileBytes) {
      throw createGitHubError(
        413,
        `File ${path} exceeds configured maximum size of ${serverConfig.maxFileBytes} bytes`,
        null
      );
    }
  }

  const text = await response.text();
  if (text.length > serverConfig.maxFileBytes) {
    throw createGitHubError(
      413,
      `File ${path} exceeds configured maximum size of ${serverConfig.maxFileBytes} bytes`,
      null
    );
  }

  return text;
}

function createGitHubError(
  status: number,
  message: string,
  rateLimit: GitHubRateLimit | null
): GitHubError {
  return {
    status,
    message,
    rateLimitExceeded: false,
    rateLimit,
    retryAfter: null,
  };
}

export function isGitHubError(error: unknown): error is GitHubError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'rateLimitExceeded' in error
  );
}
