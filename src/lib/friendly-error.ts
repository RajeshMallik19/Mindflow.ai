// Translates raw error messages (API errors, network failures, malformed
// AI output) into plain sentences. The original is always kept available
// via the console/server logs — this is just what the user sees.
export function toFriendlyMessage(raw: string): string {
  const lower = raw.toLowerCase();

  if (lower.includes("daily ai call limit") || lower.includes("rate limit")) {
    return "You've hit today's AI usage limit for this app. It resets tomorrow — or raise DAILY_AI_CALL_LIMIT in your .env.";
  }

  if (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    (lower.includes("quota") && lower.includes("exceeded"))
  ) {
    return "This AI provider's free daily limit has been reached. Try again later, or switch providers (AI_PROVIDER in your .env).";
  }

  if (
    lower.includes("503") ||
    lower.includes("overloaded") ||
    lower.includes("high demand") ||
    lower.includes("service unavailable")
  ) {
    return "The AI provider is temporarily overloaded (not a quota issue) — this usually clears up within a minute or two. Try again shortly.";
  }

  if (
    lower.includes("econnrefused") ||
    lower.includes("fetch failed") ||
    lower.includes("network")
  ) {
    return "Couldn't reach the AI provider. Check your internet connection, or that Ollama is running if you're using it locally.";
  }

  if (lower.includes("did not return valid structured output")) {
    return "The AI gave back something unexpected. Try regenerating — this usually works on a second try.";
  }

  if (lower.includes("missing prerequisite")) {
    return raw; // Already a plain, specific sentence.
  }

  if (lower.includes("api key") || lower.includes("missing from your environment")) {
    return "The AI provider isn't configured correctly — check your .env file.";
  }

  return `Something went wrong talking to the AI provider. (${raw.slice(0, 200)})`;
}
