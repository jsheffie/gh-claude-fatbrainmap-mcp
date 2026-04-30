import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";
import type { EdgeStyle, IssueNodeData, LayoutMode, RawEdge } from "./lib/types";

interface MindmapState {
  nodes: Node<IssueNodeData>[];
  edges: Edge<RawEdge>[];
  layout: LayoutMode;
  edgeStyle: EdgeStyle;
  hidden: Set<number>;
  setNodes: (nodes: Node<IssueNodeData>[]) => void;
  setEdges: (edges: Edge<RawEdge>[]) => void;
  setLayout: (layout: LayoutMode) => void;
  setEdgeStyle: (style: EdgeStyle) => void;
  hideNode: (id: number) => void;
}

export const useMindmapStore = create<MindmapState>((set) => ({
  nodes: [],
  edges: [],
  layout: "dagre-tb",
  edgeStyle: "bezier",
  hidden: new Set(),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLayout: (layout) => set({ layout }),
  setEdgeStyle: (edgeStyle) => set({ edgeStyle }),
  hideNode: (id) =>
    set((state) => {
      const next = new Set(state.hidden);
      next.add(id);
      return { hidden: next };
    }),
}));
