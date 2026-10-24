import { db } from "./db";

export type SearchHit = {
  kind: "project" | "artifact" | "message";
  id: string;
  projectId: string | null;
  title: string;
  snippet: string;
  rank: number;
};

type RawHit = { id: string; projectId: string | null; title: string; snippet: string; rank: number };

// Postgres full-text search computed on the fly (to_tsvector/plainto_tsquery)
// across everything the owner has ever created — projects, artifacts,
// and messages from project-scoped conversations. No schema migration or
// index needed at personal-project scale; true vector/RAG embeddings are a
// reasonable later upgrade, not a blocker for a useful first version.
export async function searchKnowledgeBrain(query: string, limit = 8): Promise<SearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const [projects, artifacts, messages] = await Promise.all([
    db.$queryRaw<RawHit[]>`
      SELECT id, NULL as "projectId", name as title, COALESCE(description, '') as snippet,
        ts_rank(to_tsvector('english', name || ' ' || COALESCE(description, '')), plainto_tsquery('english', ${q})) as rank
      FROM projects
      WHERE to_tsvector('english', name || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit}
    `,
    db.$queryRaw<RawHit[]>`
      SELECT id, project_id as "projectId", type as title, content as snippet,
        ts_rank(to_tsvector('english', content), plainto_tsquery('english', ${q})) as rank
      FROM artifacts
      WHERE to_tsvector('english', content) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit}
    `,
    db.$queryRaw<RawHit[]>`
      SELECT m.id, c.project_id as "projectId", c.title as title, m.content as snippet,
        ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', ${q})) as rank
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.project_id IS NOT NULL
        AND to_tsvector('english', m.content) @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${limit}
    `,
  ]);

  const hits: SearchHit[] = [
    ...projects.map((p) => ({ ...p, projectId: p.id, kind: "project" as const })),
    ...artifacts.map((a) => ({ ...a, snippet: a.snippet.slice(0, 300), kind: "artifact" as const })),
    ...messages.map((m) => ({ ...m, snippet: m.snippet.slice(0, 300), kind: "message" as const })),
  ];

  return hits.sort((a, b) => b.rank - a.rank).slice(0, limit);
}

// The copilot's actual job (per PRD module 01): a reference/lookup layer
// over the Knowledge Brain, not a dispatcher to the pipeline specialists —
// those are run explicitly from the project page's specialist grid.
export function buildAssistantPrompt(opts: {
  task: string;
  project?: { name: string; description: string };
  hits: SearchHit[];
}): string {
  const context =
    opts.hits.length > 0
      ? opts.hits.map((h) => `- [${h.kind}] ${h.title}: ${h.snippet}`).join("\n")
      : "(nothing relevant found in the knowledge base)";

  return `You are the MindFlow AI assistant. You have access to the owner's own project history (their "Knowledge Brain") — ground your answers in it when relevant instead of making things up, and say plainly when you don't have relevant history.
${opts.project ? `\nCurrent project: ${opts.project.name} — ${opts.project.description || "(no description)"}\n` : ""}
Relevant items found in the knowledge base for this question:
${context}

If the owner seems to be trying to find or resume a past project/conversation, name it clearly so they know it exists. Otherwise, just answer helpfully.

Owner's message: ${opts.task}`;
}
