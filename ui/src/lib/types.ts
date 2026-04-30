export type NodeKind = "issue" | "pr";
export type NodeState = "open" | "closed" | "merged";
export type EdgeKind = "direct" | "semantic";

// React Flow v12 requires node/edge data to be Record<string, unknown>-compatible.
export type IssueNodeData = {
  id: number;
  kind: NodeKind;
  state: NodeState;
  title: string;
  url: string;
  labels: string[];
  milestone: string | null;
  isRoot: boolean;
  [key: string]: unknown;
};

export type RawNode = {
  id: number;
  kind: NodeKind;
  state: NodeState;
  title: string;
  url: string;
  labels: string[];
  milestone: string | null;
};

export type RawEdge = {
  source: number;
  target: number;
  kind: EdgeKind;
  reason: string;
  [key: string]: unknown;
};

export interface Graph {
  version: 1;
  repo: string;
  root: number;
  nodes: RawNode[];
  edges: RawEdge[];
}

export type LayoutMode = "force" | "dagre-lr" | "dagre-tb";
export type EdgeStyle = "straight" | "bezier" | "smoothstep";
