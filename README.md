# MindFlow AI

A personal AI product-design and knowledge workspace. See `.docs/PRD.md` for
the full story — short version: a Research Engine (with a Gen-Z gossip-mode
conversion), an 8-specialist Product Design Agent you pick from freely
(Problem Framing, Persona, User Stories, IA, UX Strategy, AI Interaction
Design, Design Agent), a Design Studio that renders real visual wireframes
(exportable to SVG/PNG), and a Knowledge Brain that can find and resume any
past project from a vague description. Built to run on free tiers only and
to outlive any single employer.

## Quick start

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000.

## Environment variables (`.env`, not committed)

```bash
DATABASE_URL=                 # Supabase Postgres connection string

AI_PROVIDER=gemini            # gemini | openrouter | ollama | echo
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

DAILY_AI_CALL_LIMIT=150       # optional, defaults to 150 if unset

APP_PASSWORD=                 # optional locally; REQUIRED before deploying
                               # anywhere public (e.g. Vercel) — with this
                               # unset, the app has zero authentication and
                               # anyone with the URL has full read/write
                               # access to everything.
```

`AI_PROVIDER` picks which of the above actually gets used; only that
provider's variables need to be set. See `.docs/API_SPEC.md` for details and
known quirks of each.

## Project docs

See `.docs/`:
- `PRD.md` — what this is, constraints, and what's explicitly out of scope
- `ARCHITECTURE.md` — stack, folder layout, the orchestrator pattern
- `DATAMODEL.md` — database schema and ER diagram
- `API_SPEC.md` — routes and third-party integrations
- `UI_UX_SPEC.md` — pages, components, user journeys
- `TASKS.md` — live progress checklist — **read this first**

## Useful commands

```bash
npx tsc --noEmit        # type-check
npm run lint            # eslint
npm test                # run the Vitest suite
npx prisma studio       # browse the database
npx prisma db push      # sync schema.prisma to the database
```

## Your data is never trapped here

Click "Download my data" in the sidebar (or hit `/api/export` directly) to
get everything — every project, artifact, and conversation — as plain JSON,
any time.
