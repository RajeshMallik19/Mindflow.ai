# MindFlow AI — Product Requirements Document

## 1. What this is

MindFlow AI is a **personal, single-user product-design workspace**. It is
not a product being built to sell — that is a separate, unrelated startup
idea. MindFlow is meant to become the owner's daily tool for product-design
work, and specifically must survive them **leaving their current company**:
no feature may depend on company infrastructure, a company account, or a
company-paid subscription.

## 2. Constraints (non-negotiable)

- **$0 recurring cost.** Every dependency must have a workable free tier or
  run locally. No paid APIs, no paid hosting, no cloud VM.
- **Owner's own accounts only.** Where a cloud service is unavoidable
  (database, deployment), it must be the owner's own free-tier account
  (Supabase, Vercel, GitHub) — never a shared or company-provided one.
- **Single user.** No multi-tenancy, no auth/signup flow, no user management.
  There is exactly one user, forever.

## 3. The three pillars

1. **General assistant** — a chat copilot for everyday understanding and
   conversation. (Implemented: the copilot panel, routed through the
   orchestrator.)
2. **Product Design Agent** — an orchestrator over named subagents (not one
   monolithic prompt):
   - **Research Agent** — investigates a topic, cites sources, synthesizes a
     problem statement.
   - **IA Maker** — turns a problem statement into a sitemap/information
     hierarchy, and defines what the UI shows at high vs. low AI confidence.
   - **Persona Maker** — builds user personas from research findings.
   - **User Stories Maker** — writes user stories + acceptance criteria.
   - **Design Agent** — generates wireframe/layout variations, intended to be
     pushed to a real Figma file via Figma's API (not an in-app canvas).
3. **The Brain** — a private, local-first knowledge base over the owner's own
   notes and past decisions, used via **RAG** (retrieval, not fine-tuning) so
   the assistant reasons with the owner's own context without needing to
   retrain a model.

## 4. Explicitly rejected approaches (and why — don't re-propose these)

| Rejected | Reason |
|---|---|
| Fine-tuning a model on the owner's full personal history | RAG is cheaper, easier to update, and sufficient |
| A Grok-Bot-style always-on cloud VM with computer-vision GUI automation | The actual work here is API-shaped (search, Figma, DB) — a persistent VM would be expensive and mostly idle |
| Building an in-app Figma-grade design canvas | A real canvas engine is a multi-year effort; push structured output to real Figma instead |
| Multi-modal voice/camera/AR interaction | Inspired by a MAANG workflow reference, but irrelevant infrastructure for a personal tool |
| Hosting on a company or shared account | Breaks the "must survive leaving the job" requirement |

## 5. Current status (ground truth — update this section as things change)

**Built and verified:**
- Workspace shell (sidebar, project list, AI copilot panel).
- Orchestrator: keyword-based router dispatches a task to one of the 5
  subagents above (`src/lib/orchestrator.ts`).
- Streaming AI responses from a swappable provider (`src/lib/ai-provider.ts`):
  Gemini free tier is the current default; an Ollama (local model) path also
  exists; an OpenRouter path is being added as a lower-friction free-tier
  alternative to both.
- Per-project React Flow diagram editor (Start/Action/Decision nodes,
  connect, rename, save/restore).
- Database: originally local SQLite, **migrated to Supabase Postgres** so the
  app can be deployed on Vercel and reached from any device, not just the
  dev machine.

**Not yet built:**
- Figma push integration (Design Agent output still text/structured data,
  not yet sent to a real Figma file).
- Research Lab's citation UI and "gossip mode" (plain vs. informal
  explanation toggle) — this was an early, vivid requirement from the
  original brainstorm and should not be forgotten even though it's not yet
  implemented.
- The Knowledge Brain / RAG layer entirely.
- Actual Vercel deployment (DB is migrated and ready; GitHub repo + Vercel
  project linkage is the remaining step).

## 6. Success criteria for the MVP

The owner can: create a project → ask the copilot a product-design question
→ get it routed to the correct subagent → get a real, useful AI-generated
answer → save a resulting diagram → close the browser → come back later
(from any device, once deployed) → see everything still there.
