import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { upsertArtifact } from "@/lib/artifacts";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/json-output";
import { getStage, type StageId } from "@/lib/pipeline";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

const STAGE_IDS: [StageId, ...StageId[]] = [
  "research_brief",
  "problem_framing",
  "personas",
  "user_stories",
  "ia_sitemap",
  "ux_strategy",
  "ai_interaction_design",
  "wireframes",
];

const RequestSchema = z.object({
  projectId: z.string(),
  stageId: z.enum(STAGE_IDS),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, stageId } = parsed.data;

  const rateLimit = await checkAndIncrementRateLimit("ai_calls");
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: `Daily AI call limit reached (${rateLimit.limit}/day). Try again tomorrow.` },
      { status: 429 },
    );
  }

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const stage = getStage(stageId);
  const contextTypes = [...stage.prerequisites, ...(stage.optionalContext ?? [])];

  const existingArtifacts =
    contextTypes.length > 0
      ? await db.artifact.findMany({
          where: { projectId, type: { in: contextTypes } },
        })
      : [];

  const missing = stage.prerequisites.filter(
    (p) => !existingArtifacts.some((a) => a.type === p),
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing prerequisite stage(s): ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const upstream: Record<string, unknown> = {};
  for (const artifact of existingArtifacts) {
    try {
      upstream[artifact.type] = JSON.parse(artifact.content);
    } catch {
      // Leave unset if a prerequisite's content somehow isn't valid JSON.
    }
  }

  const prompt = stage.buildPrompt({
    project: { name: project.name, description: project.description },
    upstream,
  });

  let result;
  try {
    result = await generateStructured(getProvider(), prompt, stage.schema);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stage generation failed" },
      { status: 502 },
    );
  }

  const stored = stageId === "research_brief" ? { simple: result } : result;

  await upsertArtifact({
    projectId,
    type: stageId,
    title: stage.title,
    content: JSON.stringify(stored),
  });

  return NextResponse.json({ stageId, data: stored });
}
