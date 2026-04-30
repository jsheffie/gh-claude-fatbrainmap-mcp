/**
 * Floating edge: connects at the nearest point on each node's border.
 * Shows a label (direct/semantic) and a tooltip with the reason on hover.
 */
import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, useStore, getSmoothStepPath, type EdgeProps } from "@xyflow/react";
import type { RawEdge } from "../lib/types";
import { useMindmapStore } from "../store";

const NODE_WIDTH = 380;
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
  const [hovered, setHovered] = useState(false);

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
    const curvature = Math.max(Math.abs(ex - sx) * 0.4, 60);
    const srcOff = srcSide === "right" ? curvature : -curvature;
    const tgtOff = tgtSide === "right" ? curvature : -curvature;
    path = `M ${sx} ${sy} C ${sx + srcOff} ${sy}, ${ex + tgtOff} ${ey}, ${ex} ${ey}`;
  }

  // Midpoint for label + tooltip anchor
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  const strokeColor = isDirect ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.5)";

  return (
    <>
      {/* Wider invisible hit area for hover */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: "default" }}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: hovered ? (isDirect ? "rgba(251,191,36,1)" : "rgba(148,163,184,0.9)") : strokeColor,
          strokeWidth: isDirect ? 2 : 1.5,
          strokeDasharray: isDirect ? undefined : "6 4",
          transition: "stroke 0.15s",
        }}
      />
      <EdgeLabelRenderer>
        {/* Inline label — always visible, small */}
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
            pointerEvents: "none",
          }}
          className="nodrag nopan"
        >
          <span
            className={`text-[9px] px-1 py-0.5 rounded border leading-none ${
              isDirect
                ? "bg-amber-900/60 text-amber-300 border-amber-500/30"
                : "bg-slate-800/80 text-slate-400 border-slate-600/30"
            }`}
          >
            {isDirect ? "direct" : "semantic"}
          </span>
        </div>

        {/* Tooltip — only on hover */}
        {hovered && edge?.reason && (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -100%) translate(${mx}px, ${my - 12}px)`,
              pointerEvents: "none",
            }}
            className="nodrag nopan"
          >
            <div className="bg-[#0f1115] border border-white/20 rounded-lg px-3 py-2 text-xs text-white/80 shadow-xl max-w-[260px] text-center leading-snug">
              {String(edge.reason)}
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
