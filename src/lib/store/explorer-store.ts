/**
 * Zustand store for VEYRO Explorer.
 * Manages repository state, active selections, graph filters, and content fetching.
 */
import { create } from 'zustand';
import type { ResolvedRepository } from '@/lib/github/repository';
import type {
  RepositoryTree,
  RepositoryTreeNode,
  AnalysisResult,
} from '@/types/repository';
import type { ApiResponse } from '@/types/api';
import { SAMPLE_REPO_URL } from '@/lib/fixtures/sample-repo';

export type ExplorerStatus =
  | 'idle'
  | 'resolving'
  | 'fetching-tree'
  | 'analyzing'
  | 'success'
  | 'error';

export type WorkspaceTab = 'graph' | 'code' | 'table' | 'overview';

export interface FileContentState {
  path: string;
  content: string;
  size: number;
  language: string;
}

export interface ExplorerState {
  // Repository & Pipeline State
  repositoryUrl: string;
  resolvedRepo: ResolvedRepository | null;
  tree: RepositoryTree | null;
  analysis: AnalysisResult | null;
  status: ExplorerStatus;
  statusMessage: string | null;
  errorMessage: string | null;

  // Active Selections
  selectedPath: string | null;
  selectedFileContent: FileContentState | null;
  fileLoading: boolean;
  fileError: string | null;
  selectedNodeId: string | null;

  // Workspace & Navigation
  activeTab: WorkspaceTab;
  searchQuery: string;
  languageFilter: string | null;
  expandedFolders: Set<string>;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  mobileView: 'tree' | 'workspace' | 'inspector';
  searchModalOpen: boolean;

  // Actions
  setRepositoryUrl: (url: string) => void;
  analyzeRepositoryUrl: (url: string, branch?: string) => Promise<void>;
  loadSampleRepository: () => Promise<void>;
  selectFile: (path: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  setActiveTab: (tab: WorkspaceTab) => void;
  setSearchQuery: (query: string) => void;
  setLanguageFilter: (language: string | null) => void;
  toggleFolder: (folderPath: string) => void;
  expandAllFolders: () => void;
  collapseAllFolders: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setMobileView: (view: 'tree' | 'workspace' | 'inspector') => void;
  setSearchModalOpen: (open: boolean) => void;
  reset: () => void;
}

let activeRequestId = 0;

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  repositoryUrl: '',
  resolvedRepo: null,
  tree: null,
  analysis: null,
  status: 'idle',
  statusMessage: null,
  errorMessage: null,

  selectedPath: null,
  selectedFileContent: null,
  fileLoading: false,
  fileError: null,
  selectedNodeId: null,

  activeTab: 'graph',
  searchQuery: '',
  languageFilter: null,
  expandedFolders: new Set<string>(['src']),
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  mobileView: 'workspace',
  searchModalOpen: false,

  setRepositoryUrl: (url: string) => set({ repositoryUrl: url }),

  analyzeRepositoryUrl: async (url: string, branch?: string) => {
    const currentRequestId = ++activeRequestId;

    set({
      status: 'resolving',
      statusMessage: 'Resolving repository and commit SHA...',
      errorMessage: null,
      selectedPath: null,
      selectedFileContent: null,
      selectedNodeId: null,
    });

    try {
      // 1. Resolve repository
      const repoRes = await fetch('/api/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, branch }),
      });

      const repoJson: ApiResponse<ResolvedRepository> = await repoRes.json();
      if (!repoJson.success || !repoJson.data) {
        throw new Error(repoJson.error?.message || 'Failed to resolve repository');
      }

      // Check for stale request
      if (currentRequestId !== activeRequestId) return;

      const resolved = repoJson.data;
      set({
        resolvedRepo: resolved,
        status: 'fetching-tree',
        statusMessage: `Fetching repository tree at revision ${resolved.commitSha.slice(0, 7)}...`,
      });

      // 2. Fetch tree
      const treeRes = await fetch(
        `/api/tree?owner=${encodeURIComponent(resolved.metadata.owner)}&repo=${encodeURIComponent(
          resolved.metadata.name
        )}&sha=${encodeURIComponent(resolved.commitSha)}`
      );

      const treeJson: ApiResponse<RepositoryTree> = await treeRes.json();
      if (!treeJson.success || !treeJson.data) {
        throw new Error(treeJson.error?.message || 'Failed to fetch repository tree');
      }

      if (currentRequestId !== activeRequestId) return;

      const treeData = treeJson.data;
      set({
        tree: treeData,
        status: 'analyzing',
        statusMessage: `Parsing ASTs and resolving dependencies for ${treeData.totalFiles} files...`,
      });

      // 3. Analyze repository
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: resolved.metadata.owner,
          repo: resolved.metadata.name,
          sha: resolved.commitSha,
          branch: resolved.branch,
        }),
      });

      const analyzeJson: ApiResponse<AnalysisResult> = await analyzeRes.json();
      if (!analyzeJson.success || !analyzeJson.data) {
        throw new Error(analyzeJson.error?.message || 'Repository analysis failed');
      }

      if (currentRequestId !== activeRequestId) return;

      const analysisData = analyzeJson.data;

      // Automatically select first file or entry point
      const entryNode = analysisData.graph.nodes.find((n) => n.isEntryPoint) || analysisData.graph.nodes[0];
      const initialPath = entryNode ? entryNode.path : null;

      set({
        analysis: analysisData,
        status: 'success',
        statusMessage: null,
        selectedPath: initialPath,
        selectedNodeId: initialPath,
      });

      // Open initial file content
      if (initialPath) {
        get().selectFile(initialPath);
      }
    } catch (err) {
      if (currentRequestId !== activeRequestId) return;
      const message = err instanceof Error ? err.message : 'Analysis failed';
      set({
        status: 'error',
        errorMessage: message,
        statusMessage: null,
      });
    }
  },

  loadSampleRepository: async () => {
    set({ repositoryUrl: SAMPLE_REPO_URL });
    await get().analyzeRepositoryUrl(SAMPLE_REPO_URL);
  },

  selectFile: async (path: string) => {
    const { resolvedRepo, analysis } = get();

    // Set selection immediately
    set({
      selectedPath: path,
      selectedNodeId: path,
      fileLoading: true,
      fileError: null,
    });

    // Check if this path exists in graph to sync node
    if (analysis) {
      const nodeExists = analysis.graph.nodes.some((n) => n.path === path);
      if (nodeExists) {
        set({ selectedNodeId: path });
      }
    }

    if (!resolvedRepo) {
      set({ fileLoading: false });
      return;
    }

    try {
      const res = await fetch(
        `/api/file?owner=${encodeURIComponent(resolvedRepo.metadata.owner)}&repo=${encodeURIComponent(
          resolvedRepo.metadata.name
        )}&sha=${encodeURIComponent(resolvedRepo.commitSha)}&path=${encodeURIComponent(path)}`
      );

      const json: ApiResponse<FileContentState> = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error?.message || `Failed to fetch file content: ${path}`);
      }

      set({
        selectedFileContent: json.data,
        fileLoading: false,
        fileError: null,
      });
    } catch (err) {
      set({
        fileLoading: false,
        fileError: err instanceof Error ? err.message : 'Error retrieving file content',
        selectedFileContent: null,
      });
    }
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
    if (nodeId) {
      get().selectFile(nodeId);
    }
  },

  setActiveTab: (tab: WorkspaceTab) => set({ activeTab: tab }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setLanguageFilter: (language: string | null) => set({ languageFilter: language }),

  toggleFolder: (folderPath: string) => {
    const expanded = new Set(get().expandedFolders);
    if (expanded.has(folderPath)) {
      expanded.delete(folderPath);
    } else {
      expanded.add(folderPath);
    }
    set({ expandedFolders: expanded });
  },

  expandAllFolders: () => {
    const { tree } = get();
    if (!tree) return;
    const allDirs = new Set<string>();

    function collectDirs(nodes: RepositoryTreeNode[]) {
      for (const node of nodes) {
        if (node.type === 'directory') {
          allDirs.add(node.path);
          if (node.children) collectDirs(node.children);
        }
      }
    }

    collectDirs(tree.nodes);
    set({ expandedFolders: allDirs });
  },

  collapseAllFolders: () => set({ expandedFolders: new Set() }),

  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),

  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  setMobileView: (view) => set({ mobileView: view }),

  setSearchModalOpen: (open) => set({ searchModalOpen: open }),

  reset: () => {
    activeRequestId++;
    set({
      repositoryUrl: '',
      resolvedRepo: null,
      tree: null,
      analysis: null,
      status: 'idle',
      statusMessage: null,
      errorMessage: null,
      selectedPath: null,
      selectedFileContent: null,
      fileLoading: false,
      fileError: null,
      selectedNodeId: null,
      searchQuery: '',
      languageFilter: null,
    });
  },
}));
