import { NextResponse } from "next/server";
import { searchKnowledgeBrain } from "@/lib/knowledge-brain";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const hits = await searchKnowledgeBrain(q);
  return NextResponse.json({ hits });
}
