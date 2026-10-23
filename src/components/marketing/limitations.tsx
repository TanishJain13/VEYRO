'use client';

import React from 'react';
import {
  ShieldAlert,
  Lock,
  Layers,
  Scale,
} from 'lucide-react';

const LANGUAGE_SUPPORT = [
  {
    language: 'TypeScript / JavaScript',
    exts: '.ts, .tsx, .js, .jsx, .mjs',
    status: 'Full AST Support',
    details: 'TypeScript Compiler API parsing. Resolves ES imports, exports, dynamic imports, and index files.',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    language: 'Python',
    exts: '.py',
    status: 'Full Grammar Support',
    details: 'Python AST grammar. Resolves dotted imports (from .utils import x) and standard library modules.',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    language: 'CSS',
    exts: '.css',
    status: 'At-Rule Parsing',
    details: 'Extracts @import statements and url() dependency references into graph edges.',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    language: 'JSON',
    exts: '.json, package.json',
    status: 'Manifest Parsing',
    details: 'Extracts npm package dependencies, devDependencies, and peerDependencies.',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    language: 'Go / Rust / Java',
    exts: '.go, .rs, .java',
    status: 'Planned / Roadmap',
    details: 'Currently treated with fallback reader. Dedicated tree-sitter adapters planned for v0.5.',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
];

const SAFEGUARDS = [
  {
    icon: Lock,
    title: 'Rate-Limit Transparency',
    desc: 'Unauthenticated GitHub API calls are subject to GitHub’s 60 req/hr IP limit. If exhausted, VEYRO provides clean reset diagnostics and HTTP 429 notifications.',
  },
  {
    icon: Scale,
    title: 'Max Analyzed Files (200 Cap)',
    desc: 'To prevent browser lockups on massive monorepos, VEYRO bounds AST parsing to the top 200 relevant code files, prioritizing source code over build outputs.',
  },
  {
    icon: ShieldAlert,
    title: '500KB Max File Size Cap',
    desc: 'Minified bundles or large binaries exceeding 500KB are skipped from AST parsing to preserve memory and maintain responsive UI rendering.',
  },
  {
    icon: Layers,
    title: 'Bounded Concurrency (5)',
    desc: 'Concurrent file fetches are clamped to a pool of 5 simultaneous HTTP requests to stay within network thresholds and avoid secondary rate limits.',
  },
];

export function MarketingLimitations() {
  return (
    <section id="limitations" className="py-24 bg-[#090A0D] border-t border-[var(--veyro-border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-mono text-amber-400 mb-4">
            <Scale className="w-3.5 h-3.5" />
            <span>Honest Engineering</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--veyro-text-primary)]">
            Language support & runtime limitations
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--veyro-text-secondary)]">
            We don’t promise fake magic. Here is exactly what VEYRO supports today and the engineering boundaries we enforce.
          </p>
        </div>

        {/* Language Matrix Table */}
        <div className="mb-14 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] overflow-hidden shadow-lg">
          <div className="p-4 bg-[var(--veyro-bg-base)] border-b border-[var(--veyro-border)] flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--veyro-text-primary)]">Parser Matrix</span>
            <span className="text-[11px] font-mono text-[var(--veyro-text-tertiary)]">Strict AST & Token Parsers</span>
          </div>
          <div className="divide-y divide-[var(--veyro-border)] overflow-x-auto">
            {LANGUAGE_SUPPORT.map((item, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 sm:w-1/3">
                  <div className="font-semibold text-[var(--veyro-text-primary)] flex items-center gap-2">
                    <span>{item.language}</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--veyro-text-tertiary)]">{item.exts}</div>
                </div>

                <div className="sm:w-1/2 text-xs text-[var(--veyro-text-secondary)] leading-relaxed">
                  {item.details}
                </div>

                <div className="sm:w-1/6 flex sm:justify-end">
                  <span className={`px-2.5 py-1 rounded-full border text-[10px] font-mono whitespace-nowrap ${item.badge}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Safeguards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAFEGUARDS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] space-y-2.5"
              >
                <div className="p-2 rounded-lg bg-[var(--veyro-bg-base)] border border-[var(--veyro-border)] w-fit text-[var(--veyro-cyan)]">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-[var(--veyro-text-primary)]">{s.title}</h4>
                <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
