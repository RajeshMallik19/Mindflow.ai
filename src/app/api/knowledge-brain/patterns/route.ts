import { NextResponse } from "next/server";
import { getProvider } from "@/lib/ai-provider";
import { generateStructured } from "@/lib/json-output";
import { buildPatternsPrompt, gatherProjectSummaries, PatternsSchema } from "@/lib/patterns";
import { checkAndIncrementRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const summaries = await gatherProjectSummaries();

  if (summaries.length < 2) {
    return NextResponse.json(
      {
        error:
          "Need at least 2 projects with personas or a problem statement to find patterns.",
      },
      { status: 400 },
    );
  }

  const rateLimit = await checkAndIncrementRateLimit("ai_calls");
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: `Daily AI call limit reached (${rateLimit.limit}/day). Try again tomorrow.` },
      { status: 429 },
    );
  }

  const prompt = buildPatternsPrompt(summaries);

  try {
    const result = await generateStructured(getProvider("patterns"), prompt, PatternsSchema);
    return NextResponse.json({ data: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pattern analysis failed" },
      { status: 502 },
    );
  }
}
