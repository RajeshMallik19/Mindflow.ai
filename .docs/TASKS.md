# Tasks

Live checklist. Keep this updated as work happens — this is the first file
a new session should scan to know what's done and what's next.

## Done

- [x] Next.js + TypeScript + Tailwind + shadcn/ui scaffold
- [x] Prisma + Supabase (Postgres) database, schema migrated and verified
- [x] Workspace shell (sidebar, copilot panel, home dashboard)
- [x] Orchestrator: keyword router + 5 named subagents (Research, IA Maker,
      Persona Maker, User Stories Maker, Design Agent)
- [x] Swappable AI provider adapter: Gemini (default), OpenRouter, Ollama,
      Echo stub
- [x] Streaming responses end-to-end (API route -> copilot panel)
- [x] React Flow diagram editor with save/restore to the database
- [x] Fixed a real incident: `gemini-3.8-flash` hit its 20-requests/day free
      quota; switched to `gemini-3.5-flash-lite`
- [x] Added OpenRouter as a backup provider; validated
      `nvidia/nemotron-3.5-lightning:free` works reliably
- [x] Pushed to the owner's personal private GitHub repo
      (`RajeshMallik19/Mindflow.ai`) — the project no longer lives only on a
      company-owned laptop
- [x] Project documentation suite (this folder)

## In progress / next up

- [ ] Deploy to Vercel (owner's own account, already connected during
      development) — link the GitHub repo, set `DATABASE_URL` and whichever
      `AI_PROVIDER` env vars are needed, deploy.
- [ ] Decide: does the deployed (Vercel) copy and local dev copy share the
      same Supabase database, or does local dev get its own? Leaning toward
      **one shared database** for simplicity — confirm before deploying.

## Backlog (not started)

- [ ] Research Lab: real citation UI, source credibility labeling, and the
      "gossip mode" vs. plain-explanation toggle (an original, specific
      requirement from the project's first brainstorm — don't drop it).
- [ ] Design Agent -> real Figma push (via Figma's REST API or a plugin),
      instead of returning text-only wireframe descriptions.
- [ ] Knowledge Brain: document upload, chunking, embeddings, retrieval
      (RAG) over the owner's own notes. Explicitly deferred until there's
      an actual document to index — don't add a vector column speculatively.
- [ ] Wire the home page's "Quick actions" cards to actually start a
      Research / Product-Thinking / Design flow (currently inert labels).
- [ ] Ollama installation + local model, as a genuinely zero-quota fallback
      for local dev (user opted to try OpenRouter first instead).
- [ ] Artifact version history UI (data model already supports it via
      `artifact_versions`; no screen reads it yet).

## Known constraints to keep respecting

- **$0 recurring cost.** Every new dependency needs a workable free tier or
  must run locally.
- **Single user, no auth.** Don't add a login/signup flow.
- **Owner's own accounts only** for anything cloud (GitHub, Vercel,
  Supabase) — never a shared or company account.
- Don't do manual browser UI testing on the owner's behalf — verify via API
  calls, type-checking, and direct DB checks, and say plainly what wasn't
  visually verified.
