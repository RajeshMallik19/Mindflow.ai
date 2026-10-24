import { describe, expect, it } from "vitest";
import {
  getTopologicalOrder,
  isLegacyWireframes,
  normalizeStoredResearchBrief,
  STAGES,
  type StageId,
} from "./pipeline";

describe("getTopologicalOrder", () => {
  it("places every stage after all of its prerequisites", () => {
    const order = getTopologicalOrder();
    const indexOf = new Map(order.map((id, i) => [id, i]));

    for (const stage of STAGES) {
      for (const dep of stage.prerequisites) {
        expect(indexOf.get(dep)!).toBeLessThan(indexOf.get(stage.id)!);
      }
    }
  });

  it("includes every stage exactly once", () => {
    const order = getTopologicalOrder();
    expect(new Set(order).size).toBe(STAGES.length);
    expect(order).toHaveLength(STAGES.length);
  });

  it("puts research_brief first (nothing else has zero prerequisites)", () => {
    const order = getTopologicalOrder();
    expect(order[0]).toBe("research_brief" satisfies StageId);
  });
});

describe("normalizeStoredResearchBrief", () => {
  it("wraps a legacy flat ResearchBrief (pre-{simple,gossip} shape) in .simple", () => {
    const legacy = { summary: "x", keyFindings: ["a"], openQuestions: [] };
    expect(normalizeStoredResearchBrief(legacy)).toEqual({ simple: legacy });
  });

  it("leaves an already-wrapped {simple, gossip?} shape unchanged", () => {
    const current = { simple: { summary: "x", keyFindings: [], openQuestions: [] } };
    expect(normalizeStoredResearchBrief(current)).toBe(current);
  });

  it("leaves a shape that also has a gossip field unchanged", () => {
    const withGossip = {
      simple: { summary: "x", keyFindings: [], openQuestions: [] },
      gossip: { summary: "y", keyFindings: [], openQuestions: [] },
    };
    expect(normalizeStoredResearchBrief(withGossip)).toBe(withGossip);
  });
});

describe("isLegacyWireframes", () => {
  it("flags the pre-visual {name, purpose, sections: string[]} shape as legacy", () => {
    const legacy = {
      screens: [{ name: "Home", purpose: "landing", sections: ["header", "footer"] }],
    };
    expect(isLegacyWireframes(legacy)).toBe(true);
  });

  it("does not flag the current {sections: [{elements}]} shape as legacy", () => {
    const current = {
      screens: [
        {
          name: "Home",
          device: "mobile",
          sections: [{ id: "s1", direction: "column", elements: [{ id: "e1", type: "header", label: "Hi" }] }],
        },
      ],
    };
    expect(isLegacyWireframes(current)).toBe(false);
  });

  it("flags missing/malformed data as legacy rather than crashing on it", () => {
    expect(isLegacyWireframes(undefined)).toBe(true);
    expect(isLegacyWireframes({})).toBe(true);
    expect(isLegacyWireframes({ screens: [] })).toBe(false);
  });
});
