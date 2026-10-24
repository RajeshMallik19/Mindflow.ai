import { NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai-provider";
import { generateStructured } from "@/lib/json-output";
import { buildGossipPrompt, ResearchBriefSchema } from "@/lib/pipeline";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

const RequestSchema = z.object({
  brief: ResearchBriefSchema,
});

// Converts an existing (already-generated) research brief into gossip
// mode. Not persisted here — the caller decides whether/where to store it.
export async function POST(req: Request) {
  const parsed = RequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const rateLimit = await checkAndIncrementRateLimit("ai_calls");
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: `Daily AI call limit reached (${rateLimit.limit}/day). Try again tomorrow.` },
      { status: 429 },
    );
  }

  const prompt = buildGossipPrompt(parsed.data.brief);

  try {
    const result = await generateStructured(getProvider(), prompt, ResearchBriefSchema);
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gossip conversion failed" },
      { status: 502 },
    );
  }
}
