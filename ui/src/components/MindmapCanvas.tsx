import { useCallback, useEffect, useMemo } from "react";
import {
  applyNodeChanges,
  Background,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMindmapStore } from "../store";
import { IssueNode } from "./IssueNode";
import { BezierEdge } from "./BezierEdge";
import { applyElkLayout } from "../hooks/useElkLayout";
import { applyForceLayout } from "../hooks/useForceLayout";
import type { Graph, IssueNodeData, RawEdge } from "../lib/types";

const nodeTypes = { issue: IssueNode };
const edgeTypes = { bezier: BezierEdge };

interface Props {
  graph: Graph;
}

function buildInitial(graph: Graph): {
  nodes: Node<IssueNodeData>[];
  edges: Edge<RawEdge>[];
} {
  const nodes: Node<IssueNodeData>[] = graph.nodes.map((n) => ({
    id: String(n.id),
    type: "issue",
    position: { x: 0, y: 0 },
    data: {
      ...n,
      isRoot: n.id === graph.root,
    },
  }));
  const edges: Edge<RawEdge>[] = graph.edges.map((e) => ({
    id: `${e.source}->${e.target}`,
    source: String(e.source),
    target: String(e.target),
    type: "bezier",
    data: e,
  }));
  return { nodes, edges };
}

function CanvasInner({ graph }: Props) {
  const nodes = useMindmapStore((s) => s.nodes);
  const edges = useMindmapStore((s) => s.edges);
  const layout = useMindmapStore((s) => s.layout);
  const hidden = useMindmapStore((s) => s.hidden);
  const setNodes = useMindmapStore((s) => s.setNodes);
  const setEdges = useMindmapStore((s) => s.setEdges);
  const setLayout = useMindmapStore((s) => s.setLayout);

  // initial load
  useEffect(() => {
    const { nodes: initNodes, edges: initEdges } = buildInitial(graph);
    setNodes(initNodes);
    setEdges(initEdges);
  }, [graph, setNodes, setEdges]);

  // re-layout whenever the layout mode or hidden set changes
  useEffect(() => {
    if (nodes.length === 0) return;
    const visibleNodes = nodes.filter((n) => !hidden.has(Number(n.id)));
    const visibleEdges = edges.filter(
      (e) => !hidden.has(Number(e.source)) && !hidden.has(Number(e.target))
    );
    const apply = layout === "elk" ? applyElkLayout : applyForceLayout;
    apply(visibleNodes, visibleEdges).then((laid) => {
      // merge laid positions back into the full node list
      const positionById = new Map(laid.map((n) => [n.id, n.position]));
      setNodes(
        nodes.map((n) =>
          positionById.has(n.id)
            ? { ...n, position: positionById.get(n.id)!, hidden: false }
            : { ...n, hidden: true }
        )
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, hidden, graph]);

  const onNodesChange = useCallback(
    (changes: any) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const visibleEdges = useMemo(
    () => edges.filter((e) => !hidden.has(Number(e.source)) && !hidden.has(Number(e.target))),
    [edges, hidden]
  );

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-3 left-3 z-10 flex gap-2 bg-[#1a1d24] border border-white/10 rounded-lg p-1">
        <button
          onClick={() => setLayout("elk")}
          className={`px-3 py-1 text-xs rounded ${
            layout === "elk"
              ? "bg-amber-400/20 text-amber-300"
              : "text-white/60 hover:text-white"
          }`}
        >
          Hierarchy
        </button>
        <button
          onClick={() => setLayout("force")}
          className={`px-3 py-1 text-xs rounded ${
            layout === "force"
              ? "bg-amber-400/20 text-amber-300"
              : "text-white/60 hover:text-white"
          }`}
        >
          Organic
        </button>
      </div>
      <div className="absolute top-3 right-3 z-10 text-xs text-white/40 bg-[#1a1d24] border border-white/10 rounded-lg px-3 py-1.5">
        {graph.repo} · root #{graph.root} · right-click node to hide
      </div>
      <ReactFlow
        nodes={nodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        connectionMode={ConnectionMode.Loose}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2f3a" gap={24} />
        <Controls
          className="!bg-[#1a1d24] !border-white/20 [&_button]:!bg-[#1a1d24] [&_button]:!border-white/20 [&_button]:!text-white/80 [&_button:hover]:!bg-white/10 [&_button]:!fill-white/80"
        />
      </ReactFlow>
    </div>
  );
}

export function MindmapCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
