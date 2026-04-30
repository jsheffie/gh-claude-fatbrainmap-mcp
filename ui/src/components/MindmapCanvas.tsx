import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useMindmapStore } from "../store";
import { IssueNode } from "./IssueNode";
import { FloatingEdge } from "./FloatingEdge";
import { applyElkLayout } from "../hooks/useElkLayout";
import { applyForceLayout } from "../hooks/useForceLayout";
import { applyDagreLayout } from "../hooks/useDagreLayout";
import type { EdgeStyle, Graph, IssueNodeData, LayoutMode, RawEdge } from "../lib/types";

const nodeTypes = { issue: IssueNode };
const edgeTypes = { floating: FloatingEdge };

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
    data: { ...n, isRoot: n.id === graph.root },
  }));
  const edges: Edge<RawEdge>[] = graph.edges.map((e) => ({
    id: `${e.source}->${e.target}`,
    source: String(e.source),
    target: String(e.target),
    type: "floating",
    data: e,
  }));
  return { nodes, edges };
}

async function runLayout(
  nodes: Node<IssueNodeData>[],
  edges: Edge<RawEdge>[],
  layout: LayoutMode
): Promise<Node<IssueNodeData>[]> {
  if (layout === "force") return applyForceLayout(nodes, edges);
  if (layout === "dagre-lr") return applyDagreLayout(nodes, edges, "LR");
  if (layout === "dagre-tb") return applyDagreLayout(nodes, edges, "TB");
  return applyElkLayout(nodes, edges);
}

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  force: "Auto",
  "dagre-lr": "Left → Right",
  "dagre-tb": "Top → Bottom",
};

const EDGE_LABELS: Record<EdgeStyle, string> = {
  straight: "Straight",
  bezier: "Curved",
  smoothstep: "Step",
};

function CanvasInner({ graph }: Props) {
  const nodes = useMindmapStore((s) => s.nodes);
  const edges = useMindmapStore((s) => s.edges);
  const layout = useMindmapStore((s) => s.layout);
  const edgeStyle = useMindmapStore((s) => s.edgeStyle);
  const hidden = useMindmapStore((s) => s.hidden);
  const setNodes = useMindmapStore((s) => s.setNodes);
  const setEdges = useMindmapStore((s) => s.setEdges);
  const setLayout = useMindmapStore((s) => s.setLayout);
  const setEdgeStyle = useMindmapStore((s) => s.setEdgeStyle);
  const { fitView } = useReactFlow();
  const layoutPending = useRef(false);

  // initial load
  useEffect(() => {
    const { nodes: initNodes, edges: initEdges } = buildInitial(graph);
    setNodes(initNodes);
    setEdges(initEdges);
  }, [graph, setNodes, setEdges]);

  // re-layout on layout mode / hidden / graph change, then fit view
  useEffect(() => {
    if (nodes.length === 0) return;
    const visibleNodes = nodes.filter((n) => !hidden.has(Number(n.id)));
    const visibleEdges = edges.filter(
      (e) => !hidden.has(Number(e.source)) && !hidden.has(Number(e.target))
    );
    runLayout(visibleNodes, visibleEdges, layout).then((laid) => {
      const infoById = new Map(
        laid.map((n) => [n.id, { position: n.position, sourcePosition: n.sourcePosition, targetPosition: n.targetPosition }])
      );
      setNodes(
        nodes.map((n) => {
          if (!infoById.has(n.id)) return { ...n, hidden: true };
          const { position, sourcePosition, targetPosition } = infoById.get(n.id)!;
          return { ...n, position, sourcePosition, targetPosition, hidden: false };
        })
      );
      layoutPending.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, hidden, graph]);

  // fit view after nodes are updated from layout
  useEffect(() => {
    if (layoutPending.current && nodes.some((n) => !n.hidden)) {
      layoutPending.current = false;
      setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
    }
  }, [nodes, fitView]);

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
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <div className="flex gap-1 bg-[#1a1d24] border border-white/10 rounded-lg p-1">
          {(Object.keys(LAYOUT_LABELS) as LayoutMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setLayout(mode)}
              className={`px-3 py-1 text-xs rounded whitespace-nowrap ${
                layout === mode ? "bg-amber-400/20 text-amber-300" : "text-white/60 hover:text-white"
              }`}
            >
              {LAYOUT_LABELS[mode]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-[#1a1d24] border border-white/10 rounded-lg p-1">
          {(Object.keys(EDGE_LABELS) as EdgeStyle[]).map((style) => (
            <button
              key={style}
              onClick={() => setEdgeStyle(style)}
              className={`px-3 py-1 text-xs rounded ${
                edgeStyle === style ? "bg-sky-400/20 text-sky-300" : "text-white/60 hover:text-white"
              }`}
            >
              {EDGE_LABELS[style]}
            </button>
          ))}
        </div>
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
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2f3a" gap={24} />
        <Controls
          position="bottom-right"
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
