'use client';

/**
 * VEYRO Explorer — Interactive Codebase Intelligence Workspace.
 */
import React, { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { RepositoryInputBar } from '@/components/explorer/repository-input';
import { FileTreePanel } from '@/components/explorer/file-tree';
import { DependencyGraphPanel } from '@/components/explorer/dependency-graph';
import { CodeViewerPanel } from '@/components/explorer/code-viewer';
import { DependencyTablePanel } from '@/components/explorer/dependency-table';
import { OverviewPanel } from '@/components/explorer/overview-panel';
import { AnalysisSidebar } from '@/components/explorer/analysis-sidebar';
import { SearchModal } from '@/components/explorer/search-modal';
import {
  Boxes,
  Code2,
  Table as TableIcon,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  FolderTree,
  SlidersHorizontal,
  Home,
} from 'lucide-react';
import Link from 'next/link';

function UrlParamHandler() {
  const searchParams = useSearchParams();
  const { loadSampleRepository, analyzeRepositoryUrl, status, analysis } = useExplorerStore();

  useEffect(() => {
    if (status !== 'idle' || analysis) return;
    const sample = searchParams.get('sample');
    const repo = searchParams.get('repo');
    if (sample === 'true') {
      loadSampleRepository();
    } else if (repo) {
      analyzeRepositoryUrl(repo);
    }
  }, [searchParams, loadSampleRepository, analyzeRepositoryUrl, status, analysis]);

  return null;
}

export default function ExplorerPage() {
  const {
    activeTab,
    setActiveTab,
    leftSidebarOpen,
    toggleLeftSidebar,
    rightSidebarOpen,
    toggleRightSidebar,
    setSearchModalOpen,
    mobileView,
    setMobileView,
    analysis,
    loadSampleRepository,
    status,
  } = useExplorerStore();

  // If user navigated directly without loading any repo, provide quick CTA
  const isEmpty = status === 'idle' && !analysis;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--veyro-bg-deep)] text-[var(--veyro-text-primary)]">
      {/* Search Palette Modal */}
      <SearchModal />

      <Suspense fallback={null}>
        <UrlParamHandler />
      </Suspense>

      {/* Top Navbar / Repository Header */}
      <header className="shrink-0 flex items-center justify-between border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-base)] px-3 py-1.5 gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-bold tracking-wider text-sm text-white hover:text-[var(--veyro-accent)] transition-colors"
          >
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-[var(--veyro-accent)] to-[var(--veyro-cyan)] flex items-center justify-center text-[10px] text-black font-extrabold shadow-sm">
              V
            </div>
            <span>VEYRO</span>
          </Link>
          <span className="text-[var(--veyro-text-tertiary)] text-xs hidden sm:inline">|</span>
          <span className="text-xs text-[var(--veyro-text-secondary)] font-medium hidden sm:inline">
            Codebase Explorer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Search Shortcut */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[var(--veyro-bg-surface)] hover:bg-[var(--veyro-bg-hover)] border border-[var(--veyro-border)] rounded-md text-xs text-[var(--veyro-text-tertiary)] transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search codebase...</span>
            <kbd className="font-mono text-[10px] bg-[var(--veyro-bg-elevated)] px-1 rounded border border-[var(--veyro-border-subtle)]">
              Ctrl K
            </kbd>
          </button>

          <Link
            href="/"
            className="p-1.5 text-[var(--veyro-text-tertiary)] hover:text-white hover:bg-[var(--veyro-bg-surface)] rounded-md transition-colors"
            title="Return to Home"
          >
            <Home className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Repository Input Bar */}
      <RepositoryInputBar />

      {/* Main 3-Column Workspace (Desktop) & Responsive Layout */}
      {isEmpty ? (
        <EmptyExplorerState onLoadSample={loadSampleRepository} />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* 1. Left Sidebar: File Tree */}
          <div
            className={`transition-all duration-200 border-r border-[var(--veyro-border)] h-full overflow-hidden ${
              leftSidebarOpen
                ? 'w-72 shrink-0 hidden md:block'
                : 'w-0 hidden'
            } ${mobileView === 'tree' ? '!block !w-full' : ''}`}
          >
            <FileTreePanel />
          </div>

          {/* 2. Center Workspace: Graph, Code, Table, Overview */}
          <div
            className={`flex-1 flex flex-col h-full overflow-hidden ${
              mobileView !== 'workspace' ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Center Tab Header */}
            <div className="shrink-0 flex items-center justify-between border-b border-[var(--veyro-border)] bg-[var(--veyro-bg-elevated)] px-3 py-1">
              <div className="flex items-center gap-1">
                {/* Left Sidebar Toggle */}
                <button
                  onClick={toggleLeftSidebar}
                  className="hidden md:flex p-1 text-[var(--veyro-text-tertiary)] hover:text-white rounded hover:bg-[var(--veyro-bg-surface)] mr-1"
                  title={leftSidebarOpen ? 'Collapse files' : 'Expand files'}
                >
                  {leftSidebarOpen ? (
                    <PanelLeftClose className="w-4 h-4" />
                  ) : (
                    <PanelLeftOpen className="w-4 h-4" />
                  )}
                </button>

                {/* Workspace Tabs */}
                <TabButton
                  active={activeTab === 'graph'}
                  onClick={() => setActiveTab('graph')}
                  icon={<Boxes className="w-3.5 h-3.5" />}
                  label="Map View"
                />

                <TabButton
                  active={activeTab === 'code'}
                  onClick={() => setActiveTab('code')}
                  icon={<Code2 className="w-3.5 h-3.5" />}
                  label="Source"
                />

                <TabButton
                  active={activeTab === 'table'}
                  onClick={() => setActiveTab('table')}
                  icon={<TableIcon className="w-3.5 h-3.5" />}
                  label="Dependencies"
                />

                <TabButton
                  active={activeTab === 'overview'}
                  onClick={() => setActiveTab('overview')}
                  icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                  label="Overview"
                />
              </div>

              {/* Right Sidebar Toggle */}
              <button
                onClick={toggleRightSidebar}
                className="hidden md:flex p-1 text-[var(--veyro-text-tertiary)] hover:text-white rounded hover:bg-[var(--veyro-bg-surface)]"
                title={rightSidebarOpen ? 'Collapse inspector' : 'Expand inspector'}
              >
                {rightSidebarOpen ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Active Tab View Mount */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'graph' && <DependencyGraphPanel />}
              {activeTab === 'code' && <CodeViewerPanel />}
              {activeTab === 'table' && <DependencyTablePanel />}
              {activeTab === 'overview' && <OverviewPanel />}
            </div>
          </div>

          {/* 3. Right Sidebar: Inspector */}
          <div
            className={`transition-all duration-200 border-l border-[var(--veyro-border)] h-full overflow-hidden ${
              rightSidebarOpen
                ? 'w-80 shrink-0 hidden md:block'
                : 'w-0 hidden'
            } ${mobileView === 'inspector' ? '!block !w-full' : ''}`}
          >
            <AnalysisSidebar />
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isEmpty && (
        <div className="md:hidden shrink-0 flex items-center justify-around border-t border-[var(--veyro-border)] bg-[var(--veyro-bg-base)] py-2 text-xs">
          <button
            onClick={() => setMobileView('tree')}
            className={`flex flex-col items-center gap-1 ${
              mobileView === 'tree' ? 'text-[var(--veyro-accent)] font-semibold' : 'text-[var(--veyro-text-tertiary)]'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Files</span>
          </button>

          <button
            onClick={() => setMobileView('workspace')}
            className={`flex flex-col items-center gap-1 ${
              mobileView === 'workspace' ? 'text-[var(--veyro-accent)] font-semibold' : 'text-[var(--veyro-text-tertiary)]'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Workspace</span>
          </button>

          <button
            onClick={() => setMobileView('inspector')}
            className={`flex flex-col items-center gap-1 ${
              mobileView === 'inspector' ? 'text-[var(--veyro-accent)] font-semibold' : 'text-[var(--veyro-text-tertiary)]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Inspector</span>
          </button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
        active
          ? 'bg-[var(--veyro-bg-surface)] text-white shadow-sm'
          : 'text-[var(--veyro-text-tertiary)] hover:text-[var(--veyro-text-secondary)] hover:bg-[var(--veyro-bg-hover)]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyExplorerState({ onLoadSample }: { onLoadSample: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[var(--veyro-bg-base)]">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[var(--veyro-accent)] to-[var(--veyro-cyan)] flex items-center justify-center text-black font-extrabold text-2xl shadow-lg mb-4">
        V
      </div>

      <h2 className="text-lg font-bold text-[var(--veyro-text-primary)] mb-1">
        Explore Any Public GitHub Codebase
      </h2>

      <p className="text-xs text-[var(--veyro-text-secondary)] max-w-md mb-6 leading-relaxed">
        Enter a GitHub repository URL above to generate an interactive dependency map,
        detect circular import loops, and inspect source files.
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={onLoadSample}
          className="px-4 py-2 bg-[var(--veyro-accent)] hover:bg-[var(--veyro-accent-hover)] text-white text-xs font-medium rounded-lg shadow-md transition-colors flex items-center gap-2"
        >
          <span>Try Deterministic Sample Repository</span>
        </button>
      </div>
    </div>
  );
}
