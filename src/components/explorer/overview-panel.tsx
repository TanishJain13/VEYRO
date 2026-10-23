'use client';

/**
 * Architectural Overview dashboard panel.
 */
import React from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import {
  Boxes,
  Code2,
  AlertTriangle,
  Flame,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export function OverviewPanel() {
  const { analysis, selectFile, setActiveTab } = useExplorerStore();

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-base)]">
        No repository analysis available.
      </div>
    );
  }

  const { metrics, coverage, findings } = analysis;

  return (
    <div className="h-full overflow-y-auto p-6 bg-[var(--veyro-bg-base)] text-xs font-sans space-y-6">
      {/* Hero Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--veyro-bg-surface)] p-3.5 rounded-lg border border-[var(--veyro-border)] space-y-1">
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] flex items-center justify-between">
            <span>Files Analyzed</span>
            <FileCode className="w-3.5 h-3.5 text-[var(--veyro-cyan)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--veyro-text-primary)]">
            {coverage.analyzedFiles.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--veyro-text-tertiary)]">
            {coverage.totalFiles.toLocaleString()} total in tree ({coverage.coveragePercent}% coverage)
          </div>
        </div>

        <div className="bg-[var(--veyro-bg-surface)] p-3.5 rounded-lg border border-[var(--veyro-border)] space-y-1">
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] flex items-center justify-between">
            <span>Internal Dependencies</span>
            <Boxes className="w-3.5 h-3.5 text-[var(--veyro-accent)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--veyro-text-primary)]">
            {metrics.totalResolvedDependencies.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--veyro-text-tertiary)]">
            {metrics.averageImportsPerFile} avg imports / file
          </div>
        </div>

        <div className="bg-[var(--veyro-bg-surface)] p-3.5 rounded-lg border border-[var(--veyro-border)] space-y-1">
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] flex items-center justify-between">
            <span>Extracted Symbols</span>
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--veyro-text-primary)]">
            {metrics.totalSymbols.toLocaleString()}
          </div>
          <div className="text-[10px] text-[var(--veyro-text-tertiary)]">
            {metrics.averageSymbolsPerFile} avg symbols / file
          </div>
        </div>

        <div className="bg-[var(--veyro-bg-surface)] p-3.5 rounded-lg border border-[var(--veyro-border)] space-y-1">
          <div className="text-[11px] text-[var(--veyro-text-tertiary)] flex items-center justify-between">
            <span>Circular Loops</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--veyro-warning)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--veyro-warning)]">
            {metrics.cycles.length}
          </div>
          <div className="text-[10px] text-[var(--veyro-text-tertiary)]">
            {findings.length} total findings reported
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Depended-Upon Files (Central Architecture) */}
        <div className="space-y-2">
          <h3 className="font-semibold text-xs text-[var(--veyro-text-primary)] flex items-center gap-1.5">
            <Boxes className="w-4 h-4 text-[var(--veyro-accent)]" />
            <span>Core Architectural Hubs (Highest In-Degree)</span>
          </h3>

          <div className="bg-[var(--veyro-bg-surface)] rounded-lg border border-[var(--veyro-border)] divide-y divide-[var(--veyro-border-subtle)] font-mono text-[11px]">
            {metrics.highDependentFiles.length === 0 ? (
              <div className="p-3 text-[var(--veyro-text-tertiary)] italic">No dependency data.</div>
            ) : (
              metrics.highDependentFiles.slice(0, 5).map((f) => (
                <div
                  key={f.path}
                  onClick={() => {
                    selectFile(f.path);
                    setActiveTab('code');
                  }}
                  className="p-2.5 flex items-center justify-between hover:bg-[var(--veyro-bg-hover)] cursor-pointer transition-colors group"
                >
                  <span className="truncate text-[var(--veyro-text-primary)] group-hover:text-[var(--veyro-accent)]">
                    {f.path}
                  </span>
                  <span className="text-[10px] text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-elevated)] px-2 py-0.5 rounded border border-[var(--veyro-border-subtle)] shrink-0 ml-2">
                    {f.count} dependents
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Most Coupling Files (Highest Out-Degree) */}
        <div className="space-y-2">
          <h3 className="font-semibold text-xs text-[var(--veyro-text-primary)] flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>High Coupling Modules (Highest Out-Degree)</span>
          </h3>

          <div className="bg-[var(--veyro-bg-surface)] rounded-lg border border-[var(--veyro-border)] divide-y divide-[var(--veyro-border-subtle)] font-mono text-[11px]">
            {metrics.highDependencyFiles.length === 0 ? (
              <div className="p-3 text-[var(--veyro-text-tertiary)] italic">No dependency data.</div>
            ) : (
              metrics.highDependencyFiles.slice(0, 5).map((f) => (
                <div
                  key={f.path}
                  onClick={() => {
                    selectFile(f.path);
                    setActiveTab('code');
                  }}
                  className="p-2.5 flex items-center justify-between hover:bg-[var(--veyro-bg-hover)] cursor-pointer transition-colors group"
                >
                  <span className="truncate text-[var(--veyro-text-primary)] group-hover:text-[var(--veyro-cyan)]">
                    {f.path}
                  </span>
                  <span className="text-[10px] text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-elevated)] px-2 py-0.5 rounded border border-[var(--veyro-border-subtle)] shrink-0 ml-2">
                    {f.count} imports
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Truncation / Limits Alert if any */}
      {analysis.limitsReached.length > 0 && (
        <div className="bg-[var(--veyro-warning-muted)] border border-[rgba(251,191,36,0.3)] p-3.5 rounded-lg text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-[var(--veyro-warning)]">
            <ShieldAlert className="w-4 h-4" />
            <span>Repository Safeguards Triggered</span>
          </div>
          <p className="text-[var(--veyro-text-secondary)] text-[11px]">
            {analysis.truncationReason ||
              `Limits reached: ${analysis.limitsReached.join(', ')}. Analysis stopped early to prevent resource exhaustion.`}
          </p>
        </div>
      )}
    </div>
  );
}
