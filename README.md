# MindFlow AI

A personal, product-design AI workspace. See `.docs/PRD.md` for the full
story — short version: an orchestrator routes tasks to named subagents
(Research, IA Maker, Persona Maker, User Stories Maker, Design Agent), with
a diagram editor and (eventually) a real Figma push and a personal
knowledge/RAG layer. Built to run on free tiers only and to outlive any
single employer.

## Quick start

```bash
npm install
npx prisma generate
npm run dev
```

Open http://localhost:3000.

## Environment variables (`.env`, not committed)

```bash
DATABASE_URL=            # Supabase Postgres connection string
AI_PROVIDER=gemini       # gemini | openrouter | ollama | echo
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
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
npx prisma studio       # browse the database
npx prisma db push      # sync schema.prisma to the database
```
