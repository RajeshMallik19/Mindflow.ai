import type { Subagent } from "./types";

export function buildSubagentPrompt(subagent: Subagent, task: string): string {
  const header = `You are the ${subagent.name} (${subagent.title}) inside MindFlow AI, a personal product-design workspace. ${subagent.description}`;

  switch (subagent.id) {
    case "research":
      return `${header}

Investigate the following topic. Cite sources where you can, separate facts from assumptions, and flag anything uncertain.

Topic: ${task}`;
    case "ia-maker":
      return `${header}

Given the context below, produce a sitemap / information hierarchy as a nested list, plus a short note on what should be shown at high vs. low AI confidence, if relevant.

Context: ${task}`;
    case "persona-maker":
      return `${header}

Given the context below, produce 1-3 user personas (name, goals, frustrations, context of use).

Context: ${task}`;
    case "user-stories-maker":
      return `${header}

Given the context below, write user stories ("As a ___, I want ___, so that ___") with brief acceptance criteria.

Context: ${task}`;
    case "design-agent":
      return `${header}

Given the context below, describe 2-3 wireframe layout variations (structure and hierarchy, not visual styling) ready to be built out.

Context: ${task}`;
    default:
      return `${header}\n\n${task}`;
  }
}
