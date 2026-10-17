import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

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
  const { projectId, type, title, content } = parsed.data;

  const existing = await db.artifact.findFirst({ where: { projectId, type } });

  const artifact = existing
    ? await db.$transaction(async (tx) => {
        await tx.artifactVersion.create({
          data: { artifactId: existing.id, content: existing.content },
        });
        return tx.artifact.update({
          where: { id: existing.id },
          data: { content, title },
        });
      })
    : await db.artifact.create({ data: { projectId, type, title, content } });

  return NextResponse.json({ artifactId: artifact.id });
}
