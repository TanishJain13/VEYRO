'use client';

/**
 * CodeMirror 6 code viewer with syntax highlighting and read-only display.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { markdown } from '@codemirror/lang-markdown';
import { Copy, Check, FileCode, Loader2, AlertCircle } from 'lucide-react';

export function CodeViewerPanel() {
  const { selectedFileContent, fileLoading, fileError } = useExplorerStore();
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize and update CodeMirror 6 instance
  useEffect(() => {
    if (!editorContainerRef.current) return;

    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    if (!selectedFileContent) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      oneDark,
      EditorState.readOnly.of(true),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          height: '100%',
          backgroundColor: 'var(--veyro-bg-base)',
          color: 'var(--veyro-text-primary)',
          fontSize: '12px',
          fontFamily: 'var(--font-mono, monospace)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          lineHeight: '1.6',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--veyro-bg-elevated)',
          color: 'var(--veyro-text-tertiary)',
          borderRight: '1px solid var(--veyro-border)',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'var(--veyro-bg-surface)',
          color: 'var(--veyro-text-primary)',
        },
      }),
    ];

    // Language extension selection
    const lang = selectedFileContent.language.toLowerCase();
    const ext = selectedFileContent.path.slice(selectedFileContent.path.lastIndexOf('.')).toLowerCase();

    if (lang === 'typescript' || ext === '.ts' || ext === '.tsx') {
      extensions.push(javascript({ typescript: true, jsx: ext === '.tsx' }));
    } else if (lang === 'javascript' || ext === '.js' || ext === '.jsx' || ext === '.mjs') {
      extensions.push(javascript({ jsx: ext === '.jsx' }));
    } else if (lang === 'python' || ext === '.py') {
      extensions.push(python());
    } else if (lang === 'json' || ext === '.json') {
      extensions.push(json());
    } else if (lang === 'css' || ext === '.css' || ext === '.scss') {
      extensions.push(css());
    } else if (lang === 'html' || ext === '.html') {
      extensions.push(html());
    } else if (lang === 'markdown' || ext === '.md') {
      extensions.push(markdown());
    }

    const startState = EditorState.create({
      doc: selectedFileContent.content,
      extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
      editorViewRef.current = null;
    };
  }, [selectedFileContent]);

  const handleCopy = async () => {
    if (!selectedFileContent?.content) return;
    await navigator.clipboard.writeText(selectedFileContent.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (fileLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--veyro-text-tertiary)] gap-2 bg-[var(--veyro-bg-base)]">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--veyro-accent)]" />
        <span>Fetching file source...</span>
      </div>
    );
  }

  if (fileError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center text-xs text-[var(--veyro-error)] gap-2 bg-[var(--veyro-bg-base)]">
        <AlertCircle className="w-6 h-6" />
        <span className="font-medium">Failed to load file</span>
        <span className="text-[var(--veyro-text-tertiary)] max-w-md">{fileError}</span>
      </div>
    );
  }

  if (!selectedFileContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--veyro-text-tertiary)] gap-2 bg-[var(--veyro-bg-base)]">
        <FileCode className="w-8 h-8 opacity-30" />
        <span>Select a file from the tree or graph to view source code</span>
      </div>
    );
  }

  const lineCount = selectedFileContent.content.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-[var(--veyro-bg-base)] overflow-hidden">
      {/* File Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-[var(--veyro-accent)] shrink-0" />
          <span className="font-mono text-[var(--veyro-text-primary)] truncate font-medium">
            {selectedFileContent.path}
          </span>
          <span className="text-[11px] text-[var(--veyro-text-tertiary)] bg-[var(--veyro-bg-surface)] px-1.5 py-0.5 rounded border border-[var(--veyro-border-subtle)] uppercase">
            {selectedFileContent.language}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] text-[var(--veyro-text-tertiary)]">
          <span>{lineCount.toLocaleString()} lines</span>
          <span>{formatBytes(selectedFileContent.size)}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-[var(--veyro-text-primary)] hover:bg-[var(--veyro-bg-surface)] px-2 py-0.5 rounded transition-colors"
            title="Copy source code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--veyro-success)]" />
                <span className="text-[var(--veyro-success)]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Mount Area */}
      <div ref={editorContainerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
