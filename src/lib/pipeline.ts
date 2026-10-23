import { z } from "zod";

export const ResearchBriefSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  openQuestions: z.array(z.string()),
});
export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;

export const PersonasSchema = z.object({
  personas: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      goals: z.array(z.string()),
      frustrations: z.array(z.string()),
      context: z.string(),
    }),
  ),
});
export type Personas = z.infer<typeof PersonasSchema>;

export const UserStoriesSchema = z.object({
  stories: z.array(
    z.object({
      title: z.string(),
      asA: z.string(),
      iWant: z.string(),
      soThat: z.string(),
      acceptanceCriteria: z.array(z.string()),
    }),
  ),
});
export type UserStories = z.infer<typeof UserStoriesSchema>;

export const IaSitemapSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      parentId: z.string().nullable(),
    }),
  ),
});
export type IaSitemap = z.infer<typeof IaSitemapSchema>;

export const WireframesSchema = z.object({
  screens: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      sections: z.array(z.string()),
    }),
  ),
});
export type Wireframes = z.infer<typeof WireframesSchema>;

export type StageId =
  | "research_brief"
  | "personas"
  | "user_stories"
  | "ia_sitemap"
  | "wireframes";

export type PipelineContext = {
  project: { name: string; description: string };
  upstream: Partial<Record<StageId, unknown>>;
  tone?: "plain" | "gossip";
};

export type StageDef = {
  id: StageId;
  title: string;
  prerequisites: StageId[];
  schema: z.ZodType;
  buildPrompt: (ctx: PipelineContext) => string;
};

const JSON_INSTRUCTION =
  "Respond with ONLY a single raw JSON object matching the shape described — no markdown, no code fences, no commentary before or after it.";

export const STAGES: StageDef[] = [
  {
    id: "research_brief",
    title: "Research",
    prerequisites: [],
    schema: ResearchBriefSchema,
    buildPrompt: (ctx) => {
      const tone = ctx.tone ?? "plain";
      const toneInstruction =
        tone === "gossip"
          ? "Write the summary in a gossipy, Gen-Z, informal tone — like you're dishing out juicy details to a friend — while keeping every fact accurate. Keep keyFindings and openQuestions still clear and scannable."
          : "Write the summary in a clear, neutral, professional tone.";

      return `You are the Research Agent inside MindFlow AI, a personal product-design workspace. Investigate the problem below and produce a research brief.

Project: ${ctx.project.name}
Description: ${ctx.project.description || "(no description provided)"}

${toneInstruction}

Return JSON matching this shape:
{ "summary": string, "keyFindings": string[], "openQuestions": string[] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "personas",
    title: "Personas",
    prerequisites: ["research_brief"],
    schema: PersonasSchema,
    buildPrompt: (ctx) => {
      const research = ctx.upstream.research_brief as ResearchBrief | undefined;
      return `You are the Persona Maker inside MindFlow AI. Build 2-3 user personas grounded in the research below.

Project: ${ctx.project.name}
Research summary: ${research?.summary ?? "(none)"}
Key findings: ${research?.keyFindings?.join("; ") ?? "(none)"}

Return JSON matching this shape:
{ "personas": [{ "name": string, "role": string, "goals": string[], "frustrations": string[], "context": string }] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "user_stories",
    title: "User Stories",
    prerequisites: ["research_brief", "personas"],
    schema: UserStoriesSchema,
    buildPrompt: (ctx) => {
      const research = ctx.upstream.research_brief as ResearchBrief | undefined;
      const personas = ctx.upstream.personas as Personas | undefined;
      const personaNames = personas?.personas?.map((p) => `${p.name} (${p.role})`).join(", ");

      return `You are the User Stories Maker inside MindFlow AI. Write user stories with acceptance criteria based on the research and personas below.

Project: ${ctx.project.name}
Research summary: ${research?.summary ?? "(none)"}
Personas: ${personaNames || "(none)"}

Return JSON matching this shape:
{ "stories": [{ "title": string, "asA": string, "iWant": string, "soThat": string, "acceptanceCriteria": string[] }] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "ia_sitemap",
    title: "IA / Sitemap",
    prerequisites: ["personas", "user_stories"],
    schema: IaSitemapSchema,
    buildPrompt: (ctx) => {
      const personas = ctx.upstream.personas as Personas | undefined;
      const stories = ctx.upstream.user_stories as UserStories | undefined;
      const storyTitles = stories?.stories?.map((s) => s.title).join("; ");
      const personaNames = personas?.personas?.map((p) => p.name).join(", ");

      return `You are the IA Maker inside MindFlow AI. Produce a sitemap / information hierarchy as a flat list of nodes, each with an id, a label, and a parentId (null for top-level nodes).

Project: ${ctx.project.name}
Personas: ${personaNames || "(none)"}
User stories: ${storyTitles || "(none)"}

Return JSON matching this shape:
{ "nodes": [{ "id": string, "label": string, "parentId": string | null }] }

Keep ids short and unique (e.g. "home", "search", "search-results"). Keep the tree to a reasonable size (roughly 8-20 nodes).

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "wireframes",
    title: "Wireframes",
    prerequisites: ["ia_sitemap"],
    schema: WireframesSchema,
    buildPrompt: (ctx) => {
      const ia = ctx.upstream.ia_sitemap as IaSitemap | undefined;
      const nodeLabels = ia?.nodes?.map((n) => n.label).join(", ");

      return `You are the Design Agent inside MindFlow AI. Produce a wireframe spec (structure, not visual styling) for the screens below.

Project: ${ctx.project.name}
Sitemap screens: ${nodeLabels || "(none)"}

For each major screen, describe its purpose and its layout sections (e.g. "header with search bar", "grid of result cards", "sticky footer with CTA").

Return JSON matching this shape:
{ "screens": [{ "name": string, "purpose": string, "sections": string[] }] }

${JSON_INSTRUCTION}`;
    },
  },
];

export function getStage(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}
