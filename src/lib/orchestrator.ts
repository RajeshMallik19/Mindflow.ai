import { SUBAGENTS } from "./subagents";
import type { Subagent } from "./types";

const KEYWORD_HINTS: Record<Subagent["id"], string[]> = {
  research: ["research", "investigate", "find out", "sources", "explain"],
  "ia-maker": ["sitemap", "information architecture", "ia", "structure", "hierarchy"],
  "persona-maker": ["persona", "user type", "audience", "who uses"],
  "user-stories-maker": ["user story", "user stories", "acceptance criteria", "requirements"],
  "design-agent": ["wireframe", "layout", "design", "screen", "ui", "mockup"],
};

// Keyword routing, not an LLM call: keeps routing free and instant, and
// reserves the model call for the subagent that actually does the work.
// Swap for an LLM-based router later if keyword matching proves too coarse.
export function routeTask(task: string): Subagent {
  const lower = task.toLowerCase();

  let best: { subagent: Subagent; score: number } | null = null;
  for (const subagent of SUBAGENTS) {
    const hints = KEYWORD_HINTS[subagent.id];
    const score = hints.reduce(
      (acc, hint) => acc + (lower.includes(hint) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { subagent, score };
    }
  }

  return best?.subagent ?? SUBAGENTS[0]; // default to Research Agent
}
