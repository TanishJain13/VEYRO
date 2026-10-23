/**
 * Core repository domain types.
 * Shared across API, parsers, graph, and UI.
 */

export interface RepositoryIdentity {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  defaultBranch: string;
  selectedBranch: string;
  commitSha: string;
  primaryLanguage: string | null;
  visibility: 'public' | 'private' | 'unknown';
  stars: number;
  forks: number;
  analyzedAt: string;
  treeComplete: boolean;
}

export interface RepositoryTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number | null;
  language: string | null;
  children?: RepositoryTreeNode[];
}

export interface RepositoryTree {
  nodes: RepositoryTreeNode[];
  totalFiles: number;
  totalDirectories: number;
  truncated: boolean;
}

export type ParseStatus =
  | 'success'
  | 'partial'
  | 'failed'
  | 'unsupported'
  | 'skipped';

export interface FileImport {
  specifier: string;
  kind: ImportKind;
  names: ImportedName[];
  line: number | null;
  column: number | null;
  isDynamic: boolean;
}

export type ImportKind =
  | 'esm-static'
  | 'esm-dynamic'
  | 'commonjs'
  | 'python-import'
  | 'python-from-import'
  | 'css-import'
  | 'side-effect'
  | 'unknown';

export interface ImportedName {
  name: string;
  alias: string | null;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface FileExport {
  name: string;
  kind: ExportKind;
  line: number | null;
  isDefault: boolean;
  isReExport: boolean;
  sourceSpecifier: string | null;
}

export type ExportKind =
  | 'named'
  | 'default'
  | 'namespace'
  | 're-export'
  | 'all'
  | 'assignment';

export type SymbolKind =
  | 'function'
  | 'arrow-function'
  | 'class'
  | 'interface'
  | 'type-alias'
  | 'enum'
  | 'variable'
  | 'constant'
  | 'method'
  | 'property'
  | 'import'
  | 'export'
  | 'module'
  | 'namespace'
  | 'decorator'
  | 'unknown';

export interface SymbolRecord {
  id: string;
  name: string;
  kind: SymbolKind;
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number | null;
  endColumn: number | null;
  isExported: boolean;
  parentSymbolId: string | null;
  confidence: 'high' | 'medium' | 'low';
  extractionMethod: 'ast' | 'structured' | 'lexical' | 'fallback';
}

export interface FileRecord {
  path: string;
  language: string;
  size: number;
  sourceRetrieved: boolean;
  parserId: string;
  parseStatus: ParseStatus;
  imports: FileImport[];
  exports: FileExport[];
  symbols: SymbolRecord[];
  lineCount: number | null;
  errors: ParseDiagnostic[];
  warnings: ParseDiagnostic[];
  skipReason: string | null;
}

export interface ParseDiagnostic {
  message: string;
  line: number | null;
  column: number | null;
  severity: 'error' | 'warning' | 'info';
  code: string | null;
}

export type ResolutionStatus =
  | 'resolved'
  | 'external-package'
  | 'standard-library'
  | 'missing-file'
  | 'unsupported-pattern'
  | 'dynamic-import'
  | 'ambiguous'
  | 'excluded-file'
  | 'unresolved';

export type DependencyKind =
  | 'import'
  | 'dynamic-import'
  | 'require'
  | 'type-import'
  | 're-export'
  | 'side-effect'
  | 'css-import'
  | 'python-import';

export interface DependencyEdge {
  source: string;
  target: string | null;
  specifier: string;
  kind: DependencyKind;
  resolutionStatus: ResolutionStatus;
  sourceLine: number | null;
  resolutionMethod: string;
  unresolvedReason: string | null;
}

export interface AnalysisCoverage {
  totalFiles: number;
  analyzedFiles: number;
  successfulFiles: number;
  partialFiles: number;
  failedFiles: number;
  skippedFiles: number;
  unsupportedFiles: number;
  coveragePercent: number;
  successPercent: number;
}

export interface AnalysisMetrics {
  filesByLanguage: Record<string, number>;
  totalResolvedDependencies: number;
  totalUnresolvedImports: number;
  totalSymbols: number;
  averageImportsPerFile: number;
  averageSymbolsPerFile: number;
  highDependencyFiles: Array<{ path: string; count: number }>;
  highDependentFiles: Array<{ path: string; count: number }>;
  dependencyHotspots: Array<{ path: string; inDegree: number; outDegree: number }>;
  cycles: Array<string[]>;
  isolatedFiles: string[];
}

export interface AnalysisFinding {
  id: string;
  kind: FindingKind;
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  filePath: string | null;
  line: number | null;
  relatedPaths: string[];
}

export type FindingKind =
  | 'cycle-detected'
  | 'high-dependency-count'
  | 'high-dependent-count'
  | 'unresolved-import'
  | 'parse-failure'
  | 'large-file'
  | 'isolated-file'
  | 'mixed-import-styles'
  | 'deep-nesting'
  | 'truncated-tree'
  | 'rate-limit-warning';

export interface AnalysisResult {
  repository: RepositoryIdentity;
  files: FileRecord[];
  graph: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
  symbols: SymbolRecord[];
  findings: AnalysisFinding[];
  metrics: AnalysisMetrics;
  coverage: AnalysisCoverage;
  duration: number;
  truncated: boolean;
  truncationReason: string | null;
  limitsReached: string[];
  analysisVersion: string;
}

export interface GraphNode {
  id: string;
  path: string;
  language: string;
  parseStatus: ParseStatus;
  symbolCount: number;
  importCount: number;
  exportCount: number;
  isEntryPoint: boolean;
  isConfigFile: boolean;
  isHotspot: boolean;
  size: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  kind: DependencyKind;
  specifier: string;
  label: string | null;
}
