export interface AIProvider {
  generate(prompt: string): Promise<string>;
}

// Stub provider: works with zero configuration and zero cost, so the
// orchestrator pipeline is testable before any API key is wired up.
class EchoProvider implements AIProvider {
  async generate(prompt: string): Promise<string> {
    return [
      "(No AI_PROVIDER configured — this is a stub response so you can test the pipeline.)",
      "",
      "Prompt received:",
      prompt,
    ].join("\n");
  }
}

// Free-tier Gemini REST call. Set GEMINI_API_KEY to enable.
class GeminiProvider implements AIProvider {
  constructor(private apiKey: string) {}

  async generate(prompt: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string") {
      throw new Error("Gemini API returned an unexpected response shape");
    }
    return text;
  }
}

// Swap providers here later (e.g. a local Ollama model) without touching callers.
export function getProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) return new GeminiProvider(apiKey);
  return new EchoProvider();
}
