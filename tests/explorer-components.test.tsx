import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { RepositoryInputBar } from '@/components/explorer/repository-input';
import { FileTreePanel } from '@/components/explorer/file-tree';
import { OverviewPanel } from '@/components/explorer/overview-panel';
import { getSampleTreeNodes } from '@/lib/fixtures/sample-repo';

describe('Explorer UI Components', () => {
  beforeEach(() => {
    useExplorerStore.getState().reset();
  });

  it('renders repository input bar with input and actions', () => {
    render(<RepositoryInputBar />);

    expect(
      screen.getByPlaceholderText(/Enter GitHub URL or owner\/repo/i)
    ).toBeDefined();
    expect(screen.getByText(/Explore/i)).toBeDefined();
    expect(screen.getByText(/Try Sample Repository/i)).toBeDefined();
  });

  it('renders empty file tree when no repository is loaded', () => {
    render(<FileTreePanel />);
    expect(screen.getByText(/No repository loaded/i)).toBeDefined();
  });

  it('renders file tree nodes when tree is loaded', () => {
    useExplorerStore.setState({
      tree: {
        nodes: getSampleTreeNodes(),
        totalFiles: 8,
        totalDirectories: 2,
        truncated: false,
      },
    });

    render(<FileTreePanel />);
    expect(screen.getByText('Files')).toBeDefined();
    expect(screen.getByText('8 files')).toBeDefined();
    expect(screen.getByPlaceholderText('Filter files...')).toBeDefined();
  });

  it('renders overview panel with metrics when analysis is populated', () => {
    useExplorerStore.setState({
      analysis: {
        repository: {
          owner: 'veyro-sample',
          name: 'fixture',
          fullName: 'veyro-sample/fixture',
          url: 'https://github.com/veyro-sample/fixture',
          description: 'Sample repo',
          defaultBranch: 'main',
          selectedBranch: 'main',
          commitSha: 'sample0000000000000000000000000000fixture',
          primaryLanguage: 'TypeScript',
          visibility: 'public',
          stars: 128,
          forks: 32,
          analyzedAt: new Date().toISOString(),
          treeComplete: true,
        },
        files: [],
        graph: { nodes: [], edges: [] },
        symbols: [],
        findings: [],
        metrics: {
          filesByLanguage: { typescript: 5, json: 1 },
          totalResolvedDependencies: 4,
          totalUnresolvedImports: 1,
          totalSymbols: 18,
          averageImportsPerFile: 1.5,
          averageSymbolsPerFile: 3.2,
          highDependencyFiles: [],
          highDependentFiles: [],
          dependencyHotspots: [],
          cycles: [],
          isolatedFiles: [],
        },
        coverage: {
          totalFiles: 8,
          analyzedFiles: 8,
          successfulFiles: 7,
          partialFiles: 1,
          failedFiles: 0,
          skippedFiles: 0,
          unsupportedFiles: 0,
          coveragePercent: 100,
          successPercent: 87.5,
        },
        duration: 250,
        truncated: false,
        truncationReason: null,
        limitsReached: [],
        analysisVersion: '0.1.0',
      },
    });

    render(<OverviewPanel />);
    expect(screen.getByText(/Files Analyzed/i)).toBeDefined();
    expect(screen.getByText(/Internal Dependencies/i)).toBeDefined();
    expect(screen.getByText(/Extracted Symbols/i)).toBeDefined();
  });
});
