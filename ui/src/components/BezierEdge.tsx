import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";
import type { RawEdge } from "../lib/types";
import { useMindmapStore } from "../store";

export function BezierEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
  } = props;
  const edge = data as RawEdge | undefined;
  const isDirect = edge?.kind === "direct";
  const edgeStyle = useMindmapStore((s) => s.edgeStyle);

  let path: string;
  if (edgeStyle === "straight") {
    [path] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (edgeStyle === "smoothstep") {
    [path] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
      borderRadius: 16,
    });
  } else {
    // bezier — uses sourcePosition/targetPosition so it exits left or right
    [path] = getBezierPath({
      sourceX, sourceY, sourcePosition,
      targetX, targetY, targetPosition,
    });
  }

  return (
    <BaseEdge
      id={props.id}
      path={path}
      style={{
        stroke: isDirect ? "rgba(251,191,36,0.7)" : "rgba(148,163,184,0.5)",
        strokeWidth: isDirect ? 2 : 1.5,
        strokeDasharray: isDirect ? undefined : "6 4",
      }}
    />
  );
}
