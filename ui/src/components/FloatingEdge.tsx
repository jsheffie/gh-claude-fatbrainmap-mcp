/**
 * Floating edge: connects at the nearest point on each node's border.
 * Uses center-to-center line intersection with the node's bounding rectangle.
 * Works for all three edge styles (straight, bezier, smoothstep) and updates
 * live as nodes are dragged.
 */
import { useInternalNode, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { RawEdge } from "../lib/types";
import { useMindmapStore } from "../store";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

/** Intersect a ray from (cx,cy) toward (tx,ty) with a rectangle centered at (cx,cy). */
function rectIntersection(
  cx: number, cy: number,   // center of the source rect
  tx: number, ty: number,   // target point (center of other node)
  w: number, h: number      // full width / height of source rect
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hw = w / 2;
  const hh = h / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  let x: number, y: number;
  if (absDx * hh >= absDy * hw) {
    // Intersects left or right edge
    x = cx + (dx > 0 ? hw : -hw);
    y = cy + dy * (hw / absDx);
  } else {
    // Intersects top or bottom edge
    y = cy + (dy > 0 ? hh : -hh);
    x = cx + dx * (hh / absDy);
  }
  return { x, y };
}

export function FloatingEdge({ id, source, target, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const edge = data as RawEdge | undefined;
  const isDirect = edge?.kind === "direct";
  const edgeStyle = useMindmapStore((s) => s.edgeStyle);

  if (!sourceNode || !targetNode) return null;

  const sw = (sourceNode.measured?.width ?? NODE_WIDTH);
  const sh = (sourceNode.measured?.height ?? NODE_HEIGHT);
  const tw = (targetNode.measured?.width ?? NODE_WIDTH);
  const th = (targetNode.measured?.height ?? NODE_HEIGHT);

  const scx = sourceNode.internals.positionAbsolute.x + sw / 2;
  const scy = sourceNode.internals.positionAbsolute.y + sh / 2;
  const tcx = targetNode.internals.positionAbsolute.x + tw / 2;
  const tcy = targetNode.internals.positionAbsolute.y + th / 2;

  const { x: sx, y: sy } = rectIntersection(scx, scy, tcx, tcy, sw, sh);
  const { x: ex, y: ey } = rectIntersection(tcx, tcy, scx, scy, tw, th);

  let path: string;
  if (edgeStyle === "straight") {
    path = `M ${sx} ${sy} L ${ex} ${ey}`;
  } else if (edgeStyle === "smoothstep") {
    // Determine side for smoothstep handle positions
    const srcPos = sx > scx ? "right" : "left" as any;
    const tgtPos = ex > tcx ? "right" : "left" as any;
    [path] = getSmoothStepPath({
      sourceX: sx, sourceY: sy, sourcePosition: srcPos,
      targetX: ex, targetY: ey, targetPosition: tgtPos,
      borderRadius: 16,
    });
  } else {
    // bezier — control points extend horizontally from the connection point
    const curvature = Math.min(Math.abs(tcx - scx) * 0.4, 120);
    const srcDir = sx < scx ? -1 : 1;  // left border → pull left, right border → pull right
    const tgtDir = ex < tcx ? -1 : 1;
    path = `M ${sx} ${sy} C ${sx + srcDir * curvature} ${sy}, ${ex + tgtDir * curvature} ${ey}, ${ex} ${ey}`;
  }

  return (
    <path
      id={id}
      className="react-flow__edge-path"
      d={path}
      style={{
        stroke: isDirect ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.5)",
        strokeWidth: isDirect ? 2 : 1.5,
        strokeDasharray: isDirect ? undefined : "6 4",
        fill: "none",
      }}
    />
  );
}
