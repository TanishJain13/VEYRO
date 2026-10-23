'use client';

/**
 * Tabular dependency view component.
 */
import React, { useState, useMemo } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import type { ResolutionStatus, DependencyKind } from '@/types/repository';
import { Search, Filter, AlertTriangle, CheckCircle, Package, BookOpen } from 'lucide-react';

export function DependencyTablePanel() {
  const { analysis, selectFile, setActiveTab } = useExplorerStore();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Collect all edges/imports across analyzed files
  const allDependencies = useMemo(() => {
    if (!analysis) return [];

    const list: Array<{
      id: string;
      source: string;
      target: string | null;
      specifier: string;
      kind: DependencyKind;
      status: ResolutionStatus;
      line: number | null;
    }> = [];

    // Map verified edges
    const verifiedEdgeMap = new Map<string, string>();
    for (const e of analysis.graph.edges) {
      verifiedEdgeMap.set(`${e.source}->${e.specifier}`, e.target);
    }

    // Traverse all files' imports
    for (const file of analysis.files) {
      for (const imp of file.imports) {
        const key = `${file.path}->${imp.specifier}`;
        const target = verifiedEdgeMap.get(key) || null;

        let status: ResolutionStatus = 'unresolved';
        if (target) {
          status = 'resolved';
        } else if (imp.specifier.startsWith('.')) {
          status = 'missing-file';
        } else if (
          imp.specifier.startsWith('node:') ||
          ['fs', 'path', 'os', 'http', 'crypto', 'sys'].includes(imp.specifier)
        ) {
          status = 'standard-library';
        } else {
          status = 'external-package';
        }

        list.push({
          id: `${file.path}:${imp.specifier}:${imp.line || 0}`,
          source: file.path,
          target,
          specifier: imp.specifier,
          kind: imp.kind as DependencyKind,
          status,
          line: imp.line,
        });
      }
    }

    return list;
  }, [analysis]);

  const filtered = useMemo(() => {
    return allDependencies.filter((dep) => {
      if (filterStatus !== 'all' && dep.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          dep.source.toLowerCase().includes(q) ||
          dep.specifier.toLowerCase().includes(q) ||
          (dep.target && dep.target.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allDependencies, filterStatus, search]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-base)]">
        No dependency analysis available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--veyro-bg-base)] overflow-hidden font-mono text-xs">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)] gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] mr-1" />
          {[
            { id: 'all', label: 'All', count: allDependencies.length },
            {
              id: 'resolved',
              label: 'Internal',
              count: allDependencies.filter((d) => d.status === 'resolved').length,
            },
            {
              id: 'external-package',
              label: 'Packages',
              count: allDependencies.filter((d) => d.status === 'external-package').length,
            },
            {
              id: 'standard-library',
              label: 'Stdlib',
              count: allDependencies.filter((d) => d.status === 'standard-library').length,
            },
            {
              id: 'missing-file',
              label: 'Broken',
              count: allDependencies.filter((d) => d.status === 'missing-file').length,
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStatus(item.id)}
              className={`px-2 py-1 rounded text-[11px] font-sans font-medium transition-colors ${
                filterStatus === item.id
                  ? 'bg-[var(--veyro-accent)] text-white'
                  : 'bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-secondary)] hover:text-white'
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dependencies..."
            className="pl-8 pr-3 py-1 text-xs bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border-subtle)] rounded text-[var(--veyro-text-primary)] placeholder-[var(--veyro-text-tertiary)] focus:outline-none focus:border-[var(--veyro-accent)]"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-[var(--veyro-bg-elevated)] border-b border-[var(--veyro-border)] text-[var(--veyro-text-tertiary)] text-[11px]">
            <tr>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Source File</th>
              <th className="py-2 px-3">Specifier</th>
              <th className="py-2 px-3">Resolved Target</th>
              <th className="py-2 px-3">Kind</th>
              <th className="py-2 px-3 text-right">Line</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--veyro-border-subtle)] text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[var(--veyro-text-tertiary)]">
                  No dependencies match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((dep) => (
                <tr
                  key={dep.id}
                  className="hover:bg-[var(--veyro-bg-surface)] transition-colors group"
                >
                  <td className="py-2 px-3 whitespace-nowrap">
                    <StatusBadge status={dep.status} />
                  </td>

                  <td className="py-2 px-3 max-w-[200px] truncate">
                    <button
                      onClick={() => {
                        selectFile(dep.source);
                        setActiveTab('code');
                      }}
                      className="text-[var(--veyro-text-secondary)] group-hover:text-[var(--veyro-accent)] hover:underline truncate"
                      title={dep.source}
                    >
                      {dep.source}
                    </button>
                  </td>

                  <td className="py-2 px-3 font-semibold text-[var(--veyro-text-primary)] max-w-[180px] truncate">
                    {dep.specifier}
                  </td>

                  <td className="py-2 px-3 max-w-[200px] truncate">
                    {dep.target ? (
                      <button
                        onClick={() => {
                          selectFile(dep.target!);
                          setActiveTab('code');
                        }}
                        className="text-[var(--veyro-cyan)] hover:underline flex items-center gap-1 truncate"
                        title={dep.target}
                      >
                        <span className="truncate">{dep.target}</span>
                      </button>
                    ) : (
                      <span className="text-[var(--veyro-text-tertiary)] italic">—</span>
                    )}
                  </td>

                  <td className="py-2 px-3 text-[var(--veyro-text-tertiary)] uppercase text-[10px]">
                    {dep.kind}
                  </td>

                  <td className="py-2 px-3 text-right text-[var(--veyro-text-tertiary)]">
                    {dep.line || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ResolutionStatus }) {
  if (status === 'resolved') {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--veyro-success)]">
        <CheckCircle className="w-3 h-3" />
        <span>Resolved</span>
      </span>
    );
  }
  if (status === 'missing-file') {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--veyro-error)]">
        <AlertTriangle className="w-3 h-3" />
        <span>Broken</span>
      </span>
    );
  }
  if (status === 'external-package') {
    return (
      <span className="inline-flex items-center gap-1 text-[var(--veyro-cyan)]">
        <Package className="w-3 h-3" />
        <span>Package</span>
      </span>
    );
  }
  if (status === 'standard-library') {
    return (
      <span className="inline-flex items-center gap-1 text-amber-300">
        <BookOpen className="w-3 h-3" />
        <span>Stdlib</span>
      </span>
    );
  }
  return <span className="text-[var(--veyro-text-tertiary)]">Unresolved</span>;
}
