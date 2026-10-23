# Architecture

## Stack

- **Framework:** Next.js 16 (App Router, TypeScript), Turbopack
- **Styling:** Tailwind CSS v4 + shadcn/ui (built on **Base UI**, not Radix —
  components use the `render` prop, not `asChild`)
- **Database:** PostgreSQL via **Supabase** (free tier), accessed through
  **Prisma 6** (pinned — Prisma 7 requires driver adapters/native modules,
  unnecessary complexity here)
- **Diagrams:** `@xyflow/react` (React Flow)
- **Validation:** Zod
- **Hosting (planned, in progress):** Vercel Hobby (free), deployed from this
  GitHub repo
- **AI:** a swappable provider adapter — Gemini free tier (default), with
  OpenRouter and local Ollama as alternatives (see API_SPEC.md)

## Why these choices

- **Postgres, not SQLite:** the app needs to run on Vercel eventually, and
  Vercel's serverless functions have no persistent local disk. Supabase's
  free Postgres tier is reachable from both local dev and the deployed app.
- **Prisma 6, not 7:** Prisma 7 requires a driver-adapter pattern (e.g.
  `better-sqlite3`, native modules) for anything beyond its hosted Accelerate
  product. Prisma 6's plain `url = env("DATABASE_URL")` datasource is simpler
  and sufficient.
- **A provider adapter, not a hardcoded SDK call:** free-tier AI quotas are
  unreliable (see API_SPEC.md for a real incident where a model's daily quota
  silently ran out). The app must be able to switch providers via one
  environment variable without touching calling code.
- **Keyword-based orchestrator routing, not an LLM call:** routing a task to
  a subagent is cheap and instant this way, and avoids spending AI quota on
  the decision of *which* AI call to make.

## Folder structure

```
.docs/                           — project documentation (this folder)
prisma/schema.prisma             — database schema (Postgres)
src/
  app/
    layout.tsx                   — root layout (full-height flex shell)
    page.tsx                     — home dashboard (Suspense-streamed server component)
    actions.ts                   — server actions (createProject)
    project/[id]/page.tsx        — per-project workspace (diagram editor)
    api/
      orchestrator/route.ts      — POST: routes a task to a subagent, streams AI output, persists it
      artifacts/route.ts         — POST: upserts an artifact (e.g. a saved diagram), versions old content
  components/
    ui/                          — shadcn/ui primitives
    workspace/
      app-sidebar.tsx            — nav + project list + subagent roster
      copilot-panel.tsx          — chat UI, streams from /api/orchestrator
      new-project-dialog.tsx     — create-project form (shadcn Dialog)
      flow-editor.tsx            — React Flow canvas, save/restore
      flow-nodes.tsx             — custom node types (start/action/decision)
  lib/
    db.ts                        — Prisma client singleton
    types.ts                     — shared types
    subagents.ts                 — the subagent registry (name/title/description)
    subagent-prompts.ts          — per-subagent prompt templates
    orchestrator.ts              — keyword router: task text -> subagent
    ai-provider.ts               — swappable AI provider adapter
```

## The orchestrator pattern

This mirrors how Claude Code itself routes work to named subagents — a main
loop with a registry of specialists, not one big prompt trying to do
everything.

1. A task comes in (from the copilot panel, or eventually a project-scoped
   action).
2. `routeTask()` (`src/lib/orchestrator.ts`) matches keywords in the task
   text against each subagent's hint list and returns the best match
   (defaulting to Research Agent if nothing matches).
3. `buildSubagentPrompt()` (`src/lib/subagent-prompts.ts`) wraps the task in
   that subagent's specific instructions.
4. `getProvider().stream()` (`src/lib/ai-provider.ts`) sends the prompt to
   whichever AI provider is configured and streams the response back.
5. The orchestrator route persists both the user's message and the
   subagent's reply to the `conversations`/`messages` tables.

Adding a new subagent means: add an entry to `SUBAGENTS`, add its prompt
template, add keyword hints to the router. No other files need to change.
