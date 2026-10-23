
export interface AIProvider {
  generate(prompt: string): Promise<string>;
  stream(prompt: string): AsyncGenerator<string>;
}

class EchoProvider implements AIProvider {
  async generate(prompt: string): Promise<string> {
    return [
      "(Echo provider active — no AI model was called.)",
      "",
      "Prompt received:",
      prompt,
    ].join("\n");
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    yield await this.generate(prompt);
  }
}


class GeminiProvider implements AIProvider {
  private model: string;

  constructor(private apiKey: string) {
    this.model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  }

  async generate(prompt: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: AbortSignal.timeout(120_000),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text ?? "")
      .join("");

    if (!text) {
      throw new Error("Gemini API returned no text");
    }

    return text;
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: AbortSignal.timeout(120_000),
      },
    );

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
    }

    if (!res.body) {
      throw new Error("Gemini returned no streaming response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() ?? "";

        for (const event of events) {
          for (const line of event.split(/\r?\n/)) {
            if (!line.startsWith("data:")) continue;

            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;

            let data: any;
            try {
              data = JSON.parse(payload);
            } catch {
              continue;
            }

            const text = data?.candidates?.[0]?.content?.parts
              ?.map((part: { text?: string }) => part.text ?? "")
              .join("");

            if (text) yield text;
          }
        }

        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

class OpenRouterProvider implements AIProvider {
  private model: string;

  constructor(private apiKey: string) {
    this.model = process.env.OPENROUTER_MODEL?.trim() || "google/gemma-4-31b-it:free";
  }

  async generate(prompt: string): Promise<string> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;

    if (typeof text !== "string" || !text) {
      throw new Error("OpenRouter returned no text");
    }

    return text;
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter API error: ${res.status} ${await res.text()}`);
    }

    if (!res.body) {
      throw new Error("OpenRouter returned no streaming response body");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;

          let data: any;
          try {
            data = JSON.parse(payload);
          } catch {
            continue;
          }

          const text = data?.choices?.[0]?.delta?.content;
          if (text) yield text;
        }

        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

class OllamaProvider implements AIProvider {
  constructor(private model: string = "llama3.2:3b") {}

  async generate(prompt: string): Promise<string> {
    const host = (
      process.env.OLLAMA_HOST || "http://localhost:11434"
    ).replace(/\/+$/, "");

    const res = await fetch(`${host}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(240_000),
    });

    if (!res.ok) {
      throw new Error(`Ollama API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();

    if (typeof data?.response !== "string") {
      throw new Error("Ollama returned an unexpected response shape");
    }

    return data.response;
  }

  async *stream(prompt: string): AsyncGenerator<string> {
    yield await this.generate(prompt);
  }
}

export function getProvider(): AIProvider {
  const selectedProvider = (
    process.env.AI_PROVIDER || "gemini"
  ).trim().toLowerCase();

  switch (selectedProvider) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY?.trim();

      if (!apiKey) {
        throw new Error(
          "Gemini is selected, but GEMINI_API_KEY is missing from your environment.",
        );
      }

      return new GeminiProvider(apiKey);
    }

    case "ollama":
      return new OllamaProvider(
        process.env.OLLAMA_MODEL?.trim() || "llama3.2:3b",
      );

    case "openrouter": {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();

      if (!apiKey) {
        throw new Error(
          "OpenRouter is selected, but OPENROUTER_API_KEY is missing from your environment.",
        );
      }

      return new OpenRouterProvider(apiKey);
    }

    case "echo":
      return new EchoProvider();

    default:
      throw new Error(
        `Unsupported AI_PROVIDER "${selectedProvider}". Use gemini, openrouter, ollama, or echo.`,
      );
  }
}
