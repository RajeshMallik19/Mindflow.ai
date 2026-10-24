import { z } from "zod";
import { db } from "./db";

export const PatternsSchema = z.object({
  recurringPersonas: z.array(z.string()),
  recurringProblems: z.array(z.string()),
  suggestedTemplates: z.array(z.string()),
});
export type Patterns = z.infer<typeof PatternsSchema>;

// Pulls personas + problem statements across EVERY project (not one) so an
// AI pass can spot patterns the owner wouldn't notice project-by-project —
// this is the one feature that makes accumulated history compound instead
// of just sitting in storage.
export async function gatherProjectSummaries(): Promise<string[]> {
  const projects = await db.project.findMany({
    include: {
      artifacts: { where: { type: { in: ["personas", "problem_framing"] } } },
    },
  });

  const summaries: string[] = [];

  for (const project of projects) {
    const personaArtifact = project.artifacts.find((a) => a.type === "personas");
    const problemArtifact = project.artifacts.find((a) => a.type === "problem_framing");
    if (!personaArtifact && !problemArtifact) continue;

    const lines = [`Project: ${project.name}`];

    if (problemArtifact) {
      try {
        const parsed = JSON.parse(problemArtifact.content);
        if (parsed.problemStatement) lines.push(`Problem: ${parsed.problemStatement}`);
      } catch {
        // skip malformed content
      }
    }

    if (personaArtifact) {
      try {
        const parsed = JSON.parse(personaArtifact.content);
        const names = (parsed.personas ?? [])
          .map((p: { name?: string; role?: string }) => `${p.name} (${p.role})`)
          .join(", ");
        if (names) lines.push(`Personas: ${names}`);
      } catch {
        // skip malformed content
      }
    }

    summaries.push(lines.join("\n"));
  }

  return summaries;
}

export function buildPatternsPrompt(summaries: string[]): string {
  return `You are analyzing the owner's past product-design projects to find recurring patterns they might not have noticed themselves.

Projects:
${summaries.join("\n\n")}

Identify recurring persona types across projects, recurring problem themes, and suggest reusable templates or starting points based on what keeps coming up. If there isn't a real pattern for a category, return an empty array for it rather than inventing one.

Return JSON matching this shape:
{ "recurringPersonas": string[], "recurringProblems": string[], "suggestedTemplates": string[] }

Respond with ONLY a single raw JSON object matching the shape described — no markdown, no code fences, no commentary before or after it.`;
}
