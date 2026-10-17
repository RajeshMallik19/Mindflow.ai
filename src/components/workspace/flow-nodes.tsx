"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

const BASE =
  "rounded-md border px-3 py-2 text-sm shadow-sm min-w-[140px] text-center bg-white dark:bg-zinc-900";

export function StartNode({ data }: NodeProps) {
  return (
    <div className={`${BASE} border-emerald-400`}>
      {String(data.label ?? "Start")}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function ActionNode({ data }: NodeProps) {
  return (
    <div className={`${BASE} border-zinc-300 dark:border-zinc-700`}>
      {String(data.label ?? "Action")}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export function DecisionNode({ data }: NodeProps) {
  return (
    <div className={`${BASE} border-amber-400`}>
      {String(data.label ?? "Decision?")}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </div>
  );
}

export const FLOW_NODE_TYPES = {
  start: StartNode,
  action: ActionNode,
  decision: DecisionNode,
};
