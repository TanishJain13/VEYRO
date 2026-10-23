/**
 * Standardized API response and error helpers.
 */
import { NextResponse } from 'next/server';
import type { ApiResponse, ApiErrorCode } from '@/types/api';
import { isGitHubError } from '@/lib/github/client';
import { ZodError } from 'zod';

export function createSuccessResponse<T>(data: T, status = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  status = 400,
  details: string | null = null,
  retryable = false
) {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      retryable,
      details,
    },
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response, { status });
}

export function handleApiError(err: unknown) {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return createErrorResponse('VALIDATION_ERROR', 'Invalid request parameters', 400, issues);
  }

  if (isGitHubError(err)) {
    if (err.rateLimitExceeded || err.status === 429) {
      return createErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN or wait before retrying.',
        429,
        err.retryAfter ? `Retry after ${err.retryAfter} seconds` : null,
        true
      );
    }

    if (err.status === 404) {
      return createErrorResponse(
        'REPOSITORY_NOT_FOUND',
        'Repository or branch not found on GitHub. Check the repository URL and permissions.',
        404,
        null
      );
    }

    if (err.status === 403) {
      return createErrorResponse(
        'REPOSITORY_PRIVATE',
        'Repository is private or access is forbidden.',
        403,
        null
      );
    }

    return createErrorResponse(
      'GITHUB_ERROR',
      err.message || 'GitHub API returned an error',
      err.status >= 400 && err.status < 600 ? err.status : 502,
      null,
      err.status >= 500
    );
  }

  if (err instanceof DOMException && err.name === 'AbortError') {
    return createErrorResponse(
      'ANALYSIS_TIMEOUT',
      'Analysis request was aborted or timed out',
      408,
      null,
      true
    );
  }

  // Prevent leaking internal error stack traces or environment secrets
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd
    ? 'An unexpected internal error occurred while processing the repository'
    : err instanceof Error
      ? err.message
      : 'An unexpected error occurred';
  return createErrorResponse('INTERNAL_ERROR', message, 500);
}
