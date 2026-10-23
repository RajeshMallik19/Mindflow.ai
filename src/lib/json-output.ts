import type { z } from "zod";
import type { AIProvider } from "./ai-provider";

// Small/free-tier models routinely wrap JSON in ```json fences or add a
// preamble sentence despite "respond with ONLY JSON" instructions. Strip
// fences and slice to the outermost {...} or [...] before parsing.
function extractJson(raw: string): string {
  const withoutFences = raw.replace(/```json|```/gi, "").trim();

  const firstBrace = withoutFences.indexOf("{");
  const firstBracket = withoutFences.indexOf("[");
  const starts = [firstBrace, firstBracket].filter((i) => i !== -1);
  if (starts.length === 0) return withoutFences;

  const start = Math.min(...starts);
  const openChar = withoutFences[start];
  const closeChar = openChar === "{" ? "}" : "]";
  const end = withoutFences.lastIndexOf(closeChar);
  if (end === -1 || end < start) return withoutFences;

  return withoutFences.slice(start, end + 1);
}

// Calls the provider with jsonMode, validates against `schema`, and retries
// exactly once (with the Zod error fed back to the model) on failure.
export async function generateStructured<T>(
  provider: AIProvider,
  prompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  type Attempt =
    | { ok: true; data: T }
    | { ok: false; raw: string; error?: z.ZodError };

  const attempt = async (p: string): Promise<Attempt> => {
    const raw = await provider.generate(p, { jsonMode: true });
    const extracted = extractJson(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch {
      return { ok: false, raw };
    }
    const result = schema.safeParse(parsed);
    if (!result.success) {
      return { ok: false, raw, error: result.error };
    }
    return { ok: true, data: result.data };
  };

  const first = await attempt(prompt);
  if (first.ok) return first.data;

  const retryPrompt = `${prompt}\n\nYour previous response did not match the required shape${
    first.error ? `: ${first.error.message}` : " (it wasn't valid JSON)"
  }. Respond again with ONLY the raw JSON object — no markdown, no code fences, no commentary.`;

  const second = await attempt(retryPrompt);
  if (second.ok) return second.data;

  throw new Error(
    `Model did not return valid structured output after a retry. Last raw response: ${second.raw.slice(0, 2000)}`,
  );
}
