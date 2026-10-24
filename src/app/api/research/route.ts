import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { generateStructured } from "@/lib/json-output";
import { getStage } from "@/lib/pipeline";

const RequestSchema = z.object({
  topic: z.string().min(1),
});

// Standalone research — no project required. Not persisted; the result
// lives in the client until the owner chooses to turn it into a project.
export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { topic } = parsed.data;

  const stage = getStage("research_brief");
  const prompt = stage.buildPrompt({
    project: { name: topic, description: "" },
    upstream: {},
  });

  try {
    const result = await generateStructured(getProvider(), prompt, stage.schema);
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 502 },
    );
  }
}
