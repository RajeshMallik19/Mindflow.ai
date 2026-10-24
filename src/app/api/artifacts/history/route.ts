import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");

  if (!projectId || !type) {
    return NextResponse.json({ error: "projectId and type are required" }, { status: 400 });
  }

  const artifact = await db.artifact.findFirst({
    where: { projectId, type },
    include: { versions: { orderBy: { createdAt: "desc" } } },
  });

  if (!artifact) {
    return NextResponse.json({ versions: [] });
  }

  return NextResponse.json({
    versions: artifact.versions.map((v) => ({
      id: v.id,
      content: v.content,
      createdAt: v.createdAt.toISOString(),
    })),
  });
}
