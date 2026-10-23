import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { upsertArtifact } from "@/lib/artifacts";
import { db } from "@/lib/db";
import { generateStructured } from "@/lib/json-output";
import { getStage, type StageId } from "@/lib/pipeline";

const STAGE_IDS: [StageId, ...StageId[]] = [
  "research_brief",
  "personas",
  "user_stories",
  "ia_sitemap",
  "wireframes",
];

const RequestSchema = z.object({
  projectId: z.string(),
  stageId: z.enum(STAGE_IDS),
  tone: z.enum(["plain", "gossip"]).optional(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, stageId, tone } = parsed.data;

  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const stage = getStage(stageId);

  const existingArtifacts =
    stage.prerequisites.length > 0
      ? await db.artifact.findMany({
          where: { projectId, type: { in: stage.prerequisites } },
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
    tone,
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

  await upsertArtifact({
    projectId,
    type: stageId,
    title: stage.title,
    content: JSON.stringify(result),
  });

  return NextResponse.json({ stageId, data: result });
}
