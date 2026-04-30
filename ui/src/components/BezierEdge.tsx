import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { RawEdge } from "../lib/types";

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

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

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
