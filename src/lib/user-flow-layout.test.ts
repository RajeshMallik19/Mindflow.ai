import { describe, expect, it } from "vitest";
import { layoutUserFlow } from "./user-flow-layout";

describe("layoutUserFlow", () => {
  it("places the start node at depth 0 and downstream nodes at increasing depth", () => {
    const { nodes } = layoutUserFlow({
      nodes: [
        { id: "start", type: "start", label: "Open app" },
        { id: "n1", type: "action", label: "Browse" },
        { id: "n2", type: "action", label: "Checkout" },
      ],
      edges: [
        { id: "e1", source: "start", target: "n1" },
        { id: "e2", source: "n1", target: "n2" },
      ],
    });

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId.start.position.y).toBeLessThan(byId.n1.position.y);
    expect(byId.n1.position.y).toBeLessThan(byId.n2.position.y);
  });

  it("maps each node's semantic type onto its React Flow node type", () => {
    const { nodes } = layoutUserFlow({
      nodes: [
        { id: "start", type: "start", label: "Open app" },
        { id: "d1", type: "decision", label: "Logged in?" },
      ],
      edges: [{ id: "e1", source: "start", target: "d1" }],
    });

    expect(nodes.find((n) => n.id === "d1")?.type).toBe("decision");
  });

  it("places a disconnected node instead of dropping it", () => {
    const { nodes } = layoutUserFlow({
      nodes: [
        { id: "start", type: "start", label: "Open app" },
        { id: "orphan", type: "action", label: "Unreachable" },
      ],
      edges: [],
    });

    expect(nodes).toHaveLength(2);
  });

  it("handles an empty flow", () => {
    const { nodes, edges } = layoutUserFlow({ nodes: [], edges: [] });
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});
