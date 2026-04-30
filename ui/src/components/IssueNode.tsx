import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { IssueNodeData } from "../lib/types";
import { useMindmapStore } from "../store";

// Invisible handles required so React Flow's edge renderer activates.
// FloatingEdge ignores these and computes its own border intersection points.
const hs = { opacity: 0, pointerEvents: "none" as const, width: 1, height: 1 };

const stateColor: Record<string, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  closed: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  merged: "bg-violet-500/20 text-violet-300 border-violet-500/40",
};

const kindLabel: Record<string, string> = {
  issue: "Issue",
  pr: "PR",
};

function IssueNodeImpl({ data }: NodeProps) {
  const d = data as IssueNodeData;
  const hideNode = useMindmapStore((s) => s.hideNode);

  return (
    <>
      <Handle type="source" position={Position.Left} style={hs} />
      <Handle type="target" position={Position.Left} style={hs} />
    <div
      className={`rounded-xl border bg-[#1a1d24] shadow-lg w-[280px] ${
        d.isRoot
          ? "border-amber-400/60 ring-2 ring-amber-400/30"
          : "border-white/10"
      }`}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!d.isRoot) hideNode(d.id);
      }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <a
            href={d.url}
            target="_blank"
            rel="noopener noreferrer"
            className="nopan text-xs uppercase tracking-wider text-white/50 hover:text-amber-300"
            onClick={(e) => e.stopPropagation()}
          >
            {kindLabel[d.kind]} #{d.id}
          </a>
          <span
            className={`text-[10px] px-2 py-0.5 rounded border ${
              stateColor[d.state] || "bg-white/10 text-white/70 border-white/20"
            }`}
          >
            {d.state}
          </span>
        </div>
        <a
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="nopan block text-sm font-medium text-white/90 hover:text-amber-300 hover:underline leading-snug"
          onClick={(e) => e.stopPropagation()}
        >
          {d.title}
        </a>
        {(d.labels.length > 0 || d.milestone) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {d.milestone && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
                {d.milestone}
              </span>
            )}
            {d.labels.map((label) => (
              <span
                key={label}
                className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/60 border border-white/10"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export const IssueNode = memo(IssueNodeImpl);
