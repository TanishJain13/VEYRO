/**
 * GitHub repository tree retrieval.
 */
import { githubFetch, type GitHubRateLimit } from './client';
import { DEFAULT_EXCLUDED_PATTERNS, SENSITIVE_PATTERNS, LANGUAGE_MAP, serverConfig } from '@/lib/config';
import type { RepositoryTreeNode, RepositoryTree } from '@/types/repository';

interface GitHubTreeResponse {
  sha: string;
  tree: Array<{
    path: string;
    mode: string;
    type: 'blob' | 'tree';
    size?: number;
    sha: string;
  }>;
  truncated: boolean;
}

/**
 * Fetch the repository tree and apply exclusion filters.
 */
export async function fetchRepositoryTree(
  owner: string,
  repo: string,
  sha: string,
  signal?: AbortSignal
): Promise<{ tree: RepositoryTree; rateLimit: GitHubRateLimit | null }> {
  // Support deterministic in-memory sample fixture repository
  if (owner === 'veyro-sample' && repo === 'fixture') {
    const { getSampleTreeNodes, SAMPLE_FILES } = await import('@/lib/fixtures/sample-repo');
    const nodes = getSampleTreeNodes();
    const hierarchicalTree = buildTreeHierarchy(nodes);
    return {
      tree: {
        nodes: hierarchicalTree,
        totalFiles: Object.keys(SAMPLE_FILES).length,
        totalDirectories: 2,
        truncated: false,
      },
      rateLimit: null,
    };
  }

  const { data, rateLimit } = await githubFetch<GitHubTreeResponse>(
    `/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`,
    { signal }
  );

  const allNodes = data.tree;
  let totalFiles = 0;
  let totalDirectories = 0;
  const filteredNodes: RepositoryTreeNode[] = [];

  for (const node of allNodes) {
    if (node.type === 'tree') {
      totalDirectories++;
      continue;
    }

    totalFiles++;

    // Apply exclusion filters
    if (isExcluded(node.path)) continue;
    if (isSensitive(node.path)) continue;

    // Apply file count limit
    if (filteredNodes.length >= serverConfig.maxFiles) continue;

    const ext = getExtension(node.path);
    const language = LANGUAGE_MAP[ext] || null;

    filteredNodes.push({
      path: node.path,
      name: getFileName(node.path),
      type: 'file',
      size: node.size ?? null,
      language,
    });
  }

  // Build tree hierarchy
  const hierarchicalTree = buildTreeHierarchy(filteredNodes);

  return {
    tree: {
      nodes: hierarchicalTree,
      totalFiles,
      totalDirectories,
      truncated: data.truncated,
    },
    rateLimit,
  };
}

function isExcluded(path: string): boolean {
  return DEFAULT_EXCLUDED_PATTERNS.some((pattern) => pattern.test(path));
}

function isSensitive(path: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(path));
}

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf('.');
  if (lastDot < 0) return '';
  return path.slice(lastDot).toLowerCase();
}

function getFileName(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  return lastSlash < 0 ? path : path.slice(lastSlash + 1);
}

/**
 * Build a hierarchical tree structure from flat file paths.
 */
function buildTreeHierarchy(files: RepositoryTreeNode[]): RepositoryTreeNode[] {
  const root: RepositoryTreeNode[] = [];
  const dirMap = new Map<string, RepositoryTreeNode>();

  // Sort to process directories before deeper files
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sorted) {
    const parts = file.path.split('/');

    if (parts.length === 1) {
      root.push(file);
      continue;
    }

    // Ensure all parent directories exist
    let currentPath = '';
    let currentChildren = root;

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];

      let dir = dirMap.get(currentPath);
      if (!dir) {
        dir = {
          path: currentPath,
          name: parts[i],
          type: 'directory',
          size: null,
          language: null,
          children: [],
        };
        dirMap.set(currentPath, dir);
        currentChildren.push(dir);
      }
      currentChildren = dir.children!;
    }

    currentChildren.push(file);
  }

  // Sort: directories first, then alphabetical
  sortTree(root);
  return root;
}

function sortTree(nodes: RepositoryTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    if (node.children) {
      sortTree(node.children);
    }
  }
}
