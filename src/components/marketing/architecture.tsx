'use client';

import React from 'react';
import {
  GitPullRequest,
  Cpu,
  Layers,
  LayoutDashboard,
  Database,
} from 'lucide-react';

const PIPELINE_STEPS = [
  {
    step: '01',
    name: 'GitHub Ingestion',
    icon: GitPullRequest,
    tech: 'POST /api/repository & /api/tree',
    summary: 'Resolves repository to an immutable 40-character commit SHA. Recursively fetches tree metadata and filters out vendor bundles (node_modules, dist, lockfiles).',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
  },
  {
    step: '02',
    name: 'Semantic Parser Registry',
    icon: Cpu,
    tech: 'TypeScript Compiler API + Python AST',
    summary: 'Routes files to language-specific adapters. Generates semantic symbol tables, import declarations, and structural exports without resorting to regex guesswork.',
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
  },
  {
    step: '03',
    name: 'Resolution & Topology',
    icon: Layers,
    tech: 'Tarjan SCC + Graph Metrics',
    summary: 'Maps specifiers to target file nodes. Computes incoming and outgoing degrees, identifies architectural hubs, and executes Tarjan’s algorithm for cycle detection.',
    color: 'border-[var(--veyro-cyan)]/30 text-[var(--veyro-cyan)] bg-[var(--veyro-cyan)]/5',
  },
  {
    step: '04',
    name: 'Explorer Workspace',
    icon: LayoutDashboard,
    tech: '@xyflow/react + CodeMirror 6 + Zustand',
    summary: 'Renders the deterministic dependency graph using Dagre layout. Synchronizes file selection, source inspection, and findings via a reactive client store.',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
  },
];

export function MarketingArchitecture() {
  return (
    <section id="architecture" className="py-24 bg-[#090A0D] border-t border-[var(--veyro-border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[11px] font-mono text-purple-400 mb-4">
            <Database className="w-3.5 h-3.5" />
            <span>End-to-End Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--veyro-text-primary)]">
            How VEYRO analyzes code without cloning
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--veyro-text-secondary)]">
            A strictly typed, bounded pipeline designed to inspect remote repositories with speed, security, and algorithmic precision.
          </p>
        </div>

        {/* Pipeline Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PIPELINE_STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] flex flex-col justify-between space-y-4 hover:border-[var(--veyro-border)]/80 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-[var(--veyro-text-tertiary)]">
                      {s.step}
                    </span>
                    <span className={`p-1.5 rounded-md border ${s.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-[var(--veyro-text-primary)] mb-1">
                    {s.name}
                  </h3>
                  <div className="font-mono text-[10px] text-[var(--veyro-cyan)] mb-3">
                    {s.tech}
                  </div>
                  <p className="text-xs text-[var(--veyro-text-secondary)] leading-relaxed">
                    {s.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--veyro-border)] text-[10px] font-mono text-[var(--veyro-text-tertiary)] flex items-center justify-between">
                  <span>Stage {idx + 1} of 4</span>
                  <span className="text-emerald-400">Strict Boundaries</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
