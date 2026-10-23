import type { Edge, Node } from "@xyflow/react";
import type { IaSitemap } from "./pipeline";

const COL_WIDTH = 200;
const ROW_HEIGHT = 120;

// Simple leaf-counting tree layout: each leaf gets a sequential x slot in
// traversal order; each internal node's x is the midpoint of its children.
// Good enough for sitemap-sized trees — no dagre/elk needed.
export function layoutIaSitemap(sitemap: IaSitemap): { nodes: Node[]; edges: Edge[] } {
  const byId = new Map(sitemap.nodes.map((n) => [n.id, n]));
  const childrenOf = new Map<string, typeof sitemap.nodes>();
  const roots: typeof sitemap.nodes = [];

  for (const node of sitemap.nodes) {
    const hasValidParent = node.parentId !== null && byId.has(node.parentId);
    if (hasValidParent) {
      const list = childrenOf.get(node.parentId as string) ?? [];
      list.push(node);
      childrenOf.set(node.parentId as string, list);
    } else {
      roots.push(node);
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  let nextLeafSlot = 0;

  function assign(node: (typeof sitemap.nodes)[number], depth: number): number {
    const children = childrenOf.get(node.id) ?? [];
    if (children.length === 0) {
      const x = nextLeafSlot * COL_WIDTH;
      nextLeafSlot += 1;
      positions.set(node.id, { x, y: depth * ROW_HEIGHT });
      return x;
    }

    const childXs = children.map((c) => assign(c, depth + 1));
    const x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    positions.set(node.id, { x, y: depth * ROW_HEIGHT });
    return x;
  }

  for (const root of roots) assign(root, 0);

  const nodes: Node[] = sitemap.nodes.map((n) => ({
    id: n.id,
    type: "action",
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: { label: n.label },
  }));

  const edges: Edge[] = sitemap.nodes
    .filter((n) => n.parentId !== null && byId.has(n.parentId))
    .map((n) => ({
      id: `e-${n.parentId}-${n.id}`,
      source: n.parentId as string,
      target: n.id,
    }));

  return { nodes, edges };
}
