'use client';

import React from 'react';
import {
  Code2,
  Share2,
  FileSearch,
  Zap,
  Repeat,
  ShieldCheck,
  Search,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Code2,
    title: 'Real AST Parsers, Not Regex',
    desc: 'Uses the official TypeScript Compiler API and Python AST parser to extract genuine symbols, type interfaces, and import declarations. Never fooled by comments or multi-line strings.',
    color: 'text-[var(--veyro-cyan)]',
  },
  {
    icon: Repeat,
    title: 'Tarjan SCC Cycle Detection',
    desc: 'Finds circular dependency loops mathematically using Tarjan’s strongly connected components algorithm. Highlights affected files so you avoid nasty runtime undefined exports.',
    color: 'text-amber-400',
  },
  {
    icon: Share2,
    title: 'Deep Import Resolution',
    desc: 'Resolves relative specifiers, directory index files, external package dependencies, and Python standard libraries. Broken or unresolvable imports are transparently reported.',
    color: 'text-[var(--veyro-violet)]',
  },
  {
    icon: FileSearch,
    title: 'In-Context Code Viewing',
    desc: 'Embedded CodeMirror 6 client viewer with syntax highlighting and line numbers. Selecting any graph node or tree leaf pulls the raw file content at the pinned commit revision.',
    color: 'text-emerald-400',
  },
  {
    icon: Search,
    title: 'Global Command Palette (Ctrl+K)',
    desc: 'Instant keyboard-driven search indexing file paths, symbol declarations, external package imports, and architectural findings across the entire analyzed repository.',
    color: 'text-purple-400',
  },
  {
    icon: ShieldCheck,
    title: 'Honest Metrics & Denominators',
    desc: 'Parser coverage calculates an explicit denominator (analyzed / discovered files). No made-up scores or fake 100% badges—real engineering diagnostics.',
    color: 'text-[var(--veyro-cyan)]',
  },
];

export function MarketingFeatures() {
  return (
    <section id="features" className="py-24 bg-[#090A0D] border-t border-[var(--veyro-border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--veyro-violet)]/30 bg-[var(--veyro-violet)]/10 text-[11px] font-mono text-[var(--veyro-violet)] mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Developer-First Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--veyro-text-primary)]">
            Built for engineering teams who demand precision
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--veyro-text-secondary)]">
            Everything inside VEYRO is backed by genuine parsing pipelines and verified algorithmic graph topologies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] hover:border-[var(--veyro-border)]/80 hover:bg-[var(--veyro-bg-surface)]/80 transition-all space-y-3 group"
              >
                <div className={`p-2.5 rounded-lg bg-[var(--veyro-bg-base)] border border-[var(--veyro-border)] w-fit ${feature.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--veyro-text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-xs text-[var(--veyro-text-secondary)] leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
