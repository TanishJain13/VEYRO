import { describe, it, expect } from 'vitest';
import { resolveImports } from './import-resolution';
import type { FileRecord } from '@/types/repository';

describe('Import Resolution Engine', () => {
  const repositoryFiles = new Set([
    'src/index.ts',
    'src/utils/math.ts',
    'src/utils/index.ts',
    'src/components/button.tsx',
    'src/styles/theme.css',
    'package.json',
    'python_app/main.py',
    'python_app/helpers.py',
  ]);

  const tsconfigPaths = {
    '@/*': ['./src/*'],
  };

  it('resolves relative TypeScript imports with and without extension', () => {
    const fileRecord: FileRecord = {
      path: 'src/index.ts',
      language: 'typescript',
      size: 100,
      sourceRetrieved: true,
      parserId: 'veyro-ts-v1',
      parseStatus: 'success',
      imports: [
        {
          specifier: './utils/math',
          kind: 'esm-static',
          names: [{ name: 'add', alias: null, isDefault: false, isNamespace: false }],
          line: 1,
          column: 1,
          isDynamic: false,
        },
        {
          specifier: './utils',
          kind: 'esm-static',
          names: [{ name: 'helpers', alias: null, isDefault: true, isNamespace: false }],
          line: 2,
          column: 1,
          isDynamic: false,
        },
      ],
      exports: [],
      symbols: [],
      lineCount: 10,
      errors: [],
      warnings: [],
      skipReason: null,
    };

    const edges = resolveImports([fileRecord], repositoryFiles, tsconfigPaths);

    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      source: 'src/index.ts',
      target: 'src/utils/math.ts',
      resolutionStatus: 'resolved',
    });
    expect(edges[1]).toMatchObject({
      source: 'src/index.ts',
      target: 'src/utils/index.ts',
      resolutionStatus: 'resolved',
    });
  });

  it('resolves path alias imports using tsconfig paths', () => {
    const fileRecord: FileRecord = {
      path: 'src/index.ts',
      language: 'typescript',
      size: 100,
      sourceRetrieved: true,
      parserId: 'veyro-ts-v1',
      parseStatus: 'success',
      imports: [
        {
          specifier: '@/components/button',
          kind: 'esm-static',
          names: [{ name: 'Button', alias: null, isDefault: true, isNamespace: false }],
          line: 1,
          column: 1,
          isDynamic: false,
        },
      ],
      exports: [],
      symbols: [],
      lineCount: 5,
      errors: [],
      warnings: [],
      skipReason: null,
    };

    const edges = resolveImports([fileRecord], repositoryFiles, tsconfigPaths);

    expect(edges[0]).toMatchObject({
      source: 'src/index.ts',
      target: 'src/components/button.tsx',
      resolutionStatus: 'resolved',
    });
  });

  it('marks external npm packages and standard library modules accurately', () => {
    const fileRecord: FileRecord = {
      path: 'src/index.ts',
      language: 'typescript',
      size: 100,
      sourceRetrieved: true,
      parserId: 'veyro-ts-v1',
      parseStatus: 'success',
      imports: [
        {
          specifier: 'react',
          kind: 'esm-static',
          names: [{ name: 'React', alias: null, isDefault: true, isNamespace: false }],
          line: 1,
          column: 1,
          isDynamic: false,
        },
        {
          specifier: 'node:path',
          kind: 'esm-static',
          names: [{ name: 'path', alias: null, isDefault: true, isNamespace: false }],
          line: 2,
          column: 1,
          isDynamic: false,
        },
        {
          specifier: './does-not-exist',
          kind: 'esm-static',
          names: [{ name: 'ghost', alias: null, isDefault: true, isNamespace: false }],
          line: 3,
          column: 1,
          isDynamic: false,
        },
      ],
      exports: [],
      symbols: [],
      lineCount: 10,
      errors: [],
      warnings: [],
      skipReason: null,
    };

    const edges = resolveImports([fileRecord], repositoryFiles, tsconfigPaths);

    expect(edges[0].resolutionStatus).toBe('external-package');
    expect(edges[1].resolutionStatus).toBe('standard-library');
    expect(edges[2].resolutionStatus).toBe('missing-file');
    expect(edges[2].target).toBeNull();
  });

  it('resolves Python relative and module imports', () => {
    const fileRecord: FileRecord = {
      path: 'python_app/main.py',
      language: 'python',
      size: 100,
      sourceRetrieved: true,
      parserId: 'veyro-py-v1',
      parseStatus: 'success',
      imports: [
        {
          specifier: '.helpers',
          kind: 'python-from-import',
          names: [{ name: 'sanitize', alias: null, isDefault: false, isNamespace: false }],
          line: 1,
          column: 1,
          isDynamic: false,
        },
        {
          specifier: 'sys',
          kind: 'python-import',
          names: [{ name: 'sys', alias: null, isDefault: false, isNamespace: false }],
          line: 2,
          column: 1,
          isDynamic: false,
        },
      ],
      exports: [],
      symbols: [],
      lineCount: 10,
      errors: [],
      warnings: [],
      skipReason: null,
    };

    const edges = resolveImports([fileRecord], repositoryFiles);

    expect(edges[0]).toMatchObject({
      source: 'python_app/main.py',
      target: 'python_app/helpers.py',
      resolutionStatus: 'resolved',
    });
    expect(edges[1].resolutionStatus).toBe('standard-library');
  });
});
