import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import { Position, type Edge, type Node } from "@xyflow/react";
import type { IssueNodeData, RawEdge } from "../lib/types";

interface SimNode extends SimulationNodeDatum {
  id: string;
  isRoot: boolean;
}

const CANVAS_W = 1200;
const CANVAS_H = 800;

export function applyForceLayout(
  nodes: Node<IssueNodeData>[],
  edges: Edge<RawEdge>[]
): Promise<Node<IssueNodeData>[]> {
  return new Promise((resolve) => {
    if (nodes.length === 0) {
      resolve(nodes);
      return;
    }

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      isRoot: n.data.isRoot,
      x: n.position?.x ?? CANVAS_W / 2,
      y: n.position?.y ?? CANVAS_H / 2,
      fx: n.data.isRoot ? CANVAS_W / 2 : undefined,
      fy: n.data.isRoot ? CANVAS_H / 2 : undefined,
    }));

    const simLinks: SimulationLinkDatum<SimNode>[] = edges.map((e) => ({
      source: String(e.source),
      target: String(e.target),
    }));

    const sim = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-1200))
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((d) => d.id)
          .distance(260)
          .strength(0.6)
      )
      .force("center", forceCenter(CANVAS_W / 2, CANVAS_H / 2))
      .force("collide", forceCollide(160))
      .stop();

    for (let i = 0; i < 300; i++) sim.tick();

    const positionById = new Map<string, { x: number; y: number }>();
    for (const sn of simNodes) {
      positionById.set(sn.id, { x: sn.x ?? 0, y: sn.y ?? 0 });
    }

    resolve(
      nodes.map((n) => {
        const pos = positionById.get(n.id);
        // Force layout is organic — use left/right handles so bezier curves exit horizontally
        return pos ? {
          ...n,
          position: pos,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        } : n;
      })
    );
  });
}
