import { describe, expect, it } from "vitest";
import { layoutIaSitemap } from "./ia-layout";

describe("layoutIaSitemap", () => {
  it("places root nodes at depth 0 and children at increasing depth", () => {
    const { nodes } = layoutIaSitemap({
      nodes: [
        { id: "home", label: "Home", parentId: null },
        { id: "search", label: "Search", parentId: "home" },
        { id: "results", label: "Results", parentId: "search" },
      ],
    });

    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    expect(byId.home.position.y).toBeLessThan(byId.search.position.y);
    expect(byId.search.position.y).toBeLessThan(byId.results.position.y);
  });

  it("creates one edge per parent-child relationship", () => {
    const { edges } = layoutIaSitemap({
      nodes: [
        { id: "home", label: "Home", parentId: null },
        { id: "a", label: "A", parentId: "home" },
        { id: "b", label: "B", parentId: "home" },
      ],
    });

    expect(edges).toHaveLength(2);
    expect(edges.map((e) => e.target).sort()).toEqual(["a", "b"]);
  });

  it("treats a node with a dangling parentId (parent not in the list) as a root instead of crashing", () => {
    const { nodes, edges } = layoutIaSitemap({
      nodes: [{ id: "orphan", label: "Orphan", parentId: "does-not-exist" }],
    });

    expect(nodes).toHaveLength(1);
    expect(edges).toHaveLength(0);
  });

  it("handles an empty sitemap", () => {
    const { nodes, edges } = layoutIaSitemap({ nodes: [] });
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });
});
