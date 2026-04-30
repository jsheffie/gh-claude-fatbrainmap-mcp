import Dagre from "@dagrejs/dagre";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { IssueNodeData, RawEdge } from "../lib/types";

const NODE_WIDTH = 380;
const NODE_HEIGHT = 120;

// "done" states go on the left in LR layout, "in-progress/open" on the right
function stateRank(state: string): number {
  if (state === "merged") return 0;
  if (state === "closed") return 1;
  if (state === "open") return 3;
  return 2; // unknown
}

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
    ranksep: direction === "LR" ? 160 : 80,
    marginx: 60,
    marginy: 60,
  });

  for (const node of nodes) {
    const entry: Record<string, unknown> = { width: NODE_WIDTH, height: NODE_HEIGHT };
    // In LR mode, pin rank by state so done items land left, open items right
    if (direction === "LR") {
      entry.rank = stateRank(node.data.state as string);
    }
    g.setNode(node.id, entry);
  }

  for (const edge of edges) {
    // In LR mode, orient edges from done→open so dagre flows left→right naturally
    if (direction === "LR") {
      const src = nodes.find((n) => String(n.id) === String(edge.source));
      const tgt = nodes.find((n) => String(n.id) === String(edge.target));
      const srcRank = stateRank(src?.data.state as string ?? "open");
      const tgtRank = stateRank(tgt?.data.state as string ?? "open");
      // Always point from lower rank (done) to higher rank (open) for proper LR flow
      if (srcRank <= tgtRank) {
        g.setEdge(String(edge.source), String(edge.target));
      } else {
        g.setEdge(String(edge.target), String(edge.source));
      }
    } else {
      g.setEdge(String(edge.source), String(edge.target));
    }
  }

  Dagre.layout(g);

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
