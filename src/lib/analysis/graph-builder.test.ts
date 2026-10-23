import { describe, it, expect } from 'vitest';
import { buildGraph, isEntryPoint, isConfigFile } from './graph-builder';
import type { FileRecord, DependencyEdge } from '@/types/repository';

describe('Graph Builder', () => {
  it('correctly classifies entry points and config files', () => {
    expect(isEntryPoint('src/index.ts')).toBe(true);
    expect(isEntryPoint('main.py')).toBe(true);
    expect(isEntryPoint('src/app/page.tsx')).toBe(true);
    expect(isEntryPoint('src/utils/math.ts')).toBe(false);

    expect(isConfigFile('package.json')).toBe(true);
    expect(isConfigFile('tsconfig.json')).toBe(true);
    expect(isConfigFile('vite.config.ts')).toBe(true);
    expect(isConfigFile('src/components/card.tsx')).toBe(false);
  });

  it('builds nodes and edges only for valid internal dependencies', () => {
    const files: FileRecord[] = [
      {
        path: 'src/a.ts',
        language: 'typescript',
        size: 100,
        sourceRetrieved: true,
        parserId: 'veyro-ts-v1',
        parseStatus: 'success',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 10,
        errors: [],
        warnings: [],
        skipReason: null,
      },
      {
        path: 'src/b.ts',
        language: 'typescript',
        size: 120,
        sourceRetrieved: true,
        parserId: 'veyro-ts-v1',
        parseStatus: 'success',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 12,
        errors: [],
        warnings: [],
        skipReason: null,
      },
    ];

    const edges: DependencyEdge[] = [
      {
        source: 'src/a.ts',
        target: 'src/b.ts',
        specifier: './b',
        kind: 'import',
        resolutionStatus: 'resolved',
        sourceLine: 1,
        resolutionMethod: 'relative-path',
        unresolvedReason: null,
      },
      // External package — must NOT create an internal graph edge
      {
        source: 'src/a.ts',
        target: null,
        specifier: 'react',
        kind: 'import',
        resolutionStatus: 'external-package',
        sourceLine: 2,
        resolutionMethod: 'heuristic',
        unresolvedReason: 'External npm package',
      },
      // Broken import — must NOT create an internal graph edge
      {
        source: 'src/b.ts',
        target: null,
        specifier: './c',
        kind: 'import',
        resolutionStatus: 'missing-file',
        sourceLine: 1,
        resolutionMethod: 'none',
        unresolvedReason: 'Missing file',
      },
    ];

    const result = buildGraph({
      files,
      resolvedEdges: edges,
      totalDiscoveredFiles: 2,
    });

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]).toMatchObject({
      source: 'src/a.ts',
      target: 'src/b.ts',
      specifier: './b',
    });

    // Degree verification
    expect(result.metrics.highDependencyFiles[0]).toEqual({ path: 'src/a.ts', count: 1 });
    expect(result.metrics.highDependentFiles[0]).toEqual({ path: 'src/b.ts', count: 1 });
    expect(result.metrics.totalResolvedDependencies).toBe(1);
    expect(result.metrics.totalUnresolvedImports).toBe(1); // './c' is unresolved
  });

  it('detects circular dependencies using Tarjan SCC and ignores acyclic nodes', () => {
    const files: FileRecord[] = ['src/a.ts', 'src/b.ts', 'src/c.ts', 'src/d.ts'].map((path) => ({
      path,
      language: 'typescript',
      size: 50,
      sourceRetrieved: true,
      parserId: 'veyro-ts-v1',
      parseStatus: 'success',
      imports: [],
      exports: [],
      symbols: [],
      lineCount: 5,
      errors: [],
      warnings: [],
      skipReason: null,
    }));

    // a -> b -> c -> a (cycle of 3)
    // a -> d (d is not in cycle)
    const edges: DependencyEdge[] = [
      {
        source: 'src/a.ts',
        target: 'src/b.ts',
        specifier: './b',
        kind: 'import',
        resolutionStatus: 'resolved',
        sourceLine: 1,
        resolutionMethod: 'relative-path',
        unresolvedReason: null,
      },
      {
        source: 'src/b.ts',
        target: 'src/c.ts',
        specifier: './c',
        kind: 'import',
        resolutionStatus: 'resolved',
        sourceLine: 1,
        resolutionMethod: 'relative-path',
        unresolvedReason: null,
      },
      {
        source: 'src/c.ts',
        target: 'src/a.ts',
        specifier: './a',
        kind: 'import',
        resolutionStatus: 'resolved',
        sourceLine: 1,
        resolutionMethod: 'relative-path',
        unresolvedReason: null,
      },
      {
        source: 'src/a.ts',
        target: 'src/d.ts',
        specifier: './d',
        kind: 'import',
        resolutionStatus: 'resolved',
        sourceLine: 2,
        resolutionMethod: 'relative-path',
        unresolvedReason: null,
      },
    ];

    const result = buildGraph({
      files,
      resolvedEdges: edges,
      totalDiscoveredFiles: 4,
    });

    expect(result.metrics.cycles).toHaveLength(1);
    const cycle = result.metrics.cycles[0];
    expect(cycle).toHaveLength(3);
    expect(cycle).toContain('src/a.ts');
    expect(cycle).toContain('src/b.ts');
    expect(cycle).toContain('src/c.ts');
    expect(cycle).not.toContain('src/d.ts');

    // Finding generated for cycle
    const cycleFinding = result.findings.find((f) => f.kind === 'cycle-detected');
    expect(cycleFinding).toBeDefined();
    expect(cycleFinding?.severity).toBe('warning');
  });

  it('accurately calculates coverage and percentages', () => {
    const files: FileRecord[] = [
      {
        path: 'src/ok1.ts',
        language: 'typescript',
        size: 50,
        sourceRetrieved: true,
        parserId: 'veyro-ts-v1',
        parseStatus: 'success',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 5,
        errors: [],
        warnings: [],
        skipReason: null,
      },
      {
        path: 'src/ok2.ts',
        language: 'typescript',
        size: 50,
        sourceRetrieved: true,
        parserId: 'veyro-ts-v1',
        parseStatus: 'success',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 5,
        errors: [],
        warnings: [],
        skipReason: null,
      },
      {
        path: 'src/fail.ts',
        language: 'typescript',
        size: 50,
        sourceRetrieved: true,
        parserId: 'veyro-ts-v1',
        parseStatus: 'failed',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 5,
        errors: [{ message: 'Syntax error', line: 1, column: 1, severity: 'error', code: null }],
        warnings: [],
        skipReason: null,
      },
      {
        path: 'docs/guide.txt',
        language: 'unknown',
        size: 50,
        sourceRetrieved: true,
        parserId: 'fallback',
        parseStatus: 'unsupported',
        imports: [],
        exports: [],
        symbols: [],
        lineCount: 5,
        errors: [],
        warnings: [],
        skipReason: null,
      },
    ];

    const result = buildGraph({
      files,
      resolvedEdges: [],
      totalDiscoveredFiles: 10,
    });

    expect(result.coverage).toEqual({
      totalFiles: 10,
      analyzedFiles: 4,
      successfulFiles: 2,
      partialFiles: 0,
      failedFiles: 1,
      skippedFiles: 0,
      unsupportedFiles: 1,
      coveragePercent: 40.0,
      successPercent: 50.0,
    });
  });
});
