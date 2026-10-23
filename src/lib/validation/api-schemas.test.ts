import { describe, it, expect } from 'vitest';
import { parseGitHubUrl, githubUrlSchema } from './api-schemas';

describe('GitHub URL Validation', () => {
  it('parses standard https GitHub URLs', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react');
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: null,
    });
  });

  it('parses URLs with branch and tree path', () => {
    const result = parseGitHubUrl('https://github.com/facebook/react/tree/feature/new-api');
    expect(result).toEqual({
      owner: 'facebook',
      repo: 'react',
      branch: 'feature/new-api',
    });
  });

  it('rejects invalid GitHub URLs', () => {
    expect(parseGitHubUrl('https://gitlab.com/owner/repo')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
  });

  it('validates shorthand owner/repo with schema', () => {
    const parsed = githubUrlSchema.parse('vercel/next.js');
    expect(parsed).toBe('https://github.com/vercel/next.js');
  });

  it('rejects non-github URLs with schema', () => {
    expect(() => githubUrlSchema.parse('https://evil.com/repo')).toThrow();
  });
});
