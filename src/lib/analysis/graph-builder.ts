/**
 * Graph Builder & Analysis Engine.
 * Constructs dependency graphs, detects cycles, calculates metrics, and generates findings.
 */
import type {
  FileRecord,
  DependencyEdge,
  GraphNode,
  GraphEdge,
  AnalysisMetrics,
  AnalysisFinding,
  AnalysisCoverage,
  FindingKind,
} from '@/types/repository';

export interface GraphBuilderInput {
  files: FileRecord[];
  resolvedEdges: DependencyEdge[];
  totalDiscoveredFiles: number;
}

export interface GraphBuilderOutput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: AnalysisMetrics;
  findings: AnalysisFinding[];
  coverage: AnalysisCoverage;
}

const ENTRY_POINT_PATTERNS = [
  /(?:^|\/)(index|main|app|server|cli)\.(?:[jt]sx?|mjs|cjs|py)$/i,
  /(?:^|\/)(page|layout|route|middleware)\.[jt]sx?$/i,
  /(?:^|\/)App\.[jt]sx?$/i,
];

const CONFIG_FILE_PATTERNS = [
  /package\.json$/i,
  /tsconfig.*\.json$/i,
  /(next|vite|tailwind|postcss|eslint|vitest|jest|webpack|rollup|babel)\.config\./i,
  /pyproject\.toml$/i,
  /setup\.(py|cfg)$/i,
  /requirements.*\.txt$/i,
  /docker-compose.*\.ya?ml$/i,
  /Dockerfile$/i,
];

export function isEntryPoint(filePath: string): boolean {
  return ENTRY_POINT_PATTERNS.some((pattern) => pattern.test(filePath));
}

export function isConfigFile(filePath: string): boolean {
  return CONFIG_FILE_PATTERNS.some((pattern) => pattern.test(filePath));
}

/**
 * Builds the repository graph, computes metrics, detects cycles, and generates findings.
 */
export function buildGraph(input: GraphBuilderInput): GraphBuilderOutput {
  const { files, resolvedEdges, totalDiscoveredFiles } = input;

  // Set of analyzed file paths for fast verification
  const analyzedPathSet = new Set(files.map((f) => f.path));

  // 1. Build Graph Edges — internal resolved dependencies only
  const validEdges: GraphEdge[] = [];
  const edgeIdSet = new Set<string>();

  // Sort edges deterministically by source, target, specifier
  const sortedInputEdges = [...resolvedEdges].sort((a, b) => {
    const srcCmp = a.source.localeCompare(b.source);
    if (srcCmp !== 0) return srcCmp;
    const tgtCmp = (a.target || '').localeCompare(b.target || '');
    if (tgtCmp !== 0) return tgtCmp;
    return a.specifier.localeCompare(b.specifier);
  });

  for (const dep of sortedInputEdges) {
    if (
      dep.resolutionStatus === 'resolved' &&
      dep.target !== null &&
      analyzedPathSet.has(dep.source) &&
      analyzedPathSet.has(dep.target)
    ) {
      const edgeId = `edge:${dep.source}->${dep.target}:${dep.specifier}`;
      // Prevent duplicate edges between same files with same specifier
      if (!edgeIdSet.has(edgeId)) {
        edgeIdSet.add(edgeId);
        validEdges.push({
          id: edgeId,
          source: dep.source,
          target: dep.target,
          kind: dep.kind,
          specifier: dep.specifier,
          label: dep.kind === 'type-import' ? 'types' : null,
        });
      }
    }
  }

  // 2. Degree Calculation from verified graph edges
  const inDegreeMap = new Map<string, number>();
  const outDegreeMap = new Map<string, number>();
  const adjacencyList = new Map<string, Set<string>>();

  for (const file of files) {
    inDegreeMap.set(file.path, 0);
    outDegreeMap.set(file.path, 0);
    adjacencyList.set(file.path, new Set<string>());
  }

  for (const edge of validEdges) {
    outDegreeMap.set(edge.source, (outDegreeMap.get(edge.source) || 0) + 1);
    inDegreeMap.set(edge.target, (inDegreeMap.get(edge.target) || 0) + 1);
    adjacencyList.get(edge.source)?.add(edge.target);
  }

  // 3. Build Graph Nodes
  const nodes: GraphNode[] = files
    .map((file) => {
      const inDeg = inDegreeMap.get(file.path) || 0;
      const outDeg = outDegreeMap.get(file.path) || 0;
      const entry = isEntryPoint(file.path);
      const config = isConfigFile(file.path);
      // Hotspot heuristic: significant central coordination or high bidirectional flow
      const hotspot = (inDeg >= 3 && outDeg >= 3) || (inDeg + outDeg >= 8);

      return {
        id: file.path,
        path: file.path,
        language: file.language,
        parseStatus: file.parseStatus,
        symbolCount: file.symbols.length,
        importCount: file.imports.length,
        exportCount: file.exports.length,
        isEntryPoint: entry,
        isConfigFile: config,
        isHotspot: hotspot,
        size: file.size,
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  // 4. Cycle Detection using Tarjan's Strongly Connected Components algorithm
  const cycles = detectCycles(adjacencyList);

  // 5. Calculate Metrics
  const filesByLanguage: Record<string, number> = {};
  let totalSymbols = 0;
  let totalImports = 0;

  for (const file of files) {
    filesByLanguage[file.language] = (filesByLanguage[file.language] || 0) + 1;
    totalSymbols += file.symbols.length;
    totalImports += file.imports.length;
  }

  const unresolvedImports = resolvedEdges.filter(
    (e) => e.resolutionStatus !== 'resolved' && e.resolutionStatus !== 'external-package' && e.resolutionStatus !== 'standard-library'
  );

  const highDependencyFiles = nodes
    .filter((n) => (outDegreeMap.get(n.path) || 0) > 0)
    .map((n) => ({ path: n.path, count: outDegreeMap.get(n.path) || 0 }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .slice(0, 10);

  const highDependentFiles = nodes
    .filter((n) => (inDegreeMap.get(n.path) || 0) > 0)
    .map((n) => ({ path: n.path, count: inDegreeMap.get(n.path) || 0 }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path))
    .slice(0, 10);

  const dependencyHotspots = nodes
    .filter((n) => n.isHotspot)
    .map((n) => ({
      path: n.path,
      inDegree: inDegreeMap.get(n.path) || 0,
      outDegree: outDegreeMap.get(n.path) || 0,
    }))
    .sort((a, b) => (b.inDegree + b.outDegree) - (a.inDegree + a.outDegree) || a.path.localeCompare(b.path));

  const isolatedFiles = nodes
    .filter((n) => {
      const inDeg = inDegreeMap.get(n.path) || 0;
      const outDeg = outDegreeMap.get(n.path) || 0;
      return inDeg === 0 && outDeg === 0 && !n.isEntryPoint && !n.isConfigFile;
    })
    .map((n) => n.path)
    .sort((a, b) => a.localeCompare(b));

  const analyzedCount = files.length;
  const metrics: AnalysisMetrics = {
    filesByLanguage,
    totalResolvedDependencies: validEdges.length,
    totalUnresolvedImports: unresolvedImports.length,
    totalSymbols,
    averageImportsPerFile: analyzedCount > 0 ? Math.round((totalImports / analyzedCount) * 100) / 100 : 0,
    averageSymbolsPerFile: analyzedCount > 0 ? Math.round((totalSymbols / analyzedCount) * 100) / 100 : 0,
    highDependencyFiles,
    highDependentFiles,
    dependencyHotspots,
    cycles,
    isolatedFiles,
  };

  // 6. Coverage Calculation
  let successfulFiles = 0;
  let partialFiles = 0;
  let failedFiles = 0;
  let skippedFiles = 0;
  let unsupportedFiles = 0;

  for (const file of files) {
    if (file.parseStatus === 'success') successfulFiles++;
    else if (file.parseStatus === 'partial') partialFiles++;
    else if (file.parseStatus === 'failed') failedFiles++;
    else if (file.parseStatus === 'skipped') skippedFiles++;
    else if (file.parseStatus === 'unsupported') unsupportedFiles++;
  }

  const denominator = Math.max(totalDiscoveredFiles, files.length);
  const coveragePercent = denominator > 0 ? Math.round((files.length / denominator) * 1000) / 10 : 0;
  const successPercent = files.length > 0 ? Math.round((successfulFiles / files.length) * 1000) / 10 : 0;

  const coverage: AnalysisCoverage = {
    totalFiles: denominator,
    analyzedFiles: files.length,
    successfulFiles,
    partialFiles,
    failedFiles,
    skippedFiles,
    unsupportedFiles,
    coveragePercent,
    successPercent,
  };

  // 7. Findings Generation
  const findings: AnalysisFinding[] = generateFindings({
    files,
    validEdges,
    cycles,
    unresolvedImports,
    isolatedFiles,
    dependencyHotspots,
    outDegreeMap,
    inDegreeMap,
  });

  return {
    nodes,
    edges: validEdges,
    metrics,
    findings,
    coverage,
  };
}

/**
 * Detects cycles using Tarjan's Strongly Connected Components algorithm.
 * Guarantees single-node components without self-edges are excluded.
 * Returns cycles in deterministic canonical order.
 */
function detectCycles(adjacencyList: Map<string, Set<string>>): Array<string[]> {
  let index = 0;
  const indices = new Map<string, number>();
  const lowlinks = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const sccs: Array<string[]> = [];

  function strongConnect(node: string) {
    indices.set(node, index);
    lowlinks.set(node, index);
    index++;
    stack.push(node);
    onStack.add(node);

    const neighbors = adjacencyList.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!indices.has(neighbor)) {
        strongConnect(neighbor);
        lowlinks.set(node, Math.min(lowlinks.get(node)!, lowlinks.get(neighbor)!));
      } else if (onStack.has(neighbor)) {
        lowlinks.set(node, Math.min(lowlinks.get(node)!, indices.get(neighbor)!));
      }
    }

    if (lowlinks.get(node) === indices.get(node)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
      } while (w !== node);

      // A single node is only a cycle if it has a self-edge
      if (scc.length > 1) {
        sccs.push(scc);
      } else if (scc.length === 1) {
        const single = scc[0];
        if (adjacencyList.get(single)?.has(single)) {
          sccs.push(scc);
        }
      }
    }
  }

  const allNodes = Array.from(adjacencyList.keys()).sort();
  for (const node of allNodes) {
    if (!indices.has(node)) {
      strongConnect(node);
    }
  }

  // Canonicalize cycle representation for determinism
  return sccs
    .map((cycle) => {
      // Find lexicographically smallest node as starting point
      let minIdx = 0;
      for (let i = 1; i < cycle.length; i++) {
        if (cycle[i].localeCompare(cycle[minIdx]) < 0) {
          minIdx = i;
        }
      }
      return [...cycle.slice(minIdx), ...cycle.slice(0, minIdx)];
    })
    .sort((a, b) => a[0].localeCompare(b[0]));
}

interface FindingsContext {
  files: FileRecord[];
  validEdges: GraphEdge[];
  cycles: Array<string[]>;
  unresolvedImports: DependencyEdge[];
  isolatedFiles: string[];
  dependencyHotspots: Array<{ path: string; inDegree: number; outDegree: number }>;
  outDegreeMap: Map<string, number>;
  inDegreeMap: Map<string, number>;
}

function generateFindings(ctx: FindingsContext): AnalysisFinding[] {
  const findings: AnalysisFinding[] = [];
  let findingCount = 0;

  const nextId = (kind: FindingKind) => `finding:${kind}:${++findingCount}`;

  // 1. Cycles
  for (const cycle of ctx.cycles) {
    findings.push({
      id: nextId('cycle-detected'),
      kind: 'cycle-detected',
      severity: 'warning',
      title: `Circular Dependency Detected (${cycle.length} files)`,
      description: `A circular dependency loop was detected between: ${cycle.join(' -> ')} -> ${cycle[0]}`,
      filePath: cycle[0],
      line: null,
      relatedPaths: cycle,
    });
  }

  // 2. High Out-degree files (coupling)
  for (const [path, outDeg] of ctx.outDegreeMap.entries()) {
    if (outDeg >= 12) {
      findings.push({
        id: nextId('high-dependency-count'),
        kind: 'high-dependency-count',
        severity: 'warning',
        title: `High Outgoing Dependency Count (${outDeg} imports)`,
        description: `File '${path}' directly imports ${outDeg} internal modules. High coupling may indicate architectural bloat or God-object patterns.`,
        filePath: path,
        line: null,
        relatedPaths: [],
      });
    }
  }

  // 3. High In-degree files (central dependencies)
  for (const [path, inDeg] of ctx.inDegreeMap.entries()) {
    if (inDeg >= 15) {
      findings.push({
        id: nextId('high-dependent-count'),
        kind: 'high-dependent-count',
        severity: 'info',
        title: `Core Architectural Dependency (${inDeg} dependents)`,
        description: `File '${path}' is imported by ${inDeg} internal modules. Changes to this file carry a high blast radius.`,
        filePath: path,
        line: null,
        relatedPaths: [],
      });
    }
  }

  // 4. Missing relative imports
  for (const dep of ctx.unresolvedImports) {
    if (dep.resolutionStatus === 'missing-file') {
      findings.push({
        id: nextId('unresolved-import'),
        kind: 'unresolved-import',
        severity: 'warning',
        title: `Broken Relative Import: ${dep.specifier}`,
        description: `Source file '${dep.source}' attempted to import '${dep.specifier}' (line ${dep.sourceLine || '?'}), but no corresponding target was found in the repository.`,
        filePath: dep.source,
        line: dep.sourceLine,
        relatedPaths: [],
      });
    }
  }

  // 5. Parse failures / Partial parses
  for (const file of ctx.files) {
    if (file.parseStatus === 'failed') {
      findings.push({
        id: nextId('parse-failure'),
        kind: 'parse-failure',
        severity: 'error',
        title: `Parse Failure in ${file.path}`,
        description: file.errors[0]?.message || `Failed to parse ${file.path} as ${file.language}`,
        filePath: file.path,
        line: file.errors[0]?.line || null,
        relatedPaths: [],
      });
    } else if (file.parseStatus === 'partial' && file.errors.length > 0) {
      findings.push({
        id: nextId('parse-failure'),
        kind: 'parse-failure',
        severity: 'warning',
        title: `Partial Parse in ${file.path}`,
        description: file.errors[0]?.message || `Syntax errors encountered during analysis`,
        filePath: file.path,
        line: file.errors[0]?.line || null,
        relatedPaths: [],
      });
    }
  }

  // 6. Large files
  for (const file of ctx.files) {
    if (file.lineCount && file.lineCount > 1000) {
      findings.push({
        id: nextId('large-file'),
        kind: 'large-file',
        severity: 'info',
        title: `Large Source File (${file.lineCount} lines)`,
        description: `File '${file.path}' has ${file.lineCount} lines of code. Consider refactoring into smaller modular components.`,
        filePath: file.path,
        line: 1,
        relatedPaths: [],
      });
    }
  }

  // 7. Isolated files
  for (const path of ctx.isolatedFiles) {
    findings.push({
      id: nextId('isolated-file'),
      kind: 'isolated-file',
      severity: 'info',
      title: `Orphaned/Isolated File: ${path}`,
      description: `File '${path}' neither imports internal modules nor is imported by any analyzed files in the repository.`,
      filePath: path,
      line: null,
      relatedPaths: [],
    });
  }

  return findings.sort((a, b) => {
    const sevOrder = { error: 0, warning: 1, info: 2 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return (a.filePath || '').localeCompare(b.filePath || '') || a.id.localeCompare(b.id);
  });
}
