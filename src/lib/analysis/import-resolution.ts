/**
 * Import resolution engine.
 * Resolves import specifiers to actual repository file paths.
 */
import type { DependencyEdge, DependencyKind, ResolutionStatus, FileRecord } from '@/types/repository';
import { SOURCE_EXTENSIONS } from '@/lib/config';

interface TsConfigPaths {
  [alias: string]: string[];
}

/**
 * Resolve all imports for the analyzed files.
 */
export function resolveImports(
  files: FileRecord[],
  filePaths: Set<string>,
  tsconfigPaths?: TsConfigPaths | null
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  for (const file of files) {
    for (const imp of file.imports) {
      const edge = resolveImport(
        file.path,
        imp.specifier,
        imp.kind === 'esm-dynamic' ? 'dynamic-import'
          : imp.kind === 'commonjs' ? 'require'
          : imp.kind === 'python-import' || imp.kind === 'python-from-import' ? 'python-import'
          : imp.kind === 'css-import' ? 'css-import'
          : imp.kind === 'side-effect' ? 'side-effect'
          : 'import',
        imp.line,
        filePaths,
        file.language,
        tsconfigPaths
      );
      edges.push(edge);
    }
  }

  return edges;
}

function resolveImport(
  sourceFile: string,
  specifier: string,
  kind: DependencyKind,
  line: number | null,
  filePaths: Set<string>,
  language: string,
  tsconfigPaths?: TsConfigPaths | null
): DependencyEdge {
  const baseEdge: DependencyEdge = {
    source: sourceFile,
    target: null,
    specifier,
    kind,
    resolutionStatus: 'unresolved',
    sourceLine: line,
    resolutionMethod: 'none',
    unresolvedReason: null,
  };

  // 1. Check for standard library first
  if (isStandardLibrary(specifier, language)) {
    return {
      ...baseEdge,
      resolutionStatus: 'standard-library',
      resolutionMethod: 'heuristic',
      unresolvedReason: 'Standard library module',
    };
  }

  // 2. Check if it's clearly an external package
  if (isExternalPackage(specifier, language)) {
    return {
      ...baseEdge,
      resolutionStatus: 'external-package',
      resolutionMethod: 'heuristic',
      unresolvedReason: 'External npm/pip package',
    };
  }

  // 3. Try relative resolution for JS/TS
  if (language === 'typescript' || language === 'javascript') {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      const resolved = resolveRelativeJs(sourceFile, specifier, filePaths);
      if (resolved) {
        return {
          ...baseEdge,
          target: resolved.path,
          resolutionStatus: 'resolved',
          resolutionMethod: resolved.method,
        };
      }
    }

    // 4. Try TypeScript path aliases
    if (tsconfigPaths) {
      const resolved = resolveTsPathAlias(specifier, tsconfigPaths, filePaths);
      if (resolved) {
        return {
          ...baseEdge,
          target: resolved.path,
          resolutionStatus: 'resolved',
          resolutionMethod: 'tsconfig-path-alias',
        };
      }
    }

    // 5. Try bare specifier as relative (e.g., @/ aliases without tsconfig)
    if (specifier.startsWith('@/')) {
      const aliasPath = 'src/' + specifier.slice(2);
      const resolved = resolveRelativeJs('', aliasPath, filePaths);
      if (resolved) {
        return {
          ...baseEdge,
          target: resolved.path,
          resolutionStatus: 'resolved',
          resolutionMethod: 'conventional-alias',
        };
      }
    }
  }

  // 6. Python import resolution
  if (language === 'python') {
    const resolved = resolvePythonImport(sourceFile, specifier, filePaths);
    if (resolved) {
      return {
        ...baseEdge,
        target: resolved.path,
        resolutionStatus: 'resolved',
        resolutionMethod: resolved.method,
      };
    }
  }

  // 7. CSS import resolution
  if (language === 'css') {
    const resolved = resolveCssImport(sourceFile, specifier, filePaths);
    if (resolved) {
      return {
        ...baseEdge,
        target: resolved.path,
        resolutionStatus: 'resolved',
        resolutionMethod: 'relative-path',
      };
    }
  }

  // Unresolved — classify why
  const reason = classifyUnresolved(specifier, language);
  return {
    ...baseEdge,
    resolutionStatus: reason.status,
    resolutionMethod: 'heuristic',
    unresolvedReason: reason.reason,
  };
}

interface ResolvedPath {
  path: string;
  method: string;
}

function resolveRelativeJs(
  sourceFile: string,
  specifier: string,
  filePaths: Set<string>
): ResolvedPath | null {
  const sourceDir = getDirectory(sourceFile);
  const resolved = joinPath(sourceDir, specifier);

  // 1. Exact match
  if (filePaths.has(resolved)) {
    return { path: resolved, method: 'exact-match' };
  }

  // 2. Try source extensions
  for (const ext of SOURCE_EXTENSIONS) {
    const withExt = resolved + ext;
    if (filePaths.has(withExt)) {
      return { path: withExt, method: 'extension-resolution' };
    }
  }

  // 3. Try index files
  const indexCandidates = [
    'index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.mjs',
  ];
  for (const idx of indexCandidates) {
    const indexPath = resolved + '/' + idx;
    if (filePaths.has(indexPath)) {
      return { path: indexPath, method: 'index-resolution' };
    }
  }

  return null;
}

function resolveTsPathAlias(
  specifier: string,
  paths: TsConfigPaths,
  filePaths: Set<string>
): ResolvedPath | null {
  for (const [alias, targets] of Object.entries(paths)) {
    const aliasBase = alias.replace(/\*$/, '');

    if (specifier.startsWith(aliasBase)) {
      const rest = specifier.slice(aliasBase.length);

      for (const target of targets) {
        const targetBase = target.replace(/\*$/, '');
        const candidateBase = targetBase + rest;

        // Try with extensions
        if (filePaths.has(candidateBase)) {
          return { path: candidateBase, method: 'tsconfig-path-alias' };
        }

        for (const ext of SOURCE_EXTENSIONS) {
          if (filePaths.has(candidateBase + ext)) {
            return { path: candidateBase + ext, method: 'tsconfig-path-alias' };
          }
        }

        // Try index files
        const indexCandidates = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];
        for (const idx of indexCandidates) {
          if (filePaths.has(candidateBase + '/' + idx)) {
            return { path: candidateBase + '/' + idx, method: 'tsconfig-path-alias' };
          }
        }
      }
    }
  }

  return null;
}

function resolvePythonImport(
  sourceFile: string,
  specifier: string,
  filePaths: Set<string>
): ResolvedPath | null {
  // Handle relative imports (starting with dots)
  if (specifier.startsWith('.')) {
    const dots = specifier.match(/^\.+/)?.[0].length || 0;
    const moduleName = specifier.slice(dots);
    const sourceDir = getDirectory(sourceFile);

    let baseDir = sourceDir;
    for (let i = 1; i < dots; i++) {
      baseDir = getDirectory(baseDir);
    }

    return resolvePythonModule(baseDir, moduleName, filePaths);
  }

  // Absolute import — try as path from root
  return resolvePythonModule('', specifier, filePaths);
}

function resolvePythonModule(
  baseDir: string,
  moduleName: string,
  filePaths: Set<string>
): ResolvedPath | null {
  const parts = moduleName.split('.');
  const modulePath = parts.join('/');
  const fullPath = baseDir ? `${baseDir}/${modulePath}` : modulePath;

  // Try as direct file
  if (filePaths.has(fullPath + '.py')) {
    return { path: fullPath + '.py', method: 'python-module-resolution' };
  }

  // Try as package (__init__.py)
  if (filePaths.has(fullPath + '/__init__.py')) {
    return { path: fullPath + '/__init__.py', method: 'python-package-resolution' };
  }

  return null;
}

function resolveCssImport(
  sourceFile: string,
  specifier: string,
  filePaths: Set<string>
): ResolvedPath | null {
  if (!specifier.startsWith('.')) return null;

  const sourceDir = getDirectory(sourceFile);
  const resolved = joinPath(sourceDir, specifier);

  if (filePaths.has(resolved)) {
    return { path: resolved, method: 'relative-path' };
  }

  return null;
}

function isExternalPackage(specifier: string, language: string): boolean {
  if (language === 'typescript' || language === 'javascript') {
    // Relative imports are not external
    if (specifier.startsWith('.') || specifier.startsWith('/')) return false;
    // Scoped packages: @scope/package
    if (specifier.startsWith('@') && !specifier.startsWith('@/')) return true;
    // Bare specifiers without dots in first segment
    if (!specifier.startsWith('.') && !specifier.includes('/') && !specifier.startsWith('@/')) return true;
    // Packages with subpaths: package/subpath
    const firstSegment = specifier.split('/')[0];
    if (firstSegment && !firstSegment.startsWith('.') && !firstSegment.startsWith('@')) return true;
  }

  return false;
}

const PYTHON_STDLIB = new Set([
  'os', 'sys', 'io', 're', 'json', 'math', 'time', 'datetime', 'collections',
  'functools', 'itertools', 'typing', 'pathlib', 'dataclasses', 'abc', 'enum',
  'logging', 'unittest', 'pytest', 'argparse', 'subprocess', 'threading',
  'multiprocessing', 'asyncio', 'socket', 'http', 'urllib', 'email', 'html',
  'xml', 'csv', 'sqlite3', 'hashlib', 'hmac', 'secrets', 'pickle', 'shelve',
  'copy', 'pprint', 'textwrap', 'string', 'struct', 'codecs', 'unicodedata',
  'operator', 'contextlib', 'inspect', 'importlib', 'pkgutil', 'warnings',
  'traceback', 'types', 'weakref', 'array', 'queue', 'heapq', 'bisect',
  'decimal', 'fractions', 'random', 'statistics', 'shutil', 'glob', 'tempfile',
  'gzip', 'zipfile', 'tarfile', 'configparser', 'signal', 'mmap', 'ctypes',
  'platform', 'locale', 'gettext', 'ast', 'dis', 'token', 'tokenize',
  'builtins', '__future__', 'concurrent', 'test',
]);

function isStandardLibrary(specifier: string, language: string): boolean {
  if (language === 'python') {
    const topModule = specifier.split('.')[0];
    return PYTHON_STDLIB.has(topModule);
  }

  if (language === 'typescript' || language === 'javascript') {
    const builtins = new Set([
      'fs', 'path', 'os', 'http', 'https', 'url', 'util', 'events', 'stream',
      'crypto', 'buffer', 'child_process', 'cluster', 'dgram', 'dns', 'net',
      'readline', 'tls', 'tty', 'v8', 'vm', 'zlib', 'assert', 'querystring',
      'string_decoder', 'timers', 'worker_threads', 'perf_hooks',
      'node:fs', 'node:path', 'node:os', 'node:http', 'node:https',
      'node:url', 'node:util', 'node:events', 'node:stream', 'node:crypto',
      'node:buffer', 'node:child_process', 'node:cluster', 'node:net',
      'node:readline', 'node:tls', 'node:v8', 'node:vm', 'node:zlib',
      'node:assert', 'node:worker_threads', 'node:perf_hooks',
    ]);
    return builtins.has(specifier);
  }

  return false;
}

function classifyUnresolved(specifier: string, language: string): { status: ResolutionStatus; reason: string } {
  if (specifier.startsWith('.')) {
    return { status: 'missing-file', reason: 'Relative target file does not exist in repository' };
  }

  if (isExternalPackage(specifier, language)) {
    return { status: 'external-package', reason: 'Likely external package' };
  }

  if (specifier.includes('*') || specifier.includes('${')) {
    return { status: 'unsupported-pattern', reason: 'Dynamic or glob pattern' };
  }

  return { status: 'unresolved', reason: 'Could not resolve to a known file' };
}

// Path utilities
function getDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash < 0 ? '' : filePath.slice(0, lastSlash);
}

function joinPath(base: string, relative: string): string {
  const parts = base ? base.split('/') : [];
  const relativeParts = relative.split('/');

  for (const part of relativeParts) {
    if (part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  return parts.join('/');
}
