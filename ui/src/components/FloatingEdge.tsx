/**
 * Floating edge: connects at the nearest point on each node's border.
 * Uses center-to-center line intersection with the node's bounding rectangle.
 */
import { useStore, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { RawEdge } from "../lib/types";
import { useMindmapStore } from "../store";

const NODE_WIDTH = 280;
const NODE_HEIGHT = 120;

function rectIntersection(
  cx: number, cy: number,
  tx: number, ty: number,
  w: number, h: number
): { x: number; y: number } {
  const dx = tx - cx;
  const dy = ty - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const hw = w / 2;
  const hh = h / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx * hh >= absDy * hw) {
    return { x: cx + (dx > 0 ? hw : -hw), y: cy + dy * (hw / absDx) };
  }
  return { x: cx + dx * (hh / absDy), y: cy + (dy > 0 ? hh : -hh) };
}

export function FloatingEdge({ id, source, target, data }: EdgeProps) {
  // Subscribe directly to nodeLookup so we re-render when nodes become available
  const sourceNode = useStore((s) => s.nodeLookup.get(source));
  const targetNode = useStore((s) => s.nodeLookup.get(target));
  const edge = data as RawEdge | undefined;
  const isDirect = edge?.kind === "direct";
  const edgeStyle = useMindmapStore((s) => s.edgeStyle);

  if (!sourceNode?.internals?.positionAbsolute || !targetNode?.internals?.positionAbsolute) {
    return null;
  }

  const sw = sourceNode.measured?.width ?? NODE_WIDTH;
  const sh = sourceNode.measured?.height ?? NODE_HEIGHT;
  const tw = targetNode.measured?.width ?? NODE_WIDTH;
  const th = targetNode.measured?.height ?? NODE_HEIGHT;

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
    const srcPos = sx >= scx ? "right" : "left" as any;
    const tgtPos = ex >= tcx ? "right" : "left" as any;
    [path] = getSmoothStepPath({
      sourceX: sx, sourceY: sy, sourcePosition: srcPos,
      targetX: ex, targetY: ey, targetPosition: tgtPos,
      borderRadius: 16,
    });
  } else {
    // bezier: horizontal S-curve, control points pull outward from the connection side
    const curvature = Math.max(Math.abs(tcx - scx) * 0.4, 60);
    const srcDir = sx >= scx ? 1 : -1;
    const tgtDir = ex >= tcx ? 1 : -1;
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
