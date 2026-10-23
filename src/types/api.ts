/**
 * API response types for VEYRO endpoints.
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  requestId: string;
  timestamp: string;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  retryable: boolean;
  details: string | null;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'REPOSITORY_NOT_FOUND'
  | 'REPOSITORY_PRIVATE'
  | 'BRANCH_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'GITHUB_ERROR'
  | 'ANALYSIS_TIMEOUT'
  | 'ANALYSIS_ERROR'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'PATH_TRAVERSAL'
  | 'UNSUPPORTED_REPOSITORY'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export interface RepositoryRequest {
  url: string;
  branch?: string;
}

export interface TreeRequest {
  owner: string;
  repo: string;
  sha: string;
}

export interface AnalyzeRequest {
  owner: string;
  repo: string;
  sha: string;
  branch: string;
}

export interface FileRequest {
  owner: string;
  repo: string;
  sha: string;
  path: string;
}
