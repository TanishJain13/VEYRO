'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  GitBranch,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export function MarketingHero() {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState('');

  const handleExplore = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = repoInput.trim();
    if (trimmed) {
      router.push(`/explorer?repo=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/explorer');
    }
  };

  const handleSample = () => {
    router.push('/explorer?sample=true');
  };

  return (
    <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden bg-[#090A0D]">
      {/* Background ambient architectural lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-[var(--veyro-violet)]/12 via-purple-900/10 to-[var(--veyro-cyan)]/12 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-12 left-1/5 w-80 h-80 bg-[var(--veyro-violet)]/8 blur-[120px] pointer-events-none rounded-full" />

      {/* Subtle background tech grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15192318_1px,transparent_1px),linear-gradient(to_bottom,#15192318_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)]/80 backdrop-blur-md text-xs font-mono text-[var(--veyro-text-secondary)] mb-8 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[var(--veyro-cyan)] animate-pulse" />
          <span className="text-[var(--veyro-text-primary)] font-semibold">VEYRO Codebase Intelligence</span>
          <span className="text-[var(--veyro-text-tertiary)]">•</span>
          <span className="text-[var(--veyro-cyan)] font-medium">Production-Grade AST Analysis</span>
        </div>

        {/* Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#F5F5F7] max-w-4xl mx-auto leading-[1.08]">
          Understand any{' '}
          <span className="bg-gradient-to-r from-[var(--veyro-violet)] via-purple-300 to-[var(--veyro-cyan)] bg-clip-text text-transparent">
            codebase.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="mt-6 text-base sm:text-lg text-[var(--veyro-text-secondary)] max-w-2xl mx-auto leading-relaxed">
          Turn a GitHub repository into a navigable map of dependencies, symbols, and architectural risks.
        </p>

        {/* Interactive Ingestion Form */}
        <div className="mt-9 max-w-xl mx-auto">
          <form
            onSubmit={handleExplore}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)]/95 backdrop-blur-xl shadow-2xl shadow-[var(--veyro-violet)]/10"
          >
            <div className="flex-1 flex items-center gap-2.5 px-3 py-2 text-xs">
              <svg className="w-4 h-4 text-[var(--veyro-text-tertiary)] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="github.com/owner/repository"
                className="w-full bg-transparent text-xs text-[var(--veyro-text-primary)] placeholder-[var(--veyro-text-tertiary)] focus:outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[var(--veyro-violet)] hover:bg-[var(--veyro-violet)]/90 text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shrink-0 shadow-md shadow-[var(--veyro-violet)]/20"
            >
              <span>Explore Codebase</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Deterministic Sample Repository CTA */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--veyro-text-secondary)]">
            <span>Or explore without typing:</span>
            <button
              onClick={handleSample}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] hover:border-[var(--veyro-cyan)]/50 hover:text-[var(--veyro-cyan)] text-[11px] font-mono transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[var(--veyro-cyan)]" />
              <span>Try Sample Repository</span>
            </button>
          </div>
        </div>

        {/* Floating Architectural Visual Composition Mock */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)] shadow-2xl p-4 sm:p-6 overflow-hidden relative text-left">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--veyro-border)]/80 text-xs font-mono">
            <div className="flex items-center gap-2 text-[var(--veyro-text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-semibold text-white">Interactive Architectural Topology</span>
            </div>
            <div className="text-[11px] text-[var(--veyro-cyan)] font-semibold flex items-center gap-1.5">
              <span>Tarjan SCC Verified</span>
            </div>
          </div>

          {/* Mini Graph Composition */}
          <div className="relative rounded-xl border border-[var(--veyro-border)] bg-[var(--veyro-bg-base)] p-5 min-h-[160px] flex items-center justify-center overflow-hidden">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="20%" y1="50%" x2="50%" y2="50%" stroke="#8B7CFF" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="50%" y1="50%" x2="80%" y2="50%" stroke="#5CD6E8" strokeWidth="2" strokeDasharray="3 3" />
            </svg>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full relative z-10">
              <div className="p-3 rounded-lg border border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--veyro-text-tertiary)]">Entrypoint</div>
                <div className="text-xs font-mono font-bold text-white truncate">src/index.ts</div>
                <div className="text-[10px] font-mono text-[var(--veyro-cyan)]">Exports: main()</div>
              </div>

              <div className="p-3 rounded-lg border-2 border-[var(--veyro-violet)] bg-[var(--veyro-bg-surface)] space-y-1 shadow-lg shadow-[var(--veyro-violet)]/15">
                <div className="text-[10px] font-mono text-[var(--veyro-violet)] font-semibold">Hub Module</div>
                <div className="text-xs font-mono font-bold text-white truncate">src/services/auth.ts</div>
                <div className="text-[10px] font-mono text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Cycle with user.ts</span>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-[var(--veyro-cyan)]/60 bg-[var(--veyro-bg-surface)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--veyro-cyan)] font-semibold">Crypto Utility</div>
                <div className="text-xs font-mono font-bold text-white truncate">src/utils/crypto.ts</div>
                <div className="text-[10px] font-mono text-emerald-400">node:crypto + bcrypt</div>
              </div>
            </div>
          </div>
        </div>

        {/* Factual Product Capability Indicators */}
        <div className="mt-14 pt-8 border-t border-[var(--veyro-border)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3.5 rounded-xl bg-[var(--veyro-bg-surface)]/60 border border-[var(--veyro-border)] space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--veyro-text-primary)]">
              <Cpu className="w-3.5 h-3.5 text-[var(--veyro-cyan)]" />
              <span>TypeScript Compiler API</span>
            </div>
            <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed">
              True semantic AST parsing for symbols, functions, types, and exports.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--veyro-bg-surface)]/60 border border-[var(--veyro-border)] space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--veyro-text-primary)]">
              <Layers className="w-3.5 h-3.5 text-[var(--veyro-violet)]" />
              <span>Tarjan SCC Cycles</span>
            </div>
            <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed">
              Strongly connected components isolation mathematically finds recursion.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--veyro-bg-surface)]/60 border border-[var(--veyro-border)] space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Pinned 40-Char SHA</span>
            </div>
            <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed">
              Every file and graph node bound to an immutable GitHub commit revision.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[var(--veyro-bg-surface)]/60 border border-[var(--veyro-border)] space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% In-Memory Analysis</span>
            </div>
            <p className="text-[11px] text-[var(--veyro-text-secondary)] leading-relaxed">
              Static analysis without running untrusted code or saving data to disk.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
