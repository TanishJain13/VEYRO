import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExplorerStore } from '@/lib/store/explorer-store';
import { SAMPLE_RESOLVED_REPO } from '@/lib/fixtures/sample-repo';

describe('Explorer Store & Flow', () => {
  beforeEach(() => {
    useExplorerStore.getState().reset();
    vi.restoreAllMocks();
  });

  it('initializes in idle empty state', () => {
    const state = useExplorerStore.getState();
    expect(state.status).toBe('idle');
    expect(state.repositoryUrl).toBe('');
    expect(state.resolvedRepo).toBeNull();
    expect(state.analysis).toBeNull();
    expect(state.selectedPath).toBeNull();
    expect(state.activeTab).toBe('graph');
  });

  it('updates repositoryUrl and activeTab', () => {
    const store = useExplorerStore.getState();
    store.setRepositoryUrl('facebook/react');
    store.setActiveTab('code');

    expect(useExplorerStore.getState().repositoryUrl).toBe('facebook/react');
    expect(useExplorerStore.getState().activeTab).toBe('code');
  });

  it('manages folder expansion and collapsing', () => {
    const store = useExplorerStore.getState();
    store.toggleFolder('src/components');
    expect(useExplorerStore.getState().expandedFolders.has('src/components')).toBe(true);

    store.toggleFolder('src/components');
    expect(useExplorerStore.getState().expandedFolders.has('src/components')).toBe(false);

    store.collapseAllFolders();
    expect(useExplorerStore.getState().expandedFolders.size).toBe(0);
  });

  it('selects node and synchronizes with selectedPath', async () => {
    // Mock global fetch for file retrieval
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          path: 'src/index.ts',
          content: 'export const x = 1;',
          size: 19,
          language: 'typescript',
        },
      }),
    } as unknown as Response);

    useExplorerStore.setState({
      resolvedRepo: SAMPLE_RESOLVED_REPO,
    });

    const store = useExplorerStore.getState();
    await store.selectFile('src/index.ts');

    const state = useExplorerStore.getState();
    expect(state.selectedPath).toBe('src/index.ts');
    expect(state.selectedNodeId).toBe('src/index.ts');
    expect(state.selectedFileContent?.content).toBe('export const x = 1;');
  });

  it('handles API failure gracefully and updates errorMessage', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: false,
        error: { message: 'Repository not found on GitHub' },
      }),
    } as unknown as Response);

    const store = useExplorerStore.getState();
    await store.analyzeRepositoryUrl('https://github.com/nonexistent/repo');

    const state = useExplorerStore.getState();
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('Repository not found on GitHub');
  });
});
