import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";
import type { IssueNodeData, RawEdge } from "../lib/types";

const elk = new ELK();

const NODE_WIDTH = 380;
const NODE_HEIGHT = 120;

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.direction": "DOWN",
  "elk.layered.spacing.nodeNodeBetweenLayers": "80",
  "elk.spacing.nodeNode": "40",
  "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
};

export async function applyElkLayout(
  nodes: Node<IssueNodeData>[],
  edges: Edge<RawEdge>[]
): Promise<Node<IssueNodeData>[]> {
  if (nodes.length === 0) return nodes;

  const graph: ElkNode = {
    id: "root",
    layoutOptions: elkOptions,
    children: nodes.map((n) => ({
      id: n.id,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [String(e.source)],
      targets: [String(e.target)],
    })),
  };

  const laid = await elk.layout(graph);
  const positionById = new Map<string, { x: number; y: number }>();
  for (const child of laid.children ?? []) {
    positionById.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
  }

  return nodes.map((n) => {
    const pos = positionById.get(n.id);
    return pos ? { ...n, position: pos } : n;
  });
}
