import type { Edge, Node } from "@xyflow/react";

export type FlowData = { nodes: Node[]; edges: Edge[] };

export function parseFlowArtifact(content: string): FlowData | undefined {
  try {
    const parsed: unknown = JSON.parse(content);

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "nodes" in parsed &&
      "edges" in parsed &&
      Array.isArray(parsed.nodes) &&
      Array.isArray(parsed.edges)
    ) {
      return { nodes: parsed.nodes as Node[], edges: parsed.edges as Edge[] };
    }
  } catch {
    // fall through
  }
  return undefined;
}
