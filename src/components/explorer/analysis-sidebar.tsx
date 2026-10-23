'use client';

/**
 * Right sidebar inspector panel.
 * Contains: File details, Symbols, Dependencies, Findings, and Metrics tabs.
 */
import React, { useState, useMemo } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import {
  FileText,
  Boxes,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';

export type InspectorTab = 'file' | 'deps' | 'findings' | 'metrics';

export function AnalysisSidebar() {
  const { analysis, selectedPath, selectFile, setActiveTab } = useExplorerStore();
  const [tab, setTab] = useState<InspectorTab>('file');

  // Currently selected file record from analysis
  const currentFile = useMemo(() => {
    if (!analysis || !selectedPath) return null;
    return analysis.files.find((f) => f.path === selectedPath) || null;
  }, [analysis, selectedPath]);

  // Outgoing dependencies for selected file
  const outgoingDeps = useMemo(() => {
    if (!analysis || !selectedPath) return [];
    return analysis.graph.edges.filter((e) => e.source === selectedPath);
  }, [analysis, selectedPath]);

  // Incoming dependents (who imports this file)
  const incomingDependents = useMemo(() => {
    if (!analysis || !selectedPath) return [];
    return analysis.graph.edges.filter((e) => e.target === selectedPath);
  }, [analysis, selectedPath]);

  // Unresolved imports for this file
  const unresolvedForFile = useMemo(() => {
    if (!currentFile) return [];
    return currentFile.imports.filter((i) => i.specifier.startsWith('.'));
  }, [currentFile]);

  return (
    <div className="flex flex-col h-full bg-[var(--veyro-bg-base)] border-l border-[var(--veyro-border)] select-none text-xs">
      {/* Tab Navigation Header */}
      <div className="flex items-center border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)]">
        <button
          onClick={() => setTab('file')}
          className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            tab === 'file'
              ? 'border-[var(--veyro-accent)] text-white'
              : 'border-transparent text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Inspector</span>
        </button>

        <button
          onClick={() => setTab('deps')}
          className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            tab === 'deps'
              ? 'border-[var(--veyro-accent)] text-white'
              : 'border-transparent text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)]'
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Graph</span>
        </button>

        <button
          onClick={() => setTab('findings')}
          className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 relative ${
            tab === 'findings'
              ? 'border-[var(--veyro-accent)] text-white'
              : 'border-transparent text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Findings</span>
          {analysis && analysis.findings.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[var(--veyro-warning)] text-black text-[10px] font-bold flex items-center justify-center">
              {analysis.findings.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('metrics')}
          className={`flex-1 py-2 text-center font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
            tab === 'metrics'
              ? 'border-[var(--veyro-accent)] text-white'
              : 'border-transparent text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Metrics</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'file' && (
          <FileInspectorTab currentFile={currentFile} selectedPath={selectedPath} />
        )}

        {tab === 'deps' && (
          <DependenciesInspectorTab
            selectedPath={selectedPath}
            outgoingDeps={outgoingDeps}
            incomingDependents={incomingDependents}
            unresolvedForFile={unresolvedForFile}
            onSelectFile={selectFile}
            onOpenCode={() => setActiveTab('code')}
          />
        )}

        {tab === 'findings' && (
          <FindingsInspectorTab
            analysis={analysis}
            onSelectFile={(path) => {
              selectFile(path);
              setActiveTab('code');
            }}
          />
        )}

        {tab === 'metrics' && (
          <MetricsInspectorTab
            analysis={analysis}
            onSelectFile={(path) => {
              selectFile(path);
              setActiveTab('code');
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. File Details Inspector Tab
// ─────────────────────────────────────────────────────────────
function FileInspectorTab({
  currentFile,
  selectedPath,
}: {
  currentFile: ReturnType<typeof useExplorerStore.getState>['analysis'] extends null
    ? null
    : NonNullable<ReturnType<typeof useExplorerStore.getState>['analysis']>['files'][number] | null;
  selectedPath: string | null;
}) {
  if (!selectedPath) {
    return (
      <div className="text-center py-8 text-[var(--veyro-text-tertiary)]">
        Select a file to inspect details, symbols, and imports.
      </div>
    );
  }

  if (!currentFile) {
    return (
      <div className="space-y-3">
        <div className="font-mono text-xs font-semibold text-[var(--veyro-text-primary)] break-all">
          {selectedPath}
        </div>
        <p className="text-[var(--veyro-text-tertiary)] text-[11px]">
          File not in parsed source set (e.g. non-code asset or excluded file).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Overview */}
      <div className="bg-[var(--veyro-bg-surface)] p-2.5 rounded-lg border border-[var(--veyro-border)] space-y-2">
        <div className="font-mono text-xs font-bold text-[var(--veyro-text-primary)] break-all">
          {currentFile.path}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-[var(--veyro-border-subtle)] text-[var(--veyro-text-tertiary)]">
          <div>
            <span>Language: </span>
            <span className="text-[var(--veyro-text-secondary)] font-medium uppercase font-mono">
              {currentFile.language}
            </span>
          </div>
          <div>
            <span>Parse Status: </span>
            <span
              className={`font-medium ${
                currentFile.parseStatus === 'success'
                  ? 'text-[var(--veyro-success)]'
                  : currentFile.parseStatus === 'failed'
                  ? 'text-[var(--veyro-error)]'
                  : 'text-[var(--veyro-warning)]'
              }`}
            >
              {currentFile.parseStatus}
            </span>
          </div>
          <div>
            <span>Lines: </span>
            <span className="text-[var(--veyro-text-secondary)] font-mono">
              {currentFile.lineCount || '—'}
            </span>
          </div>
          <div>
            <span>Size: </span>
            <span className="text-[var(--veyro-text-secondary)] font-mono">
              {currentFile.size.toLocaleString()} bytes
            </span>
          </div>
        </div>
      </div>

      {/* Extracted Symbols */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          <span>Extracted Symbols ({currentFile.symbols.length})</span>
        </div>

        {currentFile.symbols.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            No top-level functions, classes, or interfaces extracted.
          </div>
        ) : (
          <div className="space-y-1 max-h-56 overflow-y-auto font-mono text-[11px]">
            {currentFile.symbols.map((sym) => (
              <div
                key={sym.id}
                className="flex items-center justify-between p-1.5 rounded bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border-subtle)]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[9px] uppercase px-1 rounded bg-[var(--veyro-bg-elevated)] border border-[var(--veyro-border)] text-[var(--veyro-accent)] font-sans">
                    {sym.kind}
                  </span>
                  <span className="font-medium text-[var(--veyro-text-primary)] truncate">
                    {sym.name}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--veyro-text-tertiary)] shrink-0 ml-1">
                  L{sym.startLine}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Declared Exports */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          <span>Exports ({currentFile.exports.length})</span>
        </div>
        {currentFile.exports.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            No explicit module exports.
          </div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[11px]">
            {currentFile.exports.map((exp, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-1.5 rounded bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border-subtle)]"
              >
                <span className="text-[var(--veyro-text-primary)] font-medium truncate">
                  {exp.name}
                </span>
                <span className="text-[10px] text-[var(--veyro-text-tertiary)] uppercase font-sans">
                  {exp.kind}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Dependencies Inspector Tab
// ─────────────────────────────────────────────────────────────
function DependenciesInspectorTab({
  selectedPath,
  outgoingDeps,
  incomingDependents,
  unresolvedForFile,
  onSelectFile,
  onOpenCode,
}: {
  selectedPath: string | null;
  outgoingDeps: Array<{ source: string; target: string; specifier: string }>;
  incomingDependents: Array<{ source: string; target: string; specifier: string }>;
  unresolvedForFile: Array<{ specifier: string; line: number | null }>;
  onSelectFile: (path: string) => void;
  onOpenCode: () => void;
}) {
  if (!selectedPath) {
    return (
      <div className="text-center py-8 text-[var(--veyro-text-tertiary)]">
        Select a file to inspect its incoming and outgoing relationships.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-[11px]">
      {/* Outgoing Imports */}
      <div>
        <div className="text-xs font-sans font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          Imports Internal Files ({outgoingDeps.length})
        </div>

        {outgoingDeps.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            Does not import other internal modules.
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {outgoingDeps.map((dep, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectFile(dep.target);
                  onOpenCode();
                }}
                className="p-1.5 rounded bg-[var(--veyro-bg-surface)] hover:bg-[var(--veyro-bg-hover)] border border-[var(--veyro-border-subtle)] cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="truncate text-[var(--veyro-text-primary)] group-hover:text-[var(--veyro-accent)]">
                  {dep.target}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] group-hover:text-white shrink-0 ml-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incoming Dependents */}
      <div>
        <div className="text-xs font-sans font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          Imported By ({incomingDependents.length})
        </div>

        {incomingDependents.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            No other files import this module directly.
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {incomingDependents.map((dep, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectFile(dep.source);
                  onOpenCode();
                }}
                className="p-1.5 rounded bg-[var(--veyro-bg-surface)] hover:bg-[var(--veyro-bg-hover)] border border-[var(--veyro-border-subtle)] cursor-pointer flex items-center justify-between group transition-colors"
              >
                <div className="truncate text-[var(--veyro-text-primary)] group-hover:text-[var(--veyro-cyan)]">
                  {dep.source}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] group-hover:text-white shrink-0 ml-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broken Relative Imports */}
      {unresolvedForFile.length > 0 && (
        <div>
          <div className="text-xs font-sans font-semibold text-[var(--veyro-error)] mb-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unresolved / Missing Imports ({unresolvedForFile.length})</span>
          </div>

          <div className="space-y-1">
            {unresolvedForFile.map((u, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded bg-[var(--veyro-error-muted)] border border-[rgba(248,113,113,0.3)] text-[var(--veyro-error)]"
              >
                <span className="font-semibold">{u.specifier}</span>
                {u.line && <span className="ml-1 text-[10px] opacity-80">(Line {u.line})</span>}
                <div className="text-[10px] text-[var(--veyro-text-tertiary)] mt-0.5">
                  Target file does not exist in repository tree.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Findings Inspector Tab
// ─────────────────────────────────────────────────────────────
function FindingsInspectorTab({
  analysis,
  onSelectFile,
}: {
  analysis: ReturnType<typeof useExplorerStore.getState>['analysis'];
  onSelectFile: (path: string) => void;
}) {
  if (!analysis) return null;

  if (analysis.findings.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--veyro-text-tertiary)] flex flex-col items-center gap-2">
        <CheckCircle className="w-8 h-8 text-[var(--veyro-success)] opacity-80" />
        <span className="text-xs font-medium text-[var(--veyro-text-primary)]">No Architectural Defects</span>
        <span className="text-[11px]">No circular loops, broken imports, or syntax failures detected.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="text-xs text-[var(--veyro-text-tertiary)]">
        Found {analysis.findings.length} architectural issues or diagnostics:
      </div>

      <div className="space-y-2">
        {analysis.findings.map((f) => (
          <div
            key={f.id}
            onClick={() => f.filePath && onSelectFile(f.filePath)}
            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
              f.severity === 'error'
                ? 'bg-[var(--veyro-error-muted)] border-[rgba(248,113,113,0.3)] hover:border-[var(--veyro-error)]'
                : f.severity === 'warning'
                ? 'bg-[var(--veyro-warning-muted)] border-[rgba(251,191,36,0.3)] hover:border-[var(--veyro-warning)]'
                : 'bg-[var(--veyro-bg-surface)] border-[var(--veyro-border)] hover:border-[var(--veyro-border-strong)]'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold text-[var(--veyro-text-primary)] mb-1">
              {f.severity === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-[var(--veyro-error)] shrink-0" />
              ) : f.severity === 'warning' ? (
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--veyro-warning)] shrink-0" />
              ) : (
                <Info className="w-3.5 h-3.5 text-[var(--veyro-cyan)] shrink-0" />
              )}
              <span className="truncate">{f.title}</span>
            </div>

            <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed mb-1.5">
              {f.description}
            </p>

            {f.filePath && (
              <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--veyro-text-tertiary)] pt-1 border-t border-[rgba(255,255,255,0.05)]">
                <span>File: </span>
                <span className="text-[var(--veyro-text-primary)] underline truncate">
                  {f.filePath}
                </span>
                {f.line && <span>(L{f.line})</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. Metrics & Coverage Inspector Tab
// ─────────────────────────────────────────────────────────────
function MetricsInspectorTab({
  analysis,
  onSelectFile,
}: {
  analysis: ReturnType<typeof useExplorerStore.getState>['analysis'];
  onSelectFile: (path: string) => void;
}) {
  if (!analysis) return null;

  const { metrics, coverage } = analysis;

  return (
    <div className="space-y-4 text-xs">
      {/* Coverage Gauge Card */}
      <div className="bg-[var(--veyro-bg-surface)] p-3 rounded-lg border border-[var(--veyro-border)] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[var(--veyro-text-primary)]">Analysis Coverage</span>
          <span className="font-mono text-[var(--veyro-accent)] font-bold">
            {coverage.coveragePercent}%
          </span>
        </div>

        <div className="w-full h-2 bg-[var(--veyro-bg-base)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--veyro-accent)] to-[var(--veyro-cyan)]"
            style={{ width: `${Math.min(100, coverage.coveragePercent)}%` }}
          />
        </div>

        <div className="text-[11px] text-[var(--veyro-text-tertiary)] grid grid-cols-2 gap-1.5 pt-1">
          <div>
            <span>Analyzed: </span>
            <span className="font-mono text-[var(--veyro-text-primary)]">
              {coverage.analyzedFiles} / {coverage.totalFiles}
            </span>
          </div>
          <div>
            <span>Parse Success: </span>
            <span className="font-mono text-[var(--veyro-success)]">{coverage.successPercent}%</span>
          </div>
          <div>
            <span>Partial: </span>
            <span className="font-mono text-[var(--veyro-warning)]">{coverage.partialFiles}</span>
          </div>
          <div>
            <span>Failed: </span>
            <span className="font-mono text-[var(--veyro-error)]">{coverage.failedFiles}</span>
          </div>
        </div>
      </div>

      {/* Language Breakdown */}
      <div>
        <div className="text-xs font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          Languages Analyzed
        </div>

        <div className="space-y-1.5 bg-[var(--veyro-bg-surface)] p-2.5 rounded-lg border border-[var(--veyro-border)]">
          {Object.entries(metrics.filesByLanguage).map(([lang, count]) => (
            <div key={lang} className="flex items-center justify-between text-[11px]">
              <span className="capitalize font-mono text-[var(--veyro-text-primary)]">{lang}</span>
              <span className="text-[var(--veyro-text-tertiary)] font-mono">{count} files</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dependency Cycles List */}
      <div>
        <div className="text-xs font-semibold text-[var(--veyro-text-secondary)] mb-1.5 flex items-center justify-between">
          <span>Circular Loops</span>
          <span className="text-[11px] font-mono text-[var(--veyro-warning)] font-bold">
            {metrics.cycles.length}
          </span>
        </div>

        {metrics.cycles.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            Clean dependency graph with zero cycles.
          </div>
        ) : (
          <div className="space-y-2">
            {metrics.cycles.map((cycle, idx) => (
              <div
                key={idx}
                className="p-2 rounded bg-[var(--veyro-warning-muted)] border border-[rgba(251,191,36,0.3)] space-y-1 text-[11px] font-mono"
              >
                <div className="font-bold text-[var(--veyro-warning)] font-sans">
                  Loop #{idx + 1} ({cycle.length} files)
                </div>
                {cycle.map((p, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => onSelectFile(p)}
                    className="block text-left text-[var(--veyro-text-primary)] hover:underline truncate w-full"
                  >
                    ↳ {p}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dependency Hotspots */}
      <div>
        <div className="text-xs font-semibold text-[var(--veyro-text-secondary)] mb-1.5">
          Hotspot Modules ({metrics.dependencyHotspots.length})
        </div>

        {metrics.dependencyHotspots.length === 0 ? (
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] italic p-2 bg-[var(--veyro-bg-surface)] rounded border border-[var(--veyro-border-subtle)]">
            No high-traffic bottlenecks detected.
          </div>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-[11px]">
            {metrics.dependencyHotspots.map((h, idx) => (
              <div
                key={idx}
                onClick={() => onSelectFile(h.path)}
                className="p-1.5 rounded bg-[var(--veyro-bg-surface)] hover:bg-[var(--veyro-bg-hover)] border border-[var(--veyro-border-subtle)] cursor-pointer flex items-center justify-between"
              >
                <span className="truncate text-[var(--veyro-text-primary)] font-medium">
                  {h.path}
                </span>
                <span className="text-[10px] text-amber-400 shrink-0 ml-1">
                  in:{h.inDegree} out:{h.outDegree}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
