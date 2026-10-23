'use client';

/**
 * Top repository input and identity header bar.
 */
import React, { useState } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import {
  Search,
  GitBranch,
  GitCommit,
  Star,
  GitFork,
  ArrowRight,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export function RepositoryInputBar() {
  const {
    repositoryUrl,
    setRepositoryUrl,
    analyzeRepositoryUrl,
    loadSampleRepository,
    status,
    statusMessage,
    errorMessage,
    resolvedRepo,
    reset,
  } = useExplorerStore();

  const [inputVal, setInputVal] = useState(repositoryUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;
    setRepositoryUrl(trimmed);
    analyzeRepositoryUrl(trimmed);
  };

  const isLoading = status === 'resolving' || status === 'fetching-tree' || status === 'analyzing';

  return (
    <div className="w-full bg-[var(--veyro-bg-elevated)] border-b border-[var(--veyro-border)] px-4 py-2.5">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1 flex items-center">
            <Search className="w-4 h-4 text-[var(--veyro-text-tertiary)] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Enter GitHub URL or owner/repo (e.g. facebook/react)"
              disabled={isLoading}
              className="w-full pl-9 pr-3 py-1.5 bg-[var(--veyro-bg-base)] border border-[var(--veyro-border)] rounded-md text-xs text-[var(--veyro-text-primary)] placeholder-[var(--veyro-text-tertiary)] focus:outline-none focus:border-[var(--veyro-accent)] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputVal.trim()}
            className="px-3 py-1.5 bg-[var(--veyro-accent)] hover:bg-[var(--veyro-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {!resolvedRepo && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setInputVal('https://github.com/veyro-sample/fixture');
                loadSampleRepository();
              }}
              className="px-2.5 py-1.5 bg-[var(--veyro-bg-surface)] hover:bg-[var(--veyro-bg-hover)] border border-[var(--veyro-border)] text-[var(--veyro-cyan)] text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="Runs deterministic sample fixture repository through the analysis pipeline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Try Sample Repository</span>
            </button>
          )}

          {resolvedRepo && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                reset();
              }}
              className="p-1.5 text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-primary)] hover:bg-[var(--veyro-bg-surface)] rounded-md transition-colors"
              title="Clear and analyze new repository"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Resolved Repo Metadata Badges */}
        {resolvedRepo && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <a
              href={resolvedRepo.metadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-[var(--veyro-text-primary)] hover:text-[var(--veyro-accent)] transition-colors"
            >
              <span>{resolvedRepo.metadata.fullName}</span>
              <ExternalLink className="w-3 h-3 text-[var(--veyro-text-tertiary)]" />
            </a>

            <div className="flex items-center gap-1 text-[var(--veyro-text-secondary)] bg-[var(--veyro-bg-surface)] px-2 py-0.5 rounded border border-[var(--veyro-border-subtle)] font-mono text-[11px]">
              <GitBranch className="w-3 h-3 text-[var(--veyro-accent)]" />
              <span>{resolvedRepo.branch}</span>
            </div>

            <div className="flex items-center gap-1 text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-surface)] px-2 py-0.5 rounded border border-[var(--veyro-border-subtle)] font-mono text-[11px]">
              <GitCommit className="w-3 h-3" />
              <span>{resolvedRepo.commitSha.slice(0, 7)}</span>
            </div>

            {resolvedRepo.metadata.stars > 0 && (
              <div className="flex items-center gap-1 text-[var(--veyro-text-tertiary)] text-[11px]">
                <Star className="w-3 h-3 text-amber-400" />
                <span>{resolvedRepo.metadata.stars.toLocaleString()}</span>
              </div>
            )}

            {resolvedRepo.metadata.forks > 0 && (
              <div className="flex items-center gap-1 text-[var(--veyro-text-tertiary)] text-[11px]">
                <GitFork className="w-3 h-3" />
                <span>{resolvedRepo.metadata.forks.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress & Error Status Notification Banner */}
      {statusMessage && (
        <div className="mt-2 text-xs flex items-center gap-2 text-[var(--veyro-cyan)] bg-[var(--veyro-cyan-muted)] border border-[rgba(92,214,232,0.2)] px-3 py-1.5 rounded-md">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 text-xs flex items-center justify-between text-[var(--veyro-error)] bg-[var(--veyro-error-muted)] border border-[rgba(248,113,113,0.2)] px-3 py-1.5 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => inputVal && analyzeRepositoryUrl(inputVal)}
            className="underline font-medium hover:text-white transition-colors ml-4 text-[11px]"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
