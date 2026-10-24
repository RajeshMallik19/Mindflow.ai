import { z } from "zod";

export const PLATFORM_OPTIONS = ["web", "mobile", "both"] as const;
export type Platform = (typeof PLATFORM_OPTIONS)[number];

export const ResearchBriefSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  openQuestions: z.array(z.string()),
});
export type ResearchBrief = z.infer<typeof ResearchBriefSchema>;

// What actually gets stored for the research_brief artifact type: the
// factual "simple" version is always generated first; "gossip" is a later,
// optional conversion of that same result, never a separately-generated
// original. Downstream stages always read .simple, never .gossip.
export type StoredResearchBrief = { simple: ResearchBrief; gossip?: ResearchBrief };

// Back-compat: research_brief was originally stored as a flat ResearchBrief,
// before the {simple, gossip?} wrapper existed.
export function normalizeStoredResearchBrief(parsed: unknown): StoredResearchBrief {
  if (parsed && typeof parsed === "object" && "simple" in parsed) {
    return parsed as StoredResearchBrief;
  }
  return { simple: parsed as ResearchBrief };
}

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

export const WIREFRAME_ELEMENT_TYPES = [
  "header",
  "nav",
  "text",
  "button",
  "image",
  "input",
  "card",
  "footer",
] as const;

export const WireframeElementSchema = z.object({
  id: z.string(),
  type: z.enum(WIREFRAME_ELEMENT_TYPES),
  label: z.string(),
});
export type WireframeElement = z.infer<typeof WireframeElementSchema>;

export const WireframeSectionSchema = z.object({
  id: z.string(),
  direction: z.enum(["row", "column"]),
  elements: z.array(WireframeElementSchema),
});
export type WireframeSection = z.infer<typeof WireframeSectionSchema>;

// Semantic layout, not pixel coordinates — asking a model for precise x/y/
// width/height numbers produces messy, overlapping results. Instead each
// screen is a top-to-bottom stack of sections, each a flex row/column of
// typed elements; actual sizing comes from CSS per element type at render
// time (see wireframe-canvas.tsx). This is reliable to generate and to render.
export const WireframeScreenSchema = z.object({
  name: z.string(),
  device: z.enum(["mobile", "desktop"]),
  sections: z.array(WireframeSectionSchema),
});
export type WireframeScreen = z.infer<typeof WireframeScreenSchema>;

// Optional and additive — old wireframe artifacts simply won't have a
// theme, and consumers treat that as "use the app's default look."
export const WireframeThemeSchema = z.object({
  primaryHex: z.string(),
  vibe: z.string(),
});
export type WireframeTheme = z.infer<typeof WireframeThemeSchema>;

export const WireframesSchema = z.object({
  screens: z.array(WireframeScreenSchema),
  theme: WireframeThemeSchema.optional(),
});
export type Wireframes = z.infer<typeof WireframesSchema>;

// Detects artifacts saved before this schema existed ({name, purpose,
// sections: string[]}) so the UI can show a "please regenerate" prompt
// instead of crashing on real projects created before this change.
export function isLegacyWireframes(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object" || !("screens" in parsed)) return true;
  const screens = (parsed as { screens?: unknown }).screens;
  if (!Array.isArray(screens) || screens.length === 0) return false;
  const first = screens[0];
  return !(
    first &&
    typeof first === "object" &&
    "sections" in first &&
    Array.isArray((first as { sections?: unknown }).sections) &&
    (first as { sections: unknown[] }).sections.every(
      (s) => s && typeof s === "object" && "elements" in s,
    )
  );
}

export const UserFlowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["start", "action", "decision"]),
  label: z.string(),
});
export type UserFlowNode = z.infer<typeof UserFlowNodeSchema>;

export const UserFlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().nullable().optional(),
});
export type UserFlowEdge = z.infer<typeof UserFlowEdgeSchema>;

export const UserFlowSchema = z.object({
  nodes: z.array(UserFlowNodeSchema),
  edges: z.array(UserFlowEdgeSchema),
});
export type UserFlow = z.infer<typeof UserFlowSchema>;

export const ProblemFramingSchema = z.object({
  problemStatement: z.string(),
  assumptions: z.array(z.string()),
  opportunityAreas: z.array(z.string()),
});
export type ProblemFraming = z.infer<typeof ProblemFramingSchema>;

export const UxStrategySchema = z.object({
  recommendations: z.array(z.string()),
  interactionPrinciples: z.array(z.string()),
});
export type UxStrategy = z.infer<typeof UxStrategySchema>;

export const AiInteractionDesignSchema = z.object({
  behaviors: z.array(z.object({ scenario: z.string(), aiResponse: z.string() })),
  fallbacks: z.array(z.string()),
  confidenceHandling: z.string(),
});
export type AiInteractionDesign = z.infer<typeof AiInteractionDesignSchema>;

export type StageId =
  | "research_brief"
  | "problem_framing"
  | "personas"
  | "user_stories"
  | "ia_sitemap"
  | "user_flow"
  | "ux_strategy"
  | "ai_interaction_design"
  | "wireframes";

export type PipelineContext = {
  project: { name: string; description: string };
  upstream: Partial<Record<StageId, unknown>>;
  // Opt-in stylistic variants for specific stages (not every stage uses
  // this — unlike research's gossip mode, these are chosen upfront rather
  // than converted after the fact, since there's no "accuracy" constraint
  // to preserve for a problem statement or a user story's delivery).
  tone?: string;
  // Only consumed by the wireframes stage: which device(s) to generate
  // screens for. Falls back to the project's stored platform if not passed
  // explicitly for a given run.
  platform?: Platform;
};

export type StageDef = {
  id: StageId;
  title: string;
  prerequisites: StageId[];
  // Included in upstream context if available, but never blocks the stage
  // from running — this is what makes the menu "open-ended" rather than a
  // rigid chain: a specialist can be enriched by others without requiring them.
  optionalContext?: StageId[];
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
      return `You are the Research Agent inside MindFlow AI, a personal product-design workspace. Investigate the problem below and produce a research brief.

Project: ${ctx.project.name}
Description: ${ctx.project.description || "(no description provided)"}

Write the summary in a clear, neutral, professional tone. Separate verified findings from open questions/uncertainty.

Return JSON matching this shape:
{ "summary": string, "keyFindings": string[], "openQuestions": string[] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "problem_framing",
    title: "Problem Framing",
    prerequisites: ["research_brief"],
    schema: ProblemFramingSchema,
    buildPrompt: (ctx) => {
      const research = (ctx.upstream.research_brief as StoredResearchBrief | undefined)?.simple;
      const toneInstruction =
        ctx.tone === "brutal-critique"
          ? "Write this as a brutally honest critique — like a skeptical investor tearing into a pitch. Be blunt about weak assumptions and real risks. Keep it fact-based, not mean for its own sake."
          : "Write in a clear, constructive tone.";

      return `You are the Problem Framing Agent inside MindFlow AI. Turn the research below into a sharp problem statement.

Project: ${ctx.project.name}
Research summary: ${research?.summary ?? "(none)"}
Key findings: ${research?.keyFindings?.join("; ") ?? "(none)"}

${toneInstruction}

Return JSON matching this shape:
{ "problemStatement": string, "assumptions": string[], "opportunityAreas": string[] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "personas",
    title: "Personas",
    prerequisites: ["research_brief"],
    schema: PersonasSchema,
    buildPrompt: (ctx) => {
      const research = (ctx.upstream.research_brief as StoredResearchBrief | undefined)?.simple;
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
      const research = (ctx.upstream.research_brief as StoredResearchBrief | undefined)?.simple;
      const personas = ctx.upstream.personas as Personas | undefined;
      const personaNames = personas?.personas?.map((p) => `${p.name} (${p.role})`).join(", ");
      const toneInstruction =
        ctx.tone === "sarcastic-standup"
          ? "Write the titles and 'soThat' reasoning with dry, sarcastic dev-standup humor — like a jaded engineer complaining about the obvious. Keep asA/iWant and acceptanceCriteria clear and actually usable, just inject the sarcasm around the edges."
          : "Write in a clear, professional tone.";

      return `You are the User Stories Maker inside MindFlow AI. Write user stories with acceptance criteria based on the research and personas below.

Project: ${ctx.project.name}
Research summary: ${research?.summary ?? "(none)"}
Personas: ${personaNames || "(none)"}

${toneInstruction}

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
    id: "user_flow",
    title: "User Flow",
    prerequisites: ["personas", "user_stories"],
    schema: UserFlowSchema,
    buildPrompt: (ctx) => {
      const personas = ctx.upstream.personas as Personas | undefined;
      const stories = ctx.upstream.user_stories as UserStories | undefined;
      const personaNames = personas?.personas?.map((p) => p.name).join(", ");
      const storyTitles = stories?.stories?.map((s) => s.title).join("; ");

      return `You are the User Flow Agent inside MindFlow AI. Map the primary task flow a user takes through this product: the start point, key actions, and decision points with their branches.

Project: ${ctx.project.name}
Personas: ${personaNames || "(none)"}
User stories: ${storyTitles || "(none)"}

Return JSON matching this shape:
{ "nodes": [{ "id": string, "type": "start" | "action" | "decision", "label": string }], "edges": [{ "id": string, "source": string, "target": string, "label": string | null }] }

Guidelines: exactly one "start" node. Every decision node should have exactly two outgoing edges, each labeled with its branch (e.g. "Yes"/"No"). Keep ids short and unique (e.g. "start", "n1", "n2"). Aim for 6-14 nodes covering one complete primary flow, including at least one decision point if the product has any branching logic.

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "ux_strategy",
    title: "UX Strategy",
    prerequisites: ["personas", "user_stories"],
    schema: UxStrategySchema,
    buildPrompt: (ctx) => {
      const personas = ctx.upstream.personas as Personas | undefined;
      const stories = ctx.upstream.user_stories as UserStories | undefined;
      const personaNames = personas?.personas?.map((p) => p.name).join(", ");
      const storyTitles = stories?.stories?.map((s) => s.title).join("; ");

      return `You are the UX Strategy Agent inside MindFlow AI. Recommend design direction and interaction principles for this product.

Project: ${ctx.project.name}
Personas: ${personaNames || "(none)"}
User stories: ${storyTitles || "(none)"}

Return JSON matching this shape:
{ "recommendations": string[], "interactionPrinciples": string[] }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "ai_interaction_design",
    title: "AI Interaction Design",
    prerequisites: ["personas", "user_stories"],
    schema: AiInteractionDesignSchema,
    buildPrompt: (ctx) => {
      const personas = ctx.upstream.personas as Personas | undefined;
      const stories = ctx.upstream.user_stories as UserStories | undefined;
      const personaNames = personas?.personas?.map((p) => p.name).join(", ");
      const storyTitles = stories?.stories?.map((s) => s.title).join("; ");

      return `You are the AI Interaction Design Agent inside MindFlow AI. This product itself uses AI, so design how it should behave: what it does in uncertain situations, and how it fails gracefully.

Project: ${ctx.project.name}
Personas: ${personaNames || "(none)"}
User stories: ${storyTitles || "(none)"}

Return JSON matching this shape:
{ "behaviors": [{ "scenario": string, "aiResponse": string }], "fallbacks": string[], "confidenceHandling": string }

${JSON_INSTRUCTION}`;
    },
  },
  {
    id: "wireframes",
    title: "Wireframes",
    prerequisites: ["ia_sitemap"],
    optionalContext: ["ux_strategy", "ai_interaction_design"],
    schema: WireframesSchema,
    buildPrompt: (ctx) => {
      const ia = ctx.upstream.ia_sitemap as IaSitemap | undefined;
      const nodeLabels = ia?.nodes?.map((n) => n.label).join(", ");
      const strategy = ctx.upstream.ux_strategy as UxStrategy | undefined;
      const aiDesign = ctx.upstream.ai_interaction_design as AiInteractionDesign | undefined;
      const platform = ctx.platform ?? "both";

      const platformInstruction =
        platform === "web"
          ? 'This product is web-only. Every screen must use "device": "desktop".'
          : platform === "mobile"
            ? 'This product is mobile-only. Every screen must use "device": "mobile".'
            : 'This product targets both web and mobile. For each major screen from the sitemap, produce TWO versions: one with "device": "desktop" and one with "device": "mobile" — same purpose and content, laid out appropriately for each device (e.g. a desktop nav might be a horizontal bar, the mobile version a stacked menu).';

      return `You are the Design Agent inside MindFlow AI. Produce an actual visual wireframe layout (not a text description) for each major screen below.

Project: ${ctx.project.name}
Sitemap screens: ${nodeLabels || "(none)"}
${strategy ? `UX strategy recommendations: ${strategy.recommendations.join("; ")}\nInteraction principles: ${strategy.interactionPrinciples.join("; ")}\n` : ""}${aiDesign ? `AI interaction fallbacks to account for: ${aiDesign.fallbacks.join("; ")}\n` : ""}
Each screen is a top-to-bottom stack of sections. Each section is a row or column of elements. Each element has a type (one of: ${WIREFRAME_ELEMENT_TYPES.join(", ")}) and a short label describing what it actually shows (e.g. a "text" element's label might be "Product title and price", not just "text").

${platformInstruction}

Also propose a visual theme for this specific product: one primary brand color (as a hex code) that fits the product's purpose and audience, and a short phrase describing the intended visual personality (e.g. "warm and playful", "minimal and clinical", "bold and energetic").

Return JSON matching this shape:
{ "screens": [{ "name": string, "device": "mobile" | "desktop", "sections": [{ "id": string, "direction": "row" | "column", "elements": [{ "id": string, "type": string, "label": string }] }] }], "theme": { "primaryHex": string, "vibe": string } }

Guidelines: 3-6 sections per screen, 1-5 elements per section, short unique ids (e.g. "s1", "el1").

${JSON_INSTRUCTION}`;
    },
  },
];

export function getStage(id: StageId): StageDef {
  const stage = STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

// A valid run order respecting every stage's prerequisites (DFS
// post-order topological sort) — computed from STAGES itself, so it stays
// correct automatically if specialists or their dependencies change later.
export function getTopologicalOrder(): StageId[] {
  const visited = new Set<StageId>();
  const order: StageId[] = [];

  function visit(id: StageId) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dep of getStage(id).prerequisites) visit(dep);
    order.push(id);
  }

  for (const stage of STAGES) visit(stage.id);
  return order;
}

// Converts an already-generated research brief into Gen-Z gossip style.
// This is always a rewrite of existing output, never an independent
// generation — the facts must stay identical, only the delivery changes.
export function buildGossipPrompt(brief: ResearchBrief): string {
  return `Rewrite the research brief below in a gossipy, Gen-Z, informal tone — like you're dishing out juicy details to a friend. Keep every fact, finding, and open question identical in meaning; only change the delivery style. Keep keyFindings and openQuestions as separate short items, just reworded in the same tone.

Original brief:
${JSON.stringify(brief)}

Return JSON matching this shape:
{ "summary": string, "keyFindings": string[], "openQuestions": string[] }

${JSON_INSTRUCTION}`;
}
