import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { upsertArtifact } from "@/lib/artifacts";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/json-output";
import {
  buildGossipPrompt,
  normalizeStoredResearchBrief,
  ResearchBriefSchema,
  type StoredResearchBrief,
} from "@/lib/pipeline";

const RequestSchema = z.object({
  projectId: z.string(),
});

// Converts a project's existing research_brief artifact to gossip mode and
// persists it (versioning the prior content, same as any other stage save).
export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId } = parsed.data;

  const artifact = await db.artifact.findFirst({
    where: { projectId, type: "research_brief" },
  });
  if (!artifact) {
    return NextResponse.json(
      { error: "Run Research for this project first" },
      { status: 400 },
    );
  }

  let stored: StoredResearchBrief;
  try {
    stored = normalizeStoredResearchBrief(JSON.parse(artifact.content));
  } catch {
    return NextResponse.json(
      { error: "Stored research brief is not valid JSON" },
      { status: 500 },
    );
  }

  const prompt = buildGossipPrompt(stored.simple);

  let gossip;
  try {
    gossip = await generateStructured(getProvider(), prompt, ResearchBriefSchema);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gossip conversion failed" },
      { status: 502 },
    );
  }

  const updated: StoredResearchBrief = { simple: stored.simple, gossip };

  await upsertArtifact({
    projectId,
    type: "research_brief",
    title: "Research",
    content: JSON.stringify(updated),
  });

  return NextResponse.json({ data: updated });
}
