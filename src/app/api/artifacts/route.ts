import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertArtifact } from "@/lib/artifacts";

const RequestSchema = z.object({
  projectId: z.string(),
  type: z.string(),
  title: z.string(),
  content: z.string(),
});

export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const artifact = await upsertArtifact(parsed.data);
  return NextResponse.json({ artifactId: artifact.id });
}
