import React, { useState, useEffect, useMemo } from 'react';
import {
  GitGraph,
  Layers,
  Search,
  RotateCw,
  Info,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { graphService, GraphNode, GraphEdge, GraphData } from '../../services/graphService';

export const WorkspaceGraphTab: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pathFromNode, setPathFromNode] = useState<string>('');
  const [pathToNode, setPathToNode] = useState<string>('');
  const [calculatedPath, setCalculatedPath] = useState<string[] | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const data = await graphService.getSkillGraph();
      setGraphData(data);
      if (data.nodes.length > 0 && !selectedNode) {
        setSelectedNode(data.nodes[0]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    graphData.nodes.forEach((n) => {
      if (n.data?.category) set.add(n.data.category);
    });
    return Array.from(set);
  }, [graphData.nodes]);

  const filteredNodes = useMemo(() => {
    return graphData.nodes.filter((n) => {
      const matchCat = filterCategory === 'all' || n.data?.category === filterCategory;
      const matchQuery =
        !searchQuery.trim() ||
        n.data?.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [graphData.nodes, filterCategory, searchQuery]);

  // Circular layout coordinates for clean SVG rendering
  const nodePositions = useMemo(() => {
    const count = filteredNodes.length;
    const positions: Record<string, { x: number; y: number }> = {};
    const radius = Math.min(220, Math.max(140, count * 24));
    const centerX = 280;
    const centerY = 240;

    filteredNodes.forEach((node, idx) => {
      const angle = (idx / count) * 2 * Math.PI;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return positions;
  }, [filteredNodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    graphData.nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [graphData.nodes]);

  const handleCalculatePath = async () => {
    if (!pathFromNode || !pathToNode) return;
    const path = await graphService.getLearningPath(pathFromNode, pathToNode);
    setCalculatedPath(path);
  };

  const getCategoryColor = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'language':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'framework':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'database':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'ai engine':
      case 'llm provider':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'governance':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Filter and Controls Bar */}
      <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domain nodes..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-400 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none"
          >
            <option value="all">All Categories ({graphData.nodes.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchGraph}
            title="Refresh Knowledge Graph"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Canvas + Detail Split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Graph Canvas */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(14,165,233,0.08),transparent)]">
          <svg
            width="560"
            height="480"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="transition-transform duration-200 select-none"
          >
            <defs>
              <marker
                id="graph-arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0ea5e9" opacity="0.6" />
              </marker>
            </defs>

            {/* Edges */}
            {graphData.edges.map((edge) => {
              const start = nodePositions[edge.source];
              const end = nodePositions[edge.target];
              if (!start || !end) return null;

              const isHighlighted =
                selectedNode && (selectedNode.id === edge.source || selectedNode.id === edge.target);

              return (
                <g key={edge.id}>
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={isHighlighted ? '#06b6d4' : '#334155'}
                    strokeWidth={isHighlighted ? 2.5 : 1.2}
                    strokeDasharray={isHighlighted ? 'none' : '4 3'}
                    markerEnd="url(#graph-arrow)"
                    className="transition-all"
                  />
                  {edge.label && (
                    <text
                      x={(start.x + end.x) / 2}
                      y={(start.y + end.y) / 2 - 4}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredNodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? 26 : 20}
                    fill={isSelected ? '#0891b2' : '#0f172a'}
                    stroke={isSelected ? '#38bdf8' : '#334155'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    className="transition-all duration-150 group-hover:stroke-cyan-400 group-hover:fill-slate-800"
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={isSelected ? '#ffffff' : '#e2e8f0'}
                    fontSize={isSelected ? '10' : '9'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    {node.data?.label.slice(0, 10)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Node Sidebar Inspector */}
        <div className="w-64 border-l border-slate-800 bg-slate-900/60 p-4 flex flex-col space-y-4 overflow-y-auto text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-cyan-400 font-semibold border-b border-slate-800 pb-2">
            <GitGraph className="w-4 h-4" />
            <span>Entity Inspector</span>
          </div>

          {selectedNode ? (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Node Identity</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedNode.data?.label}</h4>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {selectedNode.id}</p>
                {selectedNode.data?.category && (
                  <span
                    className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${getCategoryColor(
                      selectedNode.data.category
                    )}`}
                  >
                    {selectedNode.data.category}
                  </span>
                )}
              </div>

              {selectedNode.data?.description && (
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Semantic Description</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono">
                    {selectedNode.data.description}
                  </p>
                </div>
              )}

              {/* Related Connections */}
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Connected Edges</span>
                <div className="space-y-1.5 mt-1">
                  {graphData.edges
                    .filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
                    .map((e) => {
                      const isOut = e.source === selectedNode.id;
                      const otherId = isOut ? e.target : e.source;
                      const otherNode = nodeMap.get(otherId);
                      return (
                        <div
                          key={e.id}
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className="p-1.5 rounded-md bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer flex items-center justify-between text-[11px] transition-colors"
                        >
                          <span className="font-mono text-slate-300">{otherNode?.data?.label || otherId}</span>
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded">
                            {e.label || (isOut ? '→ OUT' : '← IN')}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Learning / Dependency Path Calculator */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Path Solver</span>
                <div className="flex items-center gap-1">
                  <select
                    value={pathFromNode || selectedNode.id}
                    onChange={(e) => setPathFromNode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1 text-[11px] text-slate-200 font-mono"
                  >
                    {graphData.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.data?.label}
                      </option>
                    ))}
                  </select>
                  <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                  <select
                    value={pathToNode}
                    onChange={(e) => setPathToNode(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-1 text-[11px] text-slate-200 font-mono"
                  >
                    <option value="">Select target</option>
                    {graphData.nodes
                      .filter((n) => n.id !== (pathFromNode || selectedNode.id))
                      .map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.data?.label}
                        </option>
                      ))}
                  </select>
                </div>
                <button
                  onClick={handleCalculatePath}
                  disabled={!pathToNode}
                  className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Resolve Dependency Path</span>
                </button>

                {calculatedPath && (
                  <div className="p-2 rounded bg-cyan-950/30 border border-cyan-800 text-[11px] font-mono text-cyan-300">
                    <span className="text-[10px] text-slate-400 block mb-1">Optimal Path:</span>
                    {calculatedPath.join(' → ')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic text-center py-8">Select a node to inspect relations</div>
          )}
        </div>
      </div>
    </div>
  );
};
