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
- [x] Full 5-stage pipeline: Research -> Personas -> User Stories -> IA ->
      Wireframes, each a real subagent call with structured (Zod-validated)
      JSON output, prerequisite-enforced, each stage feeding the next.
      Rendered as real cards (not prose), IA as an auto-laid-out editable
      diagram. Research has a Plain/Gossip tone toggle.
- [x] Fixed: copilot history no longer vanishes on reload; copilot is now
      project-scoped; AI responses render as real Markdown; replaced
      `window.prompt()` with a proper Dialog; removed 4 dead sidebar nav
      links; Quick Action cards now create a project and redirect.
- [x] Visual pass: one indigo accent color (was pure grayscale), semantic
      Tailwind tokens instead of ad-hoc `zinc-*` classes in touched files.
- [x] `AIProvider.generate()` gained an optional `jsonMode` flag (Gemini
      `responseMimeType`, OpenRouter `response_format`, Ollama `format:json`).
- [x] Verified via direct API calls: all 5 stages produce real validated
      output with correct context hand-off; prerequisite enforcement (400);
      regeneration versions old content; copilot history survives reload.
- [x] **Full PRD rewrite** (`.docs/PRD.md`) to the authoritative 5-module
      vision: General Assistant (re-scoped as Knowledge Brain lookup, not
      yet re-scoped in code), Research Agent, Product Design Agent (8
      specialists), Design Studio (real visual wireframes + editable panel
      + React prototypes), Personal Knowledge Brain (resumable search).
      Also documents the confirmed Figma REST API write limitation.
- [x] **Research Engine**, standalone and project-independent: `/research`
      page, runs research with no project required (not persisted until
      converted). Gen-Z gossip mode is a **conversion step on an existing
      result**, not an upfront either/or choice — `/api/research/gossip`
      (standalone) and `/api/pipeline/gossip` (in-project, persisted)
      rewrite an already-generated brief into gossip tone, same facts.
      "Turn this into a project" creates the project and seeds its
      research_brief artifact in one action. research_brief storage shape
      is now `{simple, gossip?}` everywhere; downstream stages always read
      `.simple`. Added `normalizeStoredResearchBrief()` for back-compat
      with artifacts stored before this change (caught a real crash on the
      owner's own Hackloop.ai project during testing).

## Recommended build order for the rest (per PRD.md §7)

1. ~~Research Engine as a standalone pre-project entry point~~ **done.**
2. **Next up:** re-scope the Product Design Agent's artifact menu from the
   fixed 5-tab bar to an open-ended checklist, and add the Problem Framing,
   UX Strategy, and AI Interaction Design specialists (8 total).
3. Design Studio: real visual wireframe rendering (not text cards), the
   editable properties panel, SVG export (realistic Figma path — paste SVG
   into Figma, see PRD §5), responsive React prototype generation,
   accessibility audits.
4. Re-scope the copilot to be a Knowledge Brain lookup/reference tool
   instead of a keyword-routed dispatcher to the pipeline subagents.
5. Personal Knowledge Brain v1: Postgres full-text search over
   projects/research/artifacts/conversations, resumable by vague
   description. True vector/RAG embeddings are a later upgrade.
6. Deploy to Vercel (owner's own account, already connected during
   development) — link the GitHub repo, set env vars, deploy. Decide
   whether the deployed copy and local dev share one Supabase database
   (leaning yes, for simplicity) before doing this.

## Backlog (not started, lower priority than the above)

- [ ] Ollama installation + local model, as a genuinely zero-quota fallback
      for local dev (user opted to try OpenRouter first instead).
- [ ] Artifact version history UI (data model already supports it via
      `artifact_versions`; no screen reads it yet).
- [ ] The manual Start/Action/Decision diagram tool (`flow-editor.tsx`,
      `user_flow` artifact type) is now mostly superseded by the IA stage's
      auto-generated diagram — decide whether to keep it as a general-purpose
      scratch canvas or retire it.

## Known constraints to keep respecting

- **$0 recurring cost.** Every new dependency needs a workable free tier or
  must run locally.
- **Single user, no auth.** Don't add a login/signup flow.
- **Owner's own accounts only** for anything cloud (GitHub, Vercel,
  Supabase) — never a shared or company account.
- Don't do manual browser UI testing on the owner's behalf — verify via API
  calls, type-checking, and direct DB checks, and say plainly what wasn't
  visually verified.
