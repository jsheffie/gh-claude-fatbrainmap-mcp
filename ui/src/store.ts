import { create } from "zustand";
import type { Edge, Node } from "@xyflow/react";
import type { IssueNodeData, LayoutMode, RawEdge } from "./lib/types";

interface MindmapState {
  nodes: Node<IssueNodeData>[];
  edges: Edge<RawEdge>[];
  layout: LayoutMode;
  hidden: Set<number>;
  setNodes: (nodes: Node<IssueNodeData>[]) => void;
  setEdges: (edges: Edge<RawEdge>[]) => void;
  setLayout: (layout: LayoutMode) => void;
  hideNode: (id: number) => void;
}

export const useMindmapStore = create<MindmapState>((set) => ({
  nodes: [],
  edges: [],
  layout: "elk",
  hidden: new Set(),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setLayout: (layout) => set({ layout }),
  hideNode: (id) =>
    set((state) => {
      const next = new Set(state.hidden);
      next.add(id);
      return { hidden: next };
    }),
}));
