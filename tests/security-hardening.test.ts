import { describe, it, expect } from 'vitest';
import {
  parseGitHubUrl,
  ownerSchema,
  repoSchema,
  shaSchema,
  filePathSchema,
  treeRequestSchema,
  fileRequestSchema,
} from '@/lib/validation/api-schemas';
import { githubFetch, githubFetchRaw } from '@/lib/github/client';
import { handleApiError } from '@/lib/api/response';

describe('Security and API Hardening', () => {
  describe('Input Validation & Path Traversal Prevention', () => {
    it('rejects reserved GitHub keywords as owners', () => {
      expect(parseGitHubUrl('https://github.com/settings/profile')).toBeNull();
      expect(parseGitHubUrl('https://github.com/features/actions')).toBeNull();
      expect(parseGitHubUrl('https://github.com/pricing/team')).toBeNull();
      expect(parseGitHubUrl('https://github.com/orgs/company')).toBeNull();
    });

    it('rejects non-GitHub domains and malformed URLs', () => {
      expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(parseGitHubUrl('https://evil.com/github.com/owner/repo')).toBeNull();
      expect(parseGitHubUrl('not-a-url')).toBeNull();
      expect(parseGitHubUrl('https://github.com/')).toBeNull();
      expect(parseGitHubUrl('https://github.com/single-part')).toBeNull();
    });

    it('rejects path traversal in owner, repo, sha, and file path', () => {
      expect(() => ownerSchema.parse('../etc')).toThrow();
      expect(() => ownerSchema.parse('owner/sub')).toThrow();

      expect(() => repoSchema.parse('..')).toThrow();
      expect(() => repoSchema.parse('.hidden')).toThrow();

      expect(() => shaSchema.parse('../main')).toThrow();
      expect(() => shaSchema.parse('refs/heads/main')).toThrow();

      expect(() => filePathSchema.parse('../etc/passwd')).toThrow();
      expect(() => filePathSchema.parse('/etc/passwd')).toThrow();
      expect(() => filePathSchema.parse('C:\\Windows\\system32')).toThrow();
      expect(() => filePathSchema.parse('file.ts\0.js')).toThrow();
    });

    it('accepts valid GitHub owners, repos, shas, and file paths', () => {
      expect(ownerSchema.parse('facebook')).toBe('facebook');
      expect(ownerSchema.parse('vercel-labs')).toBe('vercel-labs');

      expect(repoSchema.parse('react')).toBe('react');
      expect(repoSchema.parse('next.js')).toBe('next.js');

      expect(shaSchema.parse('7fd1a60b01f91b314f59955a4e4d4e80d8edf11d')).toBe(
        '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d'
      );
      expect(shaSchema.parse('main')).toBe('main');

      expect(filePathSchema.parse('src/index.ts')).toBe('src/index.ts');
      expect(filePathSchema.parse('deep/nested/folder/component.tsx')).toBe(
        'deep/nested/folder/component.tsx'
      );
    });

    it('validates tree and file request schemas', () => {
      expect(() =>
        treeRequestSchema.parse({ owner: 'facebook', repo: 'react', sha: 'main' })
      ).not.toThrow();

      expect(() =>
        fileRequestSchema.parse({
          owner: 'facebook',
          repo: 'react',
          sha: 'main',
          path: 'package.json',
        })
      ).not.toThrow();

      // Malicious path in file request
      expect(() =>
        fileRequestSchema.parse({
          owner: 'facebook',
          repo: 'react',
          sha: 'main',
          path: '../../etc/passwd',
        })
      ).toThrow();
    });
  });

  describe('SSRF and Network Boundaries', () => {
    it('blocks arbitrary outbound hosts in githubFetch', async () => {
      await expect(
        githubFetch('https://evil.com/malicious/endpoint')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('SSRF Guard'),
      });
    });

    it('rejects path traversal in githubFetchRaw', async () => {
      await expect(
        githubFetchRaw('facebook', 'react', 'main', '../package.json')
      ).rejects.toMatchObject({
        status: 400,
        message: expect.stringContaining('Path traversal'),
      });
    });
  });

  describe('API Error Normalization and Status Codes', () => {
    it('returns standard HTTP 404 for repository not found', async () => {
      const gitHub404Error = {
        status: 404,
        message: 'Not Found',
        rateLimitExceeded: false,
        rateLimit: null,
        retryAfter: null,
      };

      const res = handleApiError(gitHub404Error);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('REPOSITORY_NOT_FOUND');
    });

    it('returns HTTP 429 for rate limit exceeded', async () => {
      const rateLimitError = {
        status: 429,
        message: 'Rate limit exceeded',
        rateLimitExceeded: true,
        rateLimit: { limit: 60, remaining: 0, reset: 1700000000, used: 60 },
        retryAfter: 120,
      };

      const res = handleApiError(rateLimitError);
      expect(res.status).toBe(429);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(json.error.retryable).toBe(true);
    });

    it('returns HTTP 408 for timeout AbortError', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      const res = handleApiError(abortError);
      expect(res.status).toBe(408);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ANALYSIS_TIMEOUT');
    });
  });
});
