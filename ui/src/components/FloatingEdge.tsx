/**
 * Floating edge: connects at the nearest point on each node's border.
 */
import { BaseEdge, useStore, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
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

export function FloatingEdge(props: EdgeProps) {
  const { id, source, target, data, sourceX, sourceY, targetX, targetY } = props;

  const sourceNode = useStore((s) => s.nodeLookup.get(source));
  const targetNode = useStore((s) => s.nodeLookup.get(target));
  const edge = data as RawEdge | undefined;
  const isDirect = edge?.kind === "direct";
  const edgeStyle = useMindmapStore((s) => s.edgeStyle);

  const hasMeasured =
    sourceNode?.internals?.positionAbsolute != null &&
    targetNode?.internals?.positionAbsolute != null;

  let sx: number, sy: number, ex: number, ey: number;
  let srcSide: "left" | "right", tgtSide: "left" | "right";

  if (hasMeasured) {
    const sw = sourceNode!.measured?.width ?? NODE_WIDTH;
    const sh = sourceNode!.measured?.height ?? NODE_HEIGHT;
    const tw = targetNode!.measured?.width ?? NODE_WIDTH;
    const th = targetNode!.measured?.height ?? NODE_HEIGHT;

    const scx = sourceNode!.internals.positionAbsolute.x + sw / 2;
    const scy = sourceNode!.internals.positionAbsolute.y + sh / 2;
    const tcx = targetNode!.internals.positionAbsolute.x + tw / 2;
    const tcy = targetNode!.internals.positionAbsolute.y + th / 2;

    ({ x: sx, y: sy } = rectIntersection(scx, scy, tcx, tcy, sw, sh));
    ({ x: ex, y: ey } = rectIntersection(tcx, tcy, scx, scy, tw, th));
    srcSide = sx >= scx ? "right" : "left";
    tgtSide = ex >= tcx ? "right" : "left";
  } else {
    sx = sourceX; sy = sourceY; ex = targetX; ey = targetY;
    srcSide = sourceX <= targetX ? "right" : "left";
    tgtSide = targetX <= sourceX ? "right" : "left";
  }

  let path: string;
  if (edgeStyle === "smoothstep") {
    [path] = getSmoothStepPath({
      sourceX: sx, sourceY: sy, sourcePosition: srcSide as any,
      targetX: ex, targetY: ey, targetPosition: tgtSide as any,
      borderRadius: 16,
    });
  } else if (edgeStyle === "straight") {
    path = `M ${sx} ${sy} L ${ex} ${ey}`;
  } else {
    // bezier
    const curvature = Math.max(Math.abs(ex - sx) * 0.4, 60);
    const srcOff = srcSide === "right" ? curvature : -curvature;
    const tgtOff = tgtSide === "right" ? curvature : -curvature;
    path = `M ${sx} ${sy} C ${sx + srcOff} ${sy}, ${ex + tgtOff} ${ey}, ${ex} ${ey}`;
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: isDirect ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.5)",
        strokeWidth: isDirect ? 2 : 1.5,
        strokeDasharray: isDirect ? undefined : "6 4",
      }}
    />
  );
}
