# MindFlow AI — Product Requirements Document

## 1. What this is

MindFlow AI is a **personal, single-user AI-powered product design and
knowledge workspace**. It is not a product being built to sell — that is a
separate, unrelated startup idea. The goal is to combine a general AI
assistant, a research system, a multi-agent product design team, a visual
design workspace, and a persistent personal knowledge base in one place,
all sharing project context rather than operating as isolated tools.

The central idea: you provide a goal, MindFlow researches it, thinks
through the product problem, generates design artifacts, and helps turn
those artifacts into editable designs and working prototypes.

MindFlow must survive the owner **leaving their current company**: no
feature may depend on company infrastructure, a company account, or a
company-paid subscription.

## 2. Constraints (non-negotiable)

- **₹0 recurring cost target.** Every dependency must have a workable free
  tier or run locally. No paid APIs, no paid hosting, no always-on cloud VM.
  (Free API limits, electricity, internet, backups, and any future remote
  hosting still impose practical limits — the target is zero *recurring
  cost*, not a guarantee every AI capability stays unlimited forever.)
- **Owner's own accounts only.** Where a cloud service is unavoidable
  (database, deployment), it must be the owner's own free-tier account
  (Supabase, Vercel, GitHub) — never a shared or company-provided one.
- **Single user.** No multi-tenancy, no auth/signup flow, no user management.
  There is exactly one user, forever.
- **Local-first.** Run on the owner's own computer, data in a local/owned
  database. Cloud access (for other devices) is a deliberate later choice
  (private server or carefully configured remote access) — local-first does
  not automatically mean cloud-accessible.
- **Human approval for consequential actions.** Ask before writing to
  important files, changing external Figma documents, or anything
  destructive.
- **Privacy awareness.** Sending documents to a hosted AI API still sends
  that content to the provider — this is a real tradeoff, not eliminated by
  "local-first" branding.

## 3. The five modules

All five share project context — e.g. the Research Agent's findings must be
available to the design agents without manual copy-paste.

### 01 — General AI Assistant
A ChatGPT/Claude-like conversational assistant for everyday thinking,
discussion, planning, and problem-solving. **Its actual job is to be a
reference/lookup layer over the Personal Knowledge Brain** — understanding
the current project and surfacing relevant past context — not a
keyword-routed dispatcher to the specialist design agents (that routing
job belongs to the Product Design Agent's orchestrator, module 03, acting
on explicit user choices within a project, not on copilot chat messages).

### 02 — Research Agent
A dedicated research system, usable **standalone, before any project
exists** — you research a topic first, and only afterward decide whether to
turn it into a project (a "Turn this into a project?" action after a
research result creates the project and seeds it with that research —
project creation flows *from* research, not the other way around).

- Source-backed findings with citations where possible (today: model
  knowledge-based synthesis, not live web search — see §6 gaps).
- Clear separation of verified findings, assumptions, and uncertainty.
- **Two explanation modes, applied as a two-step process, not an either/or
  choice made upfront:** research always runs once in **Simple mode**
  (factual, neutral) first; **Gen-Z Gossip mode is a separate conversion
  step applied afterward to that same result** — a translation/rewrite of
  the existing research into informal Gen-Z language, not a differently-run
  original generation. Both the simple and gossip versions of a given
  research result should be viewable.
- Research output is structured so it can be hand off directly to the
  Product Design Agent's specialists without reformatting.

### 03 — Product Design Agent
The central coordinator for the product design workflow. It breaks down a
problem and delegates to specialist roles. **These are not separate running
AI agents/processes** — they are specialist roles implemented as distinct
instructions/prompts with structured outputs, coordinated by one
orchestrator. That's substantially easier to build, debug, and run for
free, and is the architecture already in place
(`src/lib/pipeline.ts` + `src/app/api/pipeline/route.ts`).

Specialist roster (extensible — more get added as needs evolve; presented
to the user as an **open-ended menu/checklist to pick from**, not a rigid
fixed-order tab bar):

- **Problem Framing Agent** — problem statements, assumptions, opportunity
  areas. *(not yet built — see §6)*
- **Research Agent** — evidence, user needs, insights (module 02, feeds in).
- **Persona Agent** — user personas grounded in available evidence. *(built)*
- **User Stories Agent** — user stories and acceptance criteria. *(built)*
- **Information Architecture Agent** — sitemaps, hierarchies, navigation
  structures. *(built)*
- **User Flow Agent** — task flows, decision points, alternate paths.
  *(partially built: the manual Start/Action/Decision canvas exists; a
  dedicated AI-generated user-flow artifact type does not yet)*
- **UX Strategy Agent** — design recommendations, interaction principles.
  *(not yet built)*
- **AI Interaction Design Agent** — AI behavior, uncertainty handling,
  fallback experiences (relevant since MindFlow is itself an AI product).
  *(not yet built — this was originally folded into the IA Maker's job
  description; worth splitting out as its own specialist per this doc)*

### 04 — Design Studio
Turn product thinking into actual interfaces and prototypes. **Not a
rebuild of Figma** — a lighter AI design environment that can work with
Figma when technically possible.

- Prompt-to-wireframe and UI generation — **actual visual layout (real
  boxes/hierarchy you can see), not a text description of sections.** This
  is a correction to the first build attempt, which only produced prose
  spec cards.
- Multiple layout variations using reusable design tokens.
- A visual editing panel inspired by Figma — editable elements and
  properties, in-app. (Scoped as a lightweight component-property editor,
  not a full canvas/rendering engine — see §5 for why a Figma-grade canvas
  remains out of scope.)
- Responsive React-based prototypes (code output, not just static mockups).
- Accessibility checks and UX audits.
- Export or sync with Figma **where technically supported** — see §5, this
  has a real platform limitation that changes what's buildable.

### 05 — Personal Knowledge Brain
The shared memory layer underneath every module.

- Import the owner's own notes, documents, research, and project files.
- Store past design decisions and their reasoning.
- Retrieve relevant knowledge when any agent needs context.
- Learn preferred working methods from feedback/approved preferences.
- Connect insights across projects.
- **Resumable by description:** type a vague natural-language description
  of a past conversation/project and get it found and reopened — this is
  the concrete, user-facing requirement, not just "a RAG backend."
- Start with **RAG (retrieval)**, not model fine-tuning/training — cheaper,
  easier to update, sufficient for giving the AI relevant context.

## 4. How the agents work together

```
You → provide a goal/idea
  → Orchestrator Agent (plans tasks, selects specialists, coordinates outputs)
      → Research Agent (evidence, insights)
      → Persona / User Stories (user needs)
      → IA / User Flow (structure, navigation)
      → Design Agent (wireframes, UI concepts)
  → Shared Knowledge Brain (project context, artifacts, decisions, handoffs)
  → Editable output: diagrams → wireframes → prototypes → Figma integration
```

Example: ask MindFlow to design a travel-planning feature → orchestrator
sends the problem to research → findings inform personas and user stories
→ generates an information architecture → creates user flows → produces UI
concepts. Each stage's prompt includes the prior stages' actual output as
context (already implemented for the 5 specialists built so far via
`StageDef.buildPrompt` in `src/lib/pipeline.ts`).

## 5. Known platform limitation: Figma export

**Figma's public REST API cannot create or write design nodes/frames** —
confirmed directly against Figma's own docs (only comments, variables,
webhooks, and dev resources are writable). Real node creation requires the
Plugin API, which only runs inside an open Figma editor session — a
headless server cannot "push" a design into Figma with zero clicks. This is
a hard platform constraint, not a scope choice. Realistic paths, in order
of buildability:

1. **Export as SVG, paste into Figma** — Figma natively converts pasted SVG
   markup into real, editable vector layers. Zero Figma account/token
   needed, works today, durable (doesn't depend on any Claude session).
   One manual paste action per screen.
2. A custom Figma Plugin the owner installs once (uses the Plugin API from
   inside Figma to pull a wireframe's JSON and draw it) — more setup, still
   not literally zero-click from MindFlow's side, but closer to "push."
3. On-demand, Claude-session-assisted push using a connected Figma MCP
   integration — fast and automatic *right now*, but not a capability the
   MindFlow app itself gains, and doesn't work outside an assisted session.

## 6. Explicitly rejected approaches (and why — don't re-propose these)

| Rejected | Reason |
|---|---|
| Fine-tuning a model on the owner's full personal history | RAG is cheaper, easier to update, and sufficient |
| A Grok-Bot-style always-on cloud VM with computer-vision GUI automation | The actual work here is API-shaped (search, Figma, DB) — a persistent VM would be expensive and mostly idle |
| Building a full Figma-grade design canvas/rendering engine | A real canvas engine is a multi-year effort; a lightweight editable-properties panel + exportable wireframe rendering is the realistic scope |
| Treating specialist design agents as separate running AI processes | Explicitly confirmed as unnecessary complexity — one orchestrator + distinct prompts/structured outputs per role is sufficient and far easier to build/debug/run for free |
| Multi-modal voice/camera/AR interaction | Inspired by a MAANG workflow reference, but irrelevant infrastructure for a personal tool |
| Hosting on a company or shared account | Breaks the "must survive leaving the job" requirement |
| Assuming Figma's REST API can create designs | Confirmed false against Figma's own docs — see §5 |

## 7. Current status (ground truth — update this section as things change)

**Built and verified:**
- Workspace shell (sidebar, project list, AI copilot panel).
- A 5-specialist pipeline (Research, Persona, User Stories, IA, and a
  text-only "wireframes" stage that needs upgrading to real visual output
  per module 04 above) with structured, Zod-validated, prerequisite-enforced
  handoff between stages (`src/lib/pipeline.ts`).
- Swappable AI provider adapter (Gemini default, OpenRouter, Ollama, Echo
  stub) with an optional JSON-mode flag.
- Copilot chat: persists history per-project, renders Markdown. (Still
  keyword-routes to the 5 pipeline subagents today — per §3 module 01 above,
  this should be re-scoped to be a Knowledge Brain lookup tool instead; not
  yet done.)
- Per-project React Flow diagram editor + an auto-laid-out, editable IA
  sitemap diagram generated from the IA specialist's output.
- Database: Supabase Postgres (not local SQLite — chosen so the app can be
  deployed on Vercel and reached from any device; see `.docs/ARCHITECTURE.md`
  for the local-first-vs-cloud tradeoff this implies).
- Pushed to the owner's own private GitHub repo
  (`RajeshMallik19/Mindflow.ai`) — independent of any company machine.

**Gap between current build and this document's full vision (not yet
built, roughly in a sensible build order — see `.docs/TASKS.md` for the
live, prioritized checklist):**
1. Research Engine as a standalone pre-project entry point, with the
   simple-mode-first + gossip-mode-as-conversion-step flow, and a "turn
   this into a project" action.
2. Re-scope the Product Design Agent's artifact menu to be open-ended
   (checklist-style, extensible) rather than a fixed 5-tab bar, and add the
   Problem Framing, UX Strategy, and AI Interaction Design specialists.
3. Design Studio: real visual wireframe rendering (not text cards), the
   editable properties panel, SVG/PNG export (§5 path 1), responsive React
   prototype generation, accessibility audits.
4. Re-scope the copilot to be a Knowledge Brain lookup/reference tool.
5. Personal Knowledge Brain: searchable, resumable-by-description storage
   over all research/projects/artifacts/conversations. Start with Postgres
   full-text search over titles/content as a pragmatic v1 — true vector/RAG
   embeddings are a reasonable later upgrade, not a blocker for a useful
   first version.
6. Actual Vercel deployment (DB is already cloud-hosted and ready; GitHub
   repo + Vercel project linkage is the remaining step).

## 8. Success criteria

The owner can: research a topic (simple mode) → read it, optionally convert
it to gossip mode → decide to turn it into a project → inside that project,
pick specialists to run one at a time from an open-ended menu, each
building on prior specialists' output → send the accumulated artifacts to
the Design Studio and get real visual wireframes, editable and exportable
→ later, describe any past project/research vaguely from the Knowledge
Brain and have it found and resumed → close the browser → come back later
(from any device, once deployed) → see everything still there.
