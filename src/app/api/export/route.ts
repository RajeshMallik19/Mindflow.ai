import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// A full dump of everything the owner has ever created — projects,
// artifacts (with version history), conversations, and messages. Exists so
// the owner's data is never trapped behind this app or Supabase: it can
// always be pulled out as plain JSON.
export async function GET() {
  const projects = await db.project.findMany({
    include: {
      artifacts: { include: { versions: true } },
      conversations: { include: { messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const dump = {
    exportedAt: new Date().toISOString(),
    projects,
  };

  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mindflow-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
