import Dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { IssueNodeData, RawEdge } from "../lib/types";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

export function applyDagreLayout(
  nodes: Node<IssueNodeData>[],
  edges: Edge<RawEdge>[],
  direction: "LR" | "TB"
): Node<IssueNodeData>[] {
  if (nodes.length === 0) return nodes;

  const g = new Dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: direction,
    nodesep: direction === "LR" ? 60 : 40,
    ranksep: direction === "LR" ? 120 : 80,
    marginx: 40,
    marginy: 40,
  });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(String(edge.source), String(edge.target));
  }

  Dagre.layout(g);

  // LR layout: edges exit left/right — set handle positions accordingly
  const sourcePos = direction === "LR" ? Position.Right : Position.Bottom;
  const targetPos = direction === "LR" ? Position.Left : Position.Top;

  return nodes.map((node) => {
    const n = g.node(node.id);
    return {
      ...node,
      position: {
        x: n.x - NODE_WIDTH / 2,
        y: n.y - NODE_HEIGHT / 2,
      },
      sourcePosition: sourcePos,
      targetPosition: targetPos,
    };
  });
}
