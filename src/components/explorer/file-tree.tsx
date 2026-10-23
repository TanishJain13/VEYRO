'use client';

/**
 * File tree navigation component.
 */
import React, { useState, useMemo } from 'react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import type { RepositoryTreeNode } from '@/types/repository';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  ChevronRight,
  ChevronDown,
  Search,
  ChevronsUpDown,
  ChevronsDownUp,
  X,
} from 'lucide-react';

export function FileTreePanel() {
  const {
    tree,
    selectedPath,
    selectFile,
    expandedFolders,
    toggleFolder,
    expandAllFolders,
    collapseAllFolders,
    analysis,
  } = useExplorerStore();

  const [treeSearch, setTreeSearch] = useState('');

  // Set of paths that have parse errors/warnings for visual indicator
  const errorPathMap = useMemo(() => {
    const map = new Map<string, 'failed' | 'partial'>();
    if (analysis) {
      for (const f of analysis.files) {
        if (f.parseStatus === 'failed' || f.parseStatus === 'partial') {
          map.set(f.path, f.parseStatus);
        }
      }
    }
    return map;
  }, [analysis]);

  // Filter nodes matching search
  const filteredTree = useMemo(() => {
    if (!tree) return [];
    if (!treeSearch.trim()) return tree.nodes;

    const query = treeSearch.toLowerCase().trim();

    function filterNodes(nodes: RepositoryTreeNode[]): RepositoryTreeNode[] {
      const result: RepositoryTreeNode[] = [];

      for (const node of nodes) {
        if (node.type === 'file') {
          if (node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query)) {
            result.push(node);
          }
        } else if (node.type === 'directory') {
          const matchingChildren = node.children ? filterNodes(node.children) : [];
          if (
            matchingChildren.length > 0 ||
            node.name.toLowerCase().includes(query) ||
            node.path.toLowerCase().includes(query)
          ) {
            result.push({
              ...node,
              children: matchingChildren.length > 0 ? matchingChildren : node.children,
            });
          }
        }
      }

      return result;
    }

    return filterNodes(tree.nodes);
  }, [tree, treeSearch]);

  if (!tree) {
    return (
      <div className="p-4 text-xs text-[var(--veyro-text-tertiary)] flex flex-col items-center justify-center h-48 text-center">
        <Folder className="w-8 h-8 mb-2 opacity-30" />
        <p>No repository loaded.</p>
        <p className="mt-1 text-[11px]">Enter a GitHub URL above to analyze files.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--veyro-bg-base)] border-r border-[var(--veyro-border)] select-none">
      {/* Header & Controls */}
      <div className="p-2.5 border-b border-[var(--veyro-border)] space-y-2">
        <div className="flex items-center justify-between text-xs text-[var(--veyro-text-secondary)]">
          <span className="font-semibold text-[var(--veyro-text-primary)]">Files</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[var(--veyro-text-tertiary)]">
              {tree.totalFiles} files
            </span>
            <button
              onClick={expandAllFolders}
              title="Expand all folders"
              className="p-1 hover:bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-primary)] rounded"
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={collapseAllFolders}
              title="Collapse all folders"
              className="p-1 hover:bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-primary)] rounded"
            >
              <ChevronsDownUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={treeSearch}
            onChange={(e) => setTreeSearch(e.target.value)}
            placeholder="Filter files..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-[var(--veyro-bg-surface)] border border-[var(--veyro-border-subtle)] rounded text-[var(--veyro-text-primary)] placeholder-[var(--veyro-text-tertiary)] focus:outline-none focus:border-[var(--veyro-accent)]"
          />
          {treeSearch && (
            <button
              onClick={() => setTreeSearch('')}
              className="absolute right-2 top-2 text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs font-mono">
        {filteredTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--veyro-text-tertiary)]">
            No files match &quot;{treeSearch}&quot;
          </div>
        ) : (
          filteredTree.map((node) => (
            <TreeNodeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
              onSelectFile={selectFile}
              errorPathMap={errorPathMap}
              isSearching={Boolean(treeSearch)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface TreeNodeItemProps {
  node: RepositoryTreeNode;
  depth: number;
  selectedPath: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  errorPathMap: Map<string, 'failed' | 'partial'>;
  isSearching: boolean;
}

function TreeNodeItem({
  node,
  depth,
  selectedPath,
  expandedFolders,
  onToggleFolder,
  onSelectFile,
  errorPathMap,
  isSearching,
}: TreeNodeItemProps) {
  const isDirectory = node.type === 'directory';
  const isExpanded = isSearching || expandedFolders.has(node.path);
  const isSelected = selectedPath === node.path;
  const parseStatus = errorPathMap.get(node.path);

  if (isDirectory) {
    return (
      <div>
        <div
          onClick={() => onToggleFolder(node.path)}
          style={{ paddingLeft: `${depth * 14 + 6}px` }}
          className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-secondary)] hover:text-[var(--veyro-text-primary)] cursor-pointer group"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-text-tertiary)]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-text-tertiary)]" />
          )}

          {isExpanded ? (
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-accent)] opacity-80" />
          ) : (
            <Folder className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-text-tertiary)] group-hover:text-[var(--veyro-accent)]" />
          )}

          <span className="truncate">{node.name}</span>
        </div>

        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
                errorPathMap={errorPathMap}
                isSearching={isSearching}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File item
  return (
    <div
      onClick={() => onSelectFile(node.path)}
      style={{ paddingLeft: `${depth * 14 + 18}px` }}
      className={`flex items-center justify-between py-1 px-1.5 rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[var(--veyro-accent-muted)] text-white font-medium border-l-2 border-[var(--veyro-accent)]'
          : 'hover:bg-[var(--veyro-bg-surface)] text-[var(--veyro-text-secondary)] hover:text-[var(--veyro-text-primary)]'
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <FileIcon language={node.language} ext={node.name.slice(node.name.lastIndexOf('.'))} />
        <span className="truncate">{node.name}</span>
      </div>

      {parseStatus && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ml-1.5 ${
            parseStatus === 'failed' ? 'bg-[var(--veyro-error)]' : 'bg-[var(--veyro-warning)]'
          }`}
          title={parseStatus === 'failed' ? 'Parse failed' : 'Partial parse / warnings'}
        />
      )}
    </div>
  );
}

function FileIcon({ language, ext }: { language: string | null; ext: string }) {
  if (language === 'typescript' || ext === '.ts' || ext === '.tsx') {
    return <FileCode className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-lang-ts)]" />;
  }
  if (language === 'javascript' || ext === '.js' || ext === '.jsx') {
    return <FileCode className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-lang-js)]" />;
  }
  if (language === 'python' || ext === '.py') {
    return <FileCode className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-lang-py)]" />;
  }
  if (language === 'json' || ext === '.json') {
    return <FileJson className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-lang-json)]" />;
  }
  if (language === 'css' || ext === '.css' || ext === '.scss') {
    return <FileCode className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-lang-css)]" />;
  }
  if (language === 'markdown' || ext === '.md') {
    return <FileText className="w-3.5 h-3.5 shrink-0 text-amber-300" />;
  }
  return <File className="w-3.5 h-3.5 shrink-0 text-[var(--veyro-text-tertiary)]" />;
}
