'use client';

/**
 * Interactive React Flow dependency graph with Dagre layout,
 * language filtering, dependency highlighting, and node inspection.
 */
import React, { useMemo, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useExplorerStore } from '@/lib/store/explorer-store';
import type { GraphNode as DomainGraphNode } from '@/types/repository';
import {
  Filter,
  Flame,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 72;

// Custom Node Component
function CustomFileNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as DomainGraphNode & {
    isDimmed?: boolean;
    isHighlighted?: boolean;
  };

  const langColor =
    nodeData.language === 'typescript'
      ? 'var(--veyro-lang-ts)'
      : nodeData.language === 'javascript'
      ? 'var(--veyro-lang-js)'
      : nodeData.language === 'python'
      ? 'var(--veyro-lang-py)'
      : nodeData.language === 'json'
      ? 'var(--veyro-lang-json)'
      : nodeData.language === 'css'
      ? 'var(--veyro-lang-css)'
      : 'var(--veyro-lang-other)';

  const fileName = nodeData.path.split('/').pop() || nodeData.path;
  const dirPath = nodeData.path.includes('/')
    ? nodeData.path.slice(0, nodeData.path.lastIndexOf('/'))
    : '';

  return (
    <div
      style={{
        width: `${NODE_WIDTH}px`,
        opacity: nodeData.isDimmed ? 0.25 : 1,
        transition: 'opacity 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      className={`px-3 py-2 rounded-lg bg-[var(--veyro-bg-surface)] border text-xs shadow-md select-none cursor-pointer ${
        selected
          ? 'border-[var(--veyro-accent)] ring-2 ring-[var(--veyro-accent-glow)] bg-[var(--veyro-bg-overlay)]'
          : nodeData.isHighlighted
          ? 'border-[var(--veyro-cyan)] ring-1 ring-[var(--veyro-cyan-muted)]'
          : 'border-[var(--veyro-border)] hover:border-[var(--veyro-border-strong)]'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[var(--veyro-border-strong)]" />

      {/* Directory context if present */}
      {dirPath && (
        <div className="text-[10px] text-[var(--veyro-text-tertiary)] font-mono truncate mb-0.5">
          {dirPath}/
        </div>
      )}

      {/* File Name & Language Pill */}
      <div className="flex items-center justify-between gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: langColor }}
          />
          <span className="font-mono font-medium text-[var(--veyro-text-primary)] truncate text-[11px]">
            {fileName}
          </span>
        </div>

        {nodeData.isHotspot && (
          <span title="Dependency Hotspot" className="text-amber-400 shrink-0">
            <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
          </span>
        )}
      </div>

      {/* Badges / Metrics row */}
      <div className="flex items-center gap-2 text-[10px] text-[var(--veyro-text-tertiary)] pt-1 border-t border-[var(--veyro-border-subtle)]">
        <span>{nodeData.importCount} out</span>
        <span>•</span>
        <span>{nodeData.symbolCount} syms</span>
        {nodeData.isEntryPoint && (
          <>
            <span>•</span>
            <span className="text-[var(--veyro-accent)] font-medium">entry</span>
          </>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[var(--veyro-accent)]" />
    </div>
  );
}

const nodeTypes = {
  fileNode: CustomFileNode,
};

function DependencyGraphInner() {
  const {
    analysis,
    selectedNodeId,
    selectNode,
    languageFilter,
    setLanguageFilter,
  } = useExplorerStore();

  const reactFlowInstance = useReactFlow();

  // 1. Filter nodes based on selected language
  const filteredDomainNodes = useMemo(() => {
    if (!analysis) return [];
    if (!languageFilter) return analysis.graph.nodes;
    return analysis.graph.nodes.filter((n) => n.language.toLowerCase() === languageFilter.toLowerCase());
  }, [analysis, languageFilter]);

  const filteredNodeSet = useMemo(() => {
    return new Set(filteredDomainNodes.map((n) => n.path));
  }, [filteredDomainNodes]);

  // 2. Filter edges to only connect visible nodes
  const filteredDomainEdges = useMemo(() => {
    if (!analysis) return [];
    return analysis.graph.edges.filter(
      (e) => filteredNodeSet.has(e.source) && filteredNodeSet.has(e.target)
    );
  }, [analysis, filteredNodeSet]);

  // 3. Compute Connected Nodes for active selection highlighting
  const connectedNodes = useMemo(() => {
    if (!selectedNodeId || !analysis) return null;
    const connected = new Set<string>([selectedNodeId]);

    for (const e of analysis.graph.edges) {
      if (e.source === selectedNodeId) connected.add(e.target);
      if (e.target === selectedNodeId) connected.add(e.source);
    }

    return connected;
  }, [selectedNodeId, analysis]);

  // 4. Calculate Dagre Hierarchical Layout (memoized to avoid re-layout on each render)
  const { initialNodes, initialEdges } = useMemo(() => {
    if (filteredDomainNodes.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'TB',
      nodesep: 40,
      ranksep: 60,
      marginx: 30,
      marginy: 30,
    });
    g.setDefaultEdgeLabel(() => ({}));

    for (const node of filteredDomainNodes) {
      g.setNode(node.path, { width: NODE_WIDTH, height: NODE_HEIGHT });
    }

    for (const edge of filteredDomainEdges) {
      g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    const layoutNodes: Node[] = filteredDomainNodes.map((node) => {
      const pos = g.node(node.path) || { x: 0, y: 0 };
      const isDimmed = connectedNodes ? !connectedNodes.has(node.path) : false;
      const isHighlighted =
        connectedNodes && connectedNodes.has(node.path) && node.path !== selectedNodeId;

      return {
        id: node.path,
        type: 'fileNode',
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
        data: {
          ...node,
          isDimmed,
          isHighlighted,
        },
        selected: node.path === selectedNodeId,
      };
    });

    const layoutEdges: Edge[] = filteredDomainEdges.map((edge) => {
      const isConnected =
        !selectedNodeId || edge.source === selectedNodeId || edge.target === selectedNodeId;
      const isCycleEdge = analysis?.metrics.cycles.some(
        (cycle) => cycle.includes(edge.source) && cycle.includes(edge.target)
      );

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.kind === 'dynamic-import' || Boolean(isCycleEdge),
        style: {
          stroke: isCycleEdge
            ? 'var(--veyro-warning)'
            : isConnected && selectedNodeId
            ? 'var(--veyro-cyan)'
            : 'var(--veyro-border-strong)',
          strokeWidth: isConnected && selectedNodeId ? 2 : 1,
          opacity: selectedNodeId && !isConnected ? 0.2 : 0.8,
        },
      };
    });

    return { initialNodes: layoutNodes, initialEdges: layoutEdges };
  }, [filteredDomainNodes, filteredDomainEdges, connectedNodes, selectedNodeId, analysis]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes & edges when layout changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Center on selected node if selected from tree
  useEffect(() => {
    if (!selectedNodeId || !reactFlowInstance) return;
    const node = reactFlowInstance.getNode(selectedNodeId);
    if (node) {
      reactFlowInstance.setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + NODE_HEIGHT / 2, {
        zoom: 1.1,
        duration: 400,
      });
    }
  }, [selectedNodeId, reactFlowInstance]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  if (!analysis || analysis.graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-xs text-[var(--veyro-text-tertiary)] gap-2 bg-[var(--veyro-bg-base)]">
        <Sparkles className="w-8 h-8 opacity-30" />
        <span>No graph nodes available. Analyze a repository to inspect its architecture.</span>
      </div>
    );
  }

  // Get distinct languages in graph for filtering
  const distinctLanguages = Array.from(
    new Set(analysis.graph.nodes.map((n) => n.language).filter(Boolean))
  );

  return (
    <div className="relative w-full h-full bg-[var(--veyro-bg-base)] overflow-hidden">
      {/* Top Graph Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none gap-2 flex-wrap">
        {/* Language Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[var(--veyro-bg-surface)] p-1 rounded-lg border border-[var(--veyro-border)] shadow-lg pointer-events-auto backdrop-blur text-xs">
          <Filter className="w-3.5 h-3.5 text-[var(--veyro-text-tertiary)] ml-1 mr-0.5" />
          <button
            onClick={() => setLanguageFilter(null)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              !languageFilter
                ? 'bg-[var(--veyro-accent)] text-white'
                : 'text-[var(--veyro-text-secondary)] hover:text-white'
            }`}
          >
            All ({analysis.graph.nodes.length})
          </button>
          {distinctLanguages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguageFilter(lang)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors capitalize ${
                languageFilter === lang
                  ? 'bg-[var(--veyro-accent)] text-white'
                  : 'text-[var(--veyro-text-secondary)] hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
          {languageFilter && (
            <button
              onClick={() => setLanguageFilter(null)}
              className="p-1 hover:text-white text-[var(--veyro-text-tertiary)]"
              title="Reset language filter"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-2 bg-[var(--veyro-bg-surface)] px-2.5 py-1 rounded-lg border border-[var(--veyro-border)] text-xs text-[var(--veyro-text-secondary)] pointer-events-auto font-mono text-[11px]">
          <span>{filteredDomainNodes.length} nodes</span>
          <span>•</span>
          <span>{filteredDomainEdges.length} edges</span>
          {analysis.metrics.cycles.length > 0 && (
            <>
              <span>•</span>
              <span className="text-[var(--veyro-warning)] font-medium">
                {analysis.metrics.cycles.length} cycle{analysis.metrics.cycles.length > 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        className="bg-[var(--veyro-bg-base)]"
      >
        <Background color="var(--veyro-border-subtle)" gap={20} size={1} />
        <Controls
          className="!bg-[var(--veyro-bg-surface)] !border-[var(--veyro-border)] !rounded-lg !shadow-lg [&>button]:!bg-[var(--veyro-bg-surface)] [&>button]:!border-b-[var(--veyro-border)] [&>button]:!text-[var(--veyro-text-primary)]"
        />
        <MiniMap
          nodeColor={() => 'var(--veyro-accent)'}
          maskColor="rgba(8, 9, 12, 0.7)"
          className="!bg-[var(--veyro-bg-elevated)] !border-[var(--veyro-border)] !rounded-lg"
          style={{ width: 120, height: 80 }}
        />
      </ReactFlow>

      {/* Bottom Legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 bg-[var(--veyro-bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--veyro-border)] text-[11px] text-[var(--veyro-text-tertiary)] pointer-events-auto backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--veyro-lang-ts)]" />
          <span>TS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--veyro-lang-js)]" />
          <span>JS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--veyro-lang-py)]" />
          <span>Python</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Hotspot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[var(--veyro-warning)]" />
          <span>Cycle</span>
        </div>
      </div>
    </div>
  );
}

export function DependencyGraphPanel() {
  return (
    <ReactFlowProvider>
      <DependencyGraphInner />
    </ReactFlowProvider>
  );
}
