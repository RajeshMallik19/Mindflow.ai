import type { Edge, Node } from "@xyflow/react";
import type { UserFlow } from "./pipeline";

const COL_WIDTH = 220;
const ROW_HEIGHT = 130;

// User flows are graphs, not strict trees (a decision's branches can
// reconverge), so this assigns each node the depth of its first-reached
// predecessor via BFS from the start node, then a sequential slot among
// same-depth nodes. Good enough for typical flows — the user can drag nodes
// afterward in the editor regardless.
export function layoutUserFlow(flow: UserFlow): { nodes: Node[]; edges: Edge[] } {
  const outgoing = new Map<string, string[]>();
  for (const edge of flow.edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge.target);
    outgoing.set(edge.source, list);
  }

  const start = flow.nodes.find((n) => n.type === "start") ?? flow.nodes[0];
  const depth = new Map<string, number>();

  if (start) {
    depth.set(start.id, 0);
    const queue = [start.id];
    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of outgoing.get(current) ?? []) {
        if (!depth.has(next)) {
          depth.set(next, (depth.get(current) ?? 0) + 1);
          queue.push(next);
        }
      }
    }
  }

  // Any node unreachable from "start" (disconnected / malformed model
  // output) still gets placed instead of being dropped.
  let fallbackDepth = depth.size > 0 ? Math.max(...depth.values()) + 1 : 0;
  for (const node of flow.nodes) {
    if (!depth.has(node.id)) {
      depth.set(node.id, fallbackDepth);
      fallbackDepth += 1;
    }
  }

  const slotByDepth = new Map<number, number>();
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of flow.nodes) {
    const d = depth.get(node.id) ?? 0;
    const slot = slotByDepth.get(d) ?? 0;
    slotByDepth.set(d, slot + 1);
    positions.set(node.id, { x: slot * COL_WIDTH, y: d * ROW_HEIGHT });
  }

  const nodes: Node[] = flow.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: { label: n.label },
  }));

  const edges: Edge[] = flow.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label ?? undefined,
  }));

  return { nodes, edges };
}
