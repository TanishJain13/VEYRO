/**
 * GitHub repository metadata retrieval.
 */
import { githubFetch, type GitHubRateLimit } from './client';

interface GitHubRepoResponse {
  full_name: string;
  owner: { login: string };
  name: string;
  description: string | null;
  default_branch: string;
  language: string | null;
  private: boolean;
  visibility: string;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}

interface GitHubBranchResponse {
  name: string;
  commit: {
    sha: string;
  };
}

export interface RepositoryMetadata {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  primaryLanguage: string | null;
  isPrivate: boolean;
  visibility: string;
  stars: number;
  forks: number;
  url: string;
}

export interface ResolvedRepository {
  metadata: RepositoryMetadata;
  branch: string;
  commitSha: string;
  rateLimit: GitHubRateLimit | null;
}

/**
 * Fetch repository metadata and resolve the selected branch to a commit SHA.
 */
export async function resolveRepository(
  owner: string,
  repo: string,
  branch?: string | null,
  signal?: AbortSignal
): Promise<ResolvedRepository> {
  // Support deterministic in-memory sample fixture repository
  if (owner === 'veyro-sample' && repo === 'fixture') {
    const { SAMPLE_RESOLVED_REPO } = await import('@/lib/fixtures/sample-repo');
    return SAMPLE_RESOLVED_REPO;
  }

  // 1. Fetch repository metadata
  const { data: repoData, rateLimit } = await githubFetch<GitHubRepoResponse>(
    `/repos/${owner}/${repo}`,
    { signal }
  );

  const metadata: RepositoryMetadata = {
    owner: repoData.owner.login,
    name: repoData.name,
    fullName: repoData.full_name,
    description: repoData.description,
    defaultBranch: repoData.default_branch,
    primaryLanguage: repoData.language,
    isPrivate: repoData.private,
    visibility: repoData.visibility || (repoData.private ? 'private' : 'public'),
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    url: repoData.html_url,
  };

  // 2. Resolve the selected branch (or use default)
  const selectedBranch = branch || metadata.defaultBranch;

  const { data: branchData } = await githubFetch<GitHubBranchResponse>(
    `/repos/${owner}/${repo}/branches/${encodeURIComponent(selectedBranch)}`,
    { signal }
  );

  return {
    metadata,
    branch: branchData.name,
    commitSha: branchData.commit.sha,
    rateLimit,
  };
}
