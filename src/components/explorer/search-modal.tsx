'use client';

/**
 * Global Search & Command Palette Modal.
 * Searches file paths, extracted symbols, import specifiers, and findings.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import {
  Search,
  FileCode,
  Code2,
  Boxes,
  AlertTriangle,
  X,
  CornerDownLeft,
} from 'lucide-react';

export function SearchModal() {
  const {
    searchModalOpen,
    setSearchModalOpen,
    analysis,
    selectFile,
    setActiveTab,
  } = useExplorerStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (searchModalOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        setQuery('');
        setSelectedIndex(0);
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [searchModalOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
      }
      if (e.key === 'Escape' && searchModalOpen) {
        setSearchModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchModalOpen, setSearchModalOpen]);

  // Search Results aggregation
  const results = useMemo(() => {
    if (!analysis || !query.trim()) return [];

    const q = query.toLowerCase().trim();
    const items: Array<{
      id: string;
      type: 'file' | 'symbol' | 'import' | 'finding';
      title: string;
      subtitle: string;
      filePath: string;
      line?: number | null;
    }> = [];

    // 1. Files
    for (const f of analysis.files) {
      if (f.path.toLowerCase().includes(q)) {
        items.push({
          id: `file:${f.path}`,
          type: 'file',
          title: f.path,
          subtitle: `${f.language.toUpperCase()} • ${f.size} bytes`,
          filePath: f.path,
        });
      }
    }

    // 2. Symbols
    for (const sym of analysis.symbols) {
      if (sym.name.toLowerCase().includes(q)) {
        items.push({
          id: `sym:${sym.id}`,
          type: 'symbol',
          title: sym.name,
          subtitle: `${sym.kind} in ${sym.filePath} (Line ${sym.startLine})`,
          filePath: sym.filePath,
          line: sym.startLine,
        });
      }
    }

    // 3. Imports
    for (const f of analysis.files) {
      for (const imp of f.imports) {
        if (imp.specifier.toLowerCase().includes(q)) {
          items.push({
            id: `imp:${f.path}:${imp.specifier}`,
            type: 'import',
            title: imp.specifier,
            subtitle: `Imported by ${f.path}`,
            filePath: f.path,
            line: imp.line,
          });
        }
      }
    }

    // 4. Findings
    for (const finding of analysis.findings) {
      if (
        finding.title.toLowerCase().includes(q) ||
        finding.description.toLowerCase().includes(q)
      ) {
        items.push({
          id: `finding:${finding.id}`,
          type: 'finding',
          title: finding.title,
          subtitle: finding.description,
          filePath: finding.filePath || '',
          line: finding.line,
        });
      }
    }

    return items.slice(0, 30);
  }, [analysis, query]);

  const handleSelect = (item: typeof results[0]) => {
    if (item.filePath) {
      selectFile(item.filePath);
      setActiveTab('code');
    }
    setSearchModalOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Codebase search command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100"
    >
      <div className="w-full max-w-xl bg-[var(--veyro-bg-elevated)] border border-[var(--veyro-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col text-xs font-sans">
        {/* Search Input Bar */}
        <div className="flex items-center px-3.5 py-3 border-b border-[var(--veyro-border)] gap-2.5">
          <Search className="w-4 h-4 text-[var(--veyro-text-tertiary)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search files, symbols, imports, or architectural findings..."
            className="flex-1 bg-transparent text-sm text-[var(--veyro-text-primary)] placeholder-[var(--veyro-text-tertiary)] focus:outline-none"
          />
          <button
            onClick={() => setSearchModalOpen(false)}
            className="p-1 text-[var(--veyro-text-tertiary)] hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {query && results.length === 0 ? (
            <div className="p-6 text-center text-xs text-[var(--veyro-text-tertiary)]">
              No matching files or symbols found for &quot;{query}&quot;.
            </div>
          ) : !query ? (
            <div className="p-6 text-center text-xs text-[var(--veyro-text-tertiary)]">
              Type to search repository files, symbols, and dependencies.
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-[var(--veyro-accent-muted)] border-l-2 border-[var(--veyro-accent)] text-white'
                    : 'hover:bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-secondary)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.type === 'file' ? (
                    <FileCode className="w-4 h-4 text-[var(--veyro-cyan)] shrink-0" />
                  ) : item.type === 'symbol' ? (
                    <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : item.type === 'import' ? (
                    <Boxes className="w-4 h-4 text-[var(--veyro-accent)] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}

                  <div className="min-w-0">
                    <div className="font-mono text-xs font-medium text-[var(--veyro-text-primary)] truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[var(--veyro-text-tertiary)] truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <CornerDownLeft className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] opacity-60 shrink-0 ml-2" />
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3.5 py-2 border-t border-[var(--veyro-border)] bg-[var(--veyro-bg-surface)] flex items-center justify-between text-[11px] text-[var(--veyro-text-tertiary)]">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
          <span>Ctrl + K</span>
        </div>
      </div>
    </div>
  );
}
