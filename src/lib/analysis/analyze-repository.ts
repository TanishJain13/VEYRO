/**
 * Analysis Orchestrator.
 * Coordinates repository resolution, tree fetching, bounded file retrieval,
 * AST parsing, import resolution, graph generation, and metrics/findings synthesis.
 */
import { resolveRepository, type ResolvedRepository } from '@/lib/github/repository';
import { fetchRepositoryTree } from '@/lib/github/tree';
import { githubFetchRaw } from '@/lib/github/client';
import { getParser } from '@/lib/parsers/registry';
import { resolveImports } from '@/lib/analysis/import-resolution';
import { buildGraph } from '@/lib/analysis/graph-builder';
import { serverConfig, ANALYSIS_VERSION, LANGUAGE_MAP, SUPPORTED_LANGUAGES } from '@/lib/config';
import type {
  RepositoryIdentity,
  RepositoryTreeNode,
  FileRecord,
  AnalysisResult,
  SymbolRecord,
} from '@/types/repository';

export interface AnalysisOptions {
  owner: string;
  repo: string;
  branch?: string | null;
  commitSha?: string | null;
  signal?: AbortSignal;
  /** Optional custom file fetcher for testing/mocking */
  fileFetcher?: (path: string, signal?: AbortSignal) => Promise<string>;
  /** Optional custom tree fetcher for testing/mocking */
  treeFetcher?: () => Promise<{ nodes: RepositoryTreeNode[]; truncated: boolean; totalFiles: number }>;
  /** Optional custom repo resolver for testing/mocking */
  repoResolver?: () => Promise<ResolvedRepository>;
  /** Custom max files limit override */
  maxFiles?: number;
  /** Custom concurrency limit override */
  maxConcurrency?: number;
}

/**
 * Runs the end-to-end repository analysis pipeline.
 */
export async function analyzeRepository(options: AnalysisOptions): Promise<AnalysisResult> {
  const startTime = Date.now();
  const limitsReached: string[] = [];
  let truncated = false;
  let truncationReason: string | null = null;

  // 1. Resolve repository revision & metadata
  const resolvedRepo = options.repoResolver
    ? await options.repoResolver()
    : await resolveRepository(options.owner, options.repo, options.branch, options.signal);

  const pinnedSha = options.commitSha || resolvedRepo.commitSha;

  // 2. Retrieve repository tree
  let treeNodes: RepositoryTreeNode[] = [];
  let treeTotalFiles = 0;

  if (options.treeFetcher) {
    const customTree = await options.treeFetcher();
    treeNodes = customTree.nodes;
    treeTotalFiles = customTree.totalFiles;
    truncated = customTree.truncated;
    if (truncated) {
      truncationReason = 'GitHub tree response was truncated (exceeded 100,000 files)';
      limitsReached.push('TREE_TRUNCATED');
    }
  } else {
    const { tree } = await fetchRepositoryTree(
      options.owner,
      options.repo,
      pinnedSha,
      options.signal
    );
    treeNodes = tree.nodes;
    treeTotalFiles = tree.totalFiles;
    truncated = tree.truncated;
    if (truncated) {
      truncationReason = 'GitHub tree response was truncated (exceeded 100,000 files)';
      limitsReached.push('TREE_TRUNCATED');
    }
  }

  // 3. Flatten tree to get list of filtered files
  const flatFiles = flattenTree(treeNodes);

  // 4. Enforce file count limit
  const maxFiles = options.maxFiles || serverConfig.maxFiles;
  let filesToProcess = flatFiles;
  if (flatFiles.length > maxFiles) {
    filesToProcess = flatFiles.slice(0, maxFiles);
    truncated = true;
    truncationReason = `Repository exceeded maximum file limit of ${maxFiles} files`;
    limitsReached.push('MAX_FILES_EXCEEDED');
  }

  // Prioritize files with dedicated parser support (e.g. ts, js, py, json, css)
  filesToProcess.sort((a, b) => {
    const aSupported = a.language && SUPPORTED_LANGUAGES.includes(a.language) ? 0 : 1;
    const bSupported = b.language && SUPPORTED_LANGUAGES.includes(b.language) ? 0 : 1;
    if (aSupported !== bSupported) return aSupported - bSupported;
    return a.path.localeCompare(b.path);
  });

  // 5. Bounded source retrieval and parsing
  const maxConcurrency = options.maxConcurrency || serverConfig.maxConcurrency;
  let totalRetrievedBytes = 0;
  const filePathsSet = new Set(filesToProcess.map((f) => f.path));

  const fileFetcher =
    options.fileFetcher ||
    ((path: string, sig?: AbortSignal) =>
      githubFetchRaw(options.owner, options.repo, pinnedSha, path, sig));

  const parsedFileRecords = await runWithConcurrency(
    filesToProcess,
    maxConcurrency,
    async (fileNode): Promise<FileRecord> => {
      const ext = getExtension(fileNode.path);
      const language = fileNode.language || LANGUAGE_MAP[ext] || 'unknown';

      // Check single file size limit
      if (fileNode.size && fileNode.size > serverConfig.maxFileBytes) {
        return {
          path: fileNode.path,
          language,
          size: fileNode.size,
          sourceRetrieved: false,
          parserId: 'none',
          parseStatus: 'skipped',
          imports: [],
          exports: [],
          symbols: [],
          lineCount: null,
          errors: [],
          warnings: [],
          skipReason: `File size (${fileNode.size} bytes) exceeds limit (${serverConfig.maxFileBytes} bytes)`,
        };
      }

      // Check total source bytes limit
      if (totalRetrievedBytes >= serverConfig.maxTotalSourceBytes) {
        if (!limitsReached.includes('MAX_SOURCE_BYTES_EXCEEDED')) {
          limitsReached.push('MAX_SOURCE_BYTES_EXCEEDED');
        }
        return {
          path: fileNode.path,
          language,
          size: fileNode.size || 0,
          sourceRetrieved: false,
          parserId: 'none',
          parseStatus: 'skipped',
          imports: [],
          exports: [],
          symbols: [],
          lineCount: null,
          errors: [],
          warnings: [],
          skipReason: 'Total source byte limit reached for repository analysis',
        };
      }

      // Fetch file source content
      let source = '';
      try {
        source = await fileFetcher(fileNode.path, options.signal);
        totalRetrievedBytes += source.length;
      } catch (err) {
        return {
          path: fileNode.path,
          language,
          size: fileNode.size || 0,
          sourceRetrieved: false,
          parserId: 'none',
          parseStatus: 'failed',
          imports: [],
          exports: [],
          symbols: [],
          lineCount: null,
          errors: [
            {
              message: err instanceof Error ? err.message : 'Failed to retrieve file content',
              line: null,
              column: null,
              severity: 'error',
              code: 'CONTENT_RETRIEVAL_ERROR',
            },
          ],
          warnings: [],
          skipReason: null,
        };
      }

      // Parse file source
      try {
        const parser = getParser(language);
        const parseResult = parser.parse({
          filePath: fileNode.path,
          source,
          language,
        });

        return {
          path: fileNode.path,
          language,
          size: source.length,
          sourceRetrieved: true,
          parserId: parseResult.parserId,
          parseStatus: parseResult.parseStatus,
          imports: parseResult.imports,
          exports: parseResult.exports,
          symbols: parseResult.symbols,
          lineCount: parseResult.lineCount,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          skipReason: null,
        };
      } catch (err) {
        return {
          path: fileNode.path,
          language,
          size: source.length,
          sourceRetrieved: true,
          parserId: 'unknown',
          parseStatus: 'failed',
          imports: [],
          exports: [],
          symbols: [],
          lineCount: source.split('\n').length,
          errors: [
            {
              message: err instanceof Error ? err.message : 'Unexpected parser error',
              line: null,
              column: null,
              severity: 'error',
              code: 'PARSER_EXCEPTION',
            },
          ],
          warnings: [],
          skipReason: null,
        };
      }
    }
  );

  // 6. Extract TypeScript path aliases from tsconfig if available
  let tsconfigPaths: Record<string, string[]> | null = null;
  const tsconfigFile = parsedFileRecords.find(
    (f) => f.path.endsWith('tsconfig.json') || f.path === 'tsconfig.json'
  );
  if (tsconfigFile && tsconfigFile.sourceRetrieved) {
    try {
      // Find symbols containing paths or parse tsconfig
      for (const sym of tsconfigFile.symbols) {
        if (sym.id.includes(':alias:')) {
          if (!tsconfigPaths) tsconfigPaths = {};
          tsconfigPaths[sym.name] = [sym.name.replace('*', '')];
        }
      }
    } catch {
      // Non-fatal
    }
  }

  // 7. Resolve Imports across all parsed files
  const resolvedEdges = resolveImports(parsedFileRecords, filePathsSet, tsconfigPaths);

  // 8. Construct Dependency Graph, Metrics, Cycles & Findings
  const { nodes, edges, metrics, findings, coverage } = buildGraph({
    files: parsedFileRecords,
    resolvedEdges,
    totalDiscoveredFiles: Math.max(treeTotalFiles, flatFiles.length),
  });

  // Check graph size limits
  if (nodes.length > serverConfig.maxGraphNodes) {
    limitsReached.push('MAX_GRAPH_NODES_EXCEEDED');
  }
  if (edges.length > serverConfig.maxGraphEdges) {
    limitsReached.push('MAX_GRAPH_EDGES_EXCEEDED');
  }

  // Collect all extracted symbols deterministically
  const allSymbols: SymbolRecord[] = [];
  for (const file of parsedFileRecords) {
    for (const sym of file.symbols) {
      allSymbols.push(sym);
    }
  }
  allSymbols.sort((a, b) => a.filePath.localeCompare(b.filePath) || a.startLine - b.startLine || a.name.localeCompare(b.name));

  const duration = Date.now() - startTime;

  const repository: RepositoryIdentity = {
    owner: resolvedRepo.metadata.owner,
    name: resolvedRepo.metadata.name,
    fullName: resolvedRepo.metadata.fullName,
    url: resolvedRepo.metadata.url,
    description: resolvedRepo.metadata.description,
    defaultBranch: resolvedRepo.metadata.defaultBranch,
    selectedBranch: resolvedRepo.branch,
    commitSha: pinnedSha,
    primaryLanguage: resolvedRepo.metadata.primaryLanguage,
    visibility: resolvedRepo.metadata.isPrivate ? 'private' : 'public',
    stars: resolvedRepo.metadata.stars,
    forks: resolvedRepo.metadata.forks,
    analyzedAt: new Date().toISOString(),
    treeComplete: !truncated,
  };

  return {
    repository,
    files: parsedFileRecords,
    graph: {
      nodes,
      edges,
    },
    symbols: allSymbols,
    findings,
    metrics,
    coverage,
    duration,
    truncated,
    truncationReason,
    limitsReached,
    analysisVersion: ANALYSIS_VERSION,
  };
}

/**
 * Flattens hierarchical tree nodes to a flat array of file nodes.
 */
function flattenTree(nodes: RepositoryTreeNode[]): RepositoryTreeNode[] {
  const result: RepositoryTreeNode[] = [];

  function traverse(list: RepositoryTreeNode[]) {
    for (const node of list) {
      if (node.type === 'file') {
        result.push(node);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return result;
}

function getExtension(filePath: string): string {
  const lastDot = filePath.lastIndexOf('.');
  if (lastDot < 0) return '';
  return filePath.slice(lastDot).toLowerCase();
}

/**
 * Bounded concurrency worker pool.
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx]);
    }
  });

  await Promise.all(workers);
  return results;
}
