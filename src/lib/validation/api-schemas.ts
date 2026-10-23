/**
 * GitHub API validation schemas using Zod.
 */
import { z } from 'zod';

/** Validates and extracts owner/repo/branch from a GitHub URL */
export const githubUrlSchema = z
  .string()
  .trim()
  .min(1, 'Repository URL is required')
  .transform((url) => {
    // Normalize: remove trailing slashes, .git suffix
    let cleaned = url.replace(/\/+$/, '').replace(/\.git$/, '');

    // Support shorthand: owner/repo
    if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(cleaned)) {
      cleaned = `https://github.com/${cleaned}`;
    }

    return cleaned;
  })
  .pipe(
    z.string().refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.hostname === 'github.com';
        } catch {
          return false;
        }
      },
      { message: 'Only GitHub repository URLs are supported' }
    )
  );

const RESERVED_GITHUB_NAMES = new Set([
  'features',
  'topics',
  'collections',
  'trending',
  'events',
  'sponsors',
  'settings',
  'pricing',
  'about',
  'login',
  'join',
  'orgs',
  'organizations',
  'search',
  'marketplace',
  'explore',
  'notifications',
]);

/** Common hardened field schemas */
export const ownerSchema = z
  .string()
  .trim()
  .min(1, 'Owner name is required')
  .max(100, 'Owner name exceeds 100 characters')
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9_.-]*)$/, 'Invalid owner format')
  .refine((o) => !o.includes('..'), { message: 'Owner cannot contain path traversal' })
  .refine((o) => !RESERVED_GITHUB_NAMES.has(o.toLowerCase()), { message: 'Reserved GitHub path is not a repository' });

export const repoSchema = z
  .string()
  .trim()
  .min(1, 'Repository name is required')
  .max(100, 'Repository name exceeds 100 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid repository name format')
  .refine((r) => !r.includes('..') && !r.startsWith('.'), { message: 'Invalid repository name' });

export const shaSchema = z
  .string()
  .trim()
  .min(1, 'Commit SHA or branch is required')
  .max(64, 'Commit reference exceeds 64 characters')
  .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid commit reference format')
  .refine((s) => !s.includes('..') && !s.includes('/') && !s.includes('\\'), {
    message: 'Ref cannot contain path traversal',
  });

export const filePathSchema = z
  .string()
  .trim()
  .min(1, 'File path is required')
  .max(500, 'File path exceeds 500 characters')
  .refine((p) => !p.includes('..'), { message: 'Path traversal not allowed' })
  .refine((p) => !p.startsWith('/') && !p.startsWith('\\'), { message: 'Path must be relative' })
  .refine((p) => !/^[a-zA-Z]:/.test(p), { message: 'Absolute drive letters not allowed' })
  .refine((p) => !p.includes('\\'), { message: 'Backslashes not allowed in file paths' })
  .refine((p) => !p.includes('\0'), { message: 'Null bytes not allowed' });

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
  branch: string | null;
}

/**
 * Parse a validated GitHub URL into its components.
 */
export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
      return null;
    }
    const parts = parsed.pathname.split('/').filter(Boolean);

    if (parts.length < 2) return null;

    const owner = parts[0];
    const repo = parts[1];

    // Check for malicious or reserved owner/repo names
    if (!owner || !repo) return null;
    if (owner.startsWith('.') || repo.startsWith('.')) return null;
    if (owner.includes('..') || repo.includes('..')) return null;
    if (RESERVED_GITHUB_NAMES.has(owner.toLowerCase())) return null;
    if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) return null;

    let branch: string | null = null;
    if (parts.length >= 4 && (parts[2] === 'tree' || parts[2] === 'blob')) {
      branch = parts.slice(3).join('/');
      if (branch.includes('..')) return null;
    } else if (parts.length > 2) {
      // Unrecognized extra path segments (e.g. /pulls, /issues, /actions)
      return null;
    }

    return { owner, repo, branch };
  } catch {
    return null;
  }
}

/** API request schemas */
export const repositoryRequestSchema = z.object({
  url: githubUrlSchema,
  branch: z.string().trim().max(100).optional(),
});

export const treeRequestSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  sha: shaSchema,
});

export const analyzeRequestSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  sha: shaSchema,
  branch: z.string().trim().max(100).min(1),
});

export const fileRequestSchema = z.object({
  owner: ownerSchema,
  repo: repoSchema,
  sha: shaSchema,
  path: filePathSchema,
});
