import { describe, it, expect } from 'vitest';
import { analyzeRepository } from './analyze-repository';
import { FIXTURE_FILES } from '../../../tests/fixtures/fixture-repo';
import type { ResolvedRepository } from '@/lib/github/repository';
import type { RepositoryTreeNode } from '@/types/repository';

describe('Analysis Orchestrator (analyzeRepository)', () => {
  const mockRepoMetadata: ResolvedRepository = {
    metadata: {
      owner: 'testowner',
      name: 'fixture-repo',
      fullName: 'testowner/fixture-repo',
      description: 'A test fixture repo',
      defaultBranch: 'main',
      primaryLanguage: 'TypeScript',
      isPrivate: false,
      visibility: 'public',
      stars: 42,
      forks: 10,
      url: 'https://github.com/testowner/fixture-repo',
    },
    branch: 'main',
    commitSha: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    rateLimit: null,
  };

  const mockTreeNodes: RepositoryTreeNode[] = Object.keys(FIXTURE_FILES).map((path) => {
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    const lang =
      ext === '.ts' ? 'typescript' : ext === '.json' ? 'json' : ext === '.md' ? 'markdown' : null;
    return {
      path,
      name: path.split('/').pop() || path,
      type: 'file',
      size: FIXTURE_FILES[path].length,
      language: lang,
    };
  });

  it('runs end-to-end analysis on the fixture repository with expected cycles and edges', async () => {
    const result = await analyzeRepository({
      owner: 'testowner',
      repo: 'fixture-repo',
      repoResolver: async () => mockRepoMetadata,
      treeFetcher: async () => ({
        nodes: mockTreeNodes,
        truncated: false,
        totalFiles: mockTreeNodes.length,
      }),
      fileFetcher: async (path: string) => {
        const content = FIXTURE_FILES[path];
        if (content === undefined) throw new Error(`Not found: ${path}`);
        return content;
      },
    });

    expect(result.repository.fullName).toBe('testowner/fixture-repo');
    expect(result.repository.commitSha).toBe('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2');

    // 1. Files
    expect(result.files).toHaveLength(Object.keys(FIXTURE_FILES).length);

    // 2. Verified circular dependency: auth.ts <-> user.ts
    expect(result.metrics.cycles.length).toBeGreaterThanOrEqual(1);
    const cycle = result.metrics.cycles.find((c) => c.includes('src/services/auth.ts'));
    expect(cycle).toBeDefined();
    expect(cycle).toContain('src/services/user.ts');

    // 3. Broken import in token.ts
    const missingFinding = result.findings.find(
      (f) => f.kind === 'unresolved-import' && f.filePath === 'src/services/token.ts'
    );
    expect(missingFinding).toBeDefined();
    expect(missingFinding?.title).toContain('missing-helper');

    // 4. Broken syntax file
    const brokenFile = result.files.find((f) => f.path === 'src/broken.ts');
    expect(brokenFile).toBeDefined();
    expect(['partial', 'failed']).toContain(brokenFile?.parseStatus);

    // 5. Valid graph edges
    const edgeAuthToUser = result.graph.edges.find(
      (e) => e.source === 'src/services/auth.ts' && e.target === 'src/services/user.ts'
    );
    expect(edgeAuthToUser).toBeDefined();

    const edgeTokenToCrypto = result.graph.edges.find(
      (e) => e.source === 'src/services/token.ts' && e.target === 'src/utils/crypto.ts'
    );
    expect(edgeTokenToCrypto).toBeDefined();

    // 6. External package & stdlib in crypto.ts
    const cryptoFile = result.files.find((f) => f.path === 'src/utils/crypto.ts');
    expect(cryptoFile?.imports.some((i) => i.specifier === 'node:crypto')).toBe(true);
    expect(cryptoFile?.imports.some((i) => i.specifier === 'bcrypt')).toBe(true);
  });

  it('respects file count limits and records truncation limit reason', async () => {
    const result = await analyzeRepository({
      owner: 'testowner',
      repo: 'fixture-repo',
      maxFiles: 3,
      repoResolver: async () => mockRepoMetadata,
      treeFetcher: async () => ({
        nodes: mockTreeNodes,
        truncated: false,
        totalFiles: mockTreeNodes.length,
      }),
      fileFetcher: async (path: string) => FIXTURE_FILES[path] || '',
    });

    expect(result.files.length).toBeLessThanOrEqual(3);
    expect(result.truncated).toBe(true);
    expect(result.limitsReached).toContain('MAX_FILES_EXCEEDED');
  });

  it('handles bounded concurrency without unhandled rejections', async () => {
    let concurrentCount = 0;
    let maxSeenConcurrency = 0;

    const result = await analyzeRepository({
      owner: 'testowner',
      repo: 'fixture-repo',
      maxConcurrency: 2,
      repoResolver: async () => mockRepoMetadata,
      treeFetcher: async () => ({
        nodes: mockTreeNodes,
        truncated: false,
        totalFiles: mockTreeNodes.length,
      }),
      fileFetcher: async (path: string) => {
        concurrentCount++;
        maxSeenConcurrency = Math.max(maxSeenConcurrency, concurrentCount);
        // Small artificial delay to test concurrency saturation
        await new Promise((r) => setTimeout(r, 10));
        concurrentCount--;
        return FIXTURE_FILES[path] || '';
      },
    });

    expect(maxSeenConcurrency).toBeLessThanOrEqual(2);
    expect(result.files.length).toBe(mockTreeNodes.length);
  });
});
