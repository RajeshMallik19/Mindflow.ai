import type { Subagent } from "./types";

export const SUBAGENTS: Subagent[] = [
  {
    id: "research",
    name: "Research Agent",
    title: "Researcher",
    description:
      "Investigates a topic, gathers cited sources, and synthesizes findings into a clear problem statement before any design work starts.",
  },
  {
    id: "ia-maker",
    name: "IA Maker",
    title: "Information Architect",
    description:
      "Turns a problem statement into a sitemap and information hierarchy. Also defines AI-behavior rules: what's shown at high vs. low confidence.",
  },
  {
    id: "persona-maker",
    name: "Persona Maker",
    title: "User Researcher",
    description:
      "Builds user personas grounded in the research findings for a project.",
  },
  {
    id: "user-stories-maker",
    name: "User Stories Maker",
    title: "Product Analyst",
    description:
      "Writes user stories and acceptance criteria from the problem statement, personas, and IA.",
  },
  {
    id: "design-agent",
    name: "Design Agent",
    title: "Product Designer",
    description:
      "Generates wireframes and layout variations from the IA, personas, and user stories, ready to push to Figma.",
  },
];
