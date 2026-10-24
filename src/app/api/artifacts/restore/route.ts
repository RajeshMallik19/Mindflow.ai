import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertArtifact } from "@/lib/artifacts";
import { db } from "@/lib/db";

const RequestSchema = z.object({
  projectId: z.string(),
  type: z.string(),
  versionId: z.string(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { projectId, type, versionId } = parsed.data;

  const artifact = await db.artifact.findFirst({ where: { projectId, type } });
  if (!artifact) {
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const version = await db.artifactVersion.findUnique({ where: { id: versionId } });
  if (!version || version.artifactId !== artifact.id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Restoring versions the current content too, via upsertArtifact's normal
  // overwrite-and-version behavior — restoring is never destructive.
  const updated = await upsertArtifact({
    projectId,
    type,
    title: artifact.title,
    content: version.content,
  });

  let data: unknown = null;
  try {
    data = JSON.parse(updated.content);
  } catch {
    // Leave null if the stored content somehow isn't valid JSON.
  }

  return NextResponse.json({ data });
}
