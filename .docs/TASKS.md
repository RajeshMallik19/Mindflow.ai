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
- [x] **Expanded specialist roster to the full 8** from PRD.md: added
      Problem Framing (prereq: research_brief), UX Strategy (prereq:
      personas+user_stories), AI Interaction Design (prereq:
      personas+user_stories). Added `StageDef.optionalContext` so a stage
      can be enriched by another's output without hard-requiring it —
      Wireframes now optionally pulls in UX Strategy + AI Interaction
      Design (verified live: wireframe output picked up UX Strategy's
      font-toggle/contrast recommendations). Replaced the fixed Tabs bar
      with a grid of specialist cards you pick from — matches "open-ended
      menu, not a rigid pipeline," and scales better than tabs at 8 items.
- [x] **Design Studio: real visual wireframes.** Wireframes stage now
      generates semantic layout (screens -> sections -> typed elements:
      header/nav/text/button/image/input/card/footer), rendered as actual
      styled boxes via `wireframe-canvas.tsx`, not text spec cards. Click an
      element to edit its type/label (side panel); "Save changes" persists
      edits. Export: Copy as SVG, download .svg (reliable Figma import via
      file drag-in), download .png — all built from real measured DOM
      positions so exports match what's shown. `isLegacyWireframes()` shows
      a "please regenerate" card instead of crashing for the 2 real
      projects (Hackloop.ai + another) that had old-shape wireframes —
      checked the live DB before shipping this, verified both still load.
      Still not done: the editable-properties panel is label/type only
      (not full style/position editing), and React prototype generation /
      accessibility audits from the original Design Studio scope.
- [x] **Knowledge Brain v1 + re-scoped copilot.** `src/lib/knowledge-brain.ts`:
      Postgres full-text search (on-the-fly tsvector, no migration needed)
      across projects, artifacts, and project-scoped conversation messages.
      New `/knowledge-brain` page: type a vague description, get ranked
      clickable results that jump to the matching project. The copilot
      (`/api/orchestrator`) no longer keyword-routes to a pipeline
      specialist — it searches the Knowledge Brain per message and grounds
      its answer in whatever it finds, matching PRD module 01's actual
      definition. Deleted the now-unused `orchestrator.ts`,
      `subagent-prompts.ts`, `subagents.ts`, and the stale "Subagents"
      sidebar roster (only ever listed 5 of 8 specialists). Verified live:
      searching "Hackloop" surfaced the real project + its actual
      wireframes/IA artifacts; asking the copilot "what was that Hackloop
      project about again?" (no project context) answered correctly from
      real stored data, not a guess.
- [x] **Full product-quality pass**, prompted by an honest multi-role
      self-review (PM/designer/frontend/backend/QA/support angles) that
      surfaced real, confirmed gaps by checking the actual code, not just
      recalling from memory:
      - **Project rename & delete** — the CRUD completion that was missing
        entirely (`project-header-menu.tsx`, `renameProject`/`deleteProject`
        actions).
      - **Dark mode actually works now** — `globals.css` had `.dark`
        variables that nothing ever applied; added a no-flash theme script
        in `layout.tsx` + a manual toggle in the sidebar.
      - **Friendly error messages** (`src/lib/friendly-error.ts`) — raw API
        errors (`"Gemini API error: 429 ..."`) are now translated to plain
        sentences across the copilot, research page, and pipeline view.
      - **Data export** — `GET /api/export` dumps every project, artifact,
        and conversation as downloadable JSON; "Download my data" link in
        the sidebar. Directly closes the gap where the project's own
        "yours forever" philosophy had no actual way to get data out.
      - **DB-backed rate limiting** (`src/lib/rate-limit.ts`) on every
        AI-calling route — reuses the `UserPreference` table as a
        day-scoped counter instead of in-memory state, specifically because
        in-memory counters don't survive Vercel's serverless instances.
        Verified the increment/limit logic directly against the DB.
      - **Password gate** (`src/proxy.ts` — Next 16 renamed `middleware.ts`
        to `proxy.ts`, migrated to the new convention) — a single shared
        password via `APP_PASSWORD`, skipped entirely if that env var isn't
        set so local dev stays frictionless. **This must be set before the
        upcoming Vercel deploy** — with it unset, a public URL would have
        zero authentication.
      - **Mobile-responsive layout** — new `workspace-shell.tsx` shared
        across all 4 pages; sidebar/copilot collapse into Sheet slide-outs
        below the `md` breakpoint instead of 3 fixed-width columns breaking
        on a phone.
      - **A real test suite** — added Vitest, wrote unit tests for the two
        back-compat detectors (`normalizeStoredResearchBrief`,
        `isLegacyWireframes`) that have *already* caused real production
        crashes this session, plus `layoutIaSitemap`. `npm test` to run.
- [x] **Six requested innovations**, all built and verified against real
      data:
      - **Run All button** — `getTopologicalOrder()` (DFS over
        prerequisites, self-adjusts if specialists change) + a button that
        runs every not-yet-done stage in a valid dependency order, stopping
        on the first error. Tested: the sort places every stage after all
        its prerequisites (unit test).
      - **Welcome-back digest** — a one-line "X of 8 done, suggested next: Y"
        banner on the project page. Deliberately **rule-based, no AI call**
        — same practical value as the AI-generated version originally
        pitched, at zero cost/latency.
      - **Cross-project pattern mining** (`src/lib/patterns.ts`,
        `/api/knowledge-brain/patterns`) — pulls personas + problem
        statements across *every* project and finds recurring themes.
        Requires 2+ eligible projects or returns a friendly message instead
        of calling AI on insufficient data. Verified live against the
        owner's real projects: correctly surfaced "Hackathon Organizer" and
        "Developer / Rapid Prototyper" as recurring personas.
      - **Tone modes beyond Research** — Problem Framing gets a "Brutally
        Honest Critique" option, User Stories gets "Sarcastic Dev Standup."
        Unlike Research's gossip mode (always a post-hoc conversion to
        preserve factual accuracy), these are chosen upfront since there's
        no accuracy constraint for a problem statement's delivery style.
        Verified live: brutal-critique mode produced a genuinely blunt,
        investor-style teardown, not a neutral statement.
      - **Voice input** (`voice-input-button.tsx`) — browser-native
        SpeechRecognition (Chrome/Edge), zero dependency, zero API key.
        Feature-checked **at click time, not render time** — checking at
        render time caused a real, confirmed hydration mismatch (button
        present on client, absent in SSR output); checking on click avoids
        the server/client branch entirely. Wired into the Research topic
        box and the copilot.
      - **Per-stage AI provider override** (`getProvider(stageId)`) —
        `AI_PROVIDER_<STAGE_ID>` env var overrides the global `AI_PROVIDER`
        for one specialist. Infrastructure is ready now; only becomes
        useful once Ollama is actually installed (still backlog).
      - Also fixed along the way: a stale `.next` build cache (Next 16's
        Cache Components) was serving old SSR output after a structural
        edit — cleared it; not a real bug, but worth knowing this can
        happen after this kind of change.
- [x] **Five more requested innovations**, all built and verified against
      real data:
      - **Version history + restore UI** (`version-history-dialog.tsx`,
        `/api/artifacts/history`, `/api/artifacts/restore`) — every
        specialist's "History" button lists its past `ArtifactVersion` rows
        with timestamps; restoring versions the then-current content first
        (never destructive). Verified live against Hackloop.ai's real
        research_brief history (already had a version from earlier tone
        testing) — restore correctly bumped the version count.
      - **9th specialist: User Flow Agent** (`pipeline.ts`'s `user_flow`
        stage, `user-flow-layout.ts`) — closes a gap from PRD.md's original
        8-specialist roster that was never built. Generates a real task
        flow (start/action/decision nodes, branching edges with labels)
        from personas + user stories, auto-laid-out via BFS depth from the
        start node, rendered on the existing `FlowEditor` canvas
        (`user_flow_diagram` artifact — kept separate from the semantic
        `user_flow` data, same split as `ia_sitemap`/`ia_diagram`). Checked
        the live DB for legacy `user_flow` artifacts before reusing that
        name (none existed) — the old manual-canvas artifact type was never
        actually written to production data. Verified live against
        Hackloop.ai: produced a correct branching flow including a loop-back
        edge, which the BFS layout handled without infinite-looping.
      - **Actionable pattern templates** — Knowledge Brain's "Suggested
        templates" are now clickable; picking one calls
        `createProjectFromTemplate` and redirects straight into a new
        pre-seeded project, instead of being inert text.
      - **Command palette (Cmd+K)** (`command-palette.tsx`, mounted once in
        `app-sidebar.tsx` so it's global) — jump to Home/Research/Knowledge
        Brain/any project, create a new project, or (while on a project
        page) run that project's next pending specialist via a
        `?run=next` query param that `pipeline-view.tsx` picks up on mount.
      - **Shareable project HTML report** (`/project/[id]/report`) — a
        clean, chrome-free, print-friendly page bundling every completed
        specialist's output (reusing the existing stage-view components
        where possible) with a "Print / Save as PDF" button. Distinct from
        `/api/export`, which is a raw-JSON backup dump, not something meant
        for reading.
- [x] **Platform targeting + high-fidelity wireframes + app-wide visual
      refresh**, all built and verified against real data:
      - **`Project.platform` field** (`web | mobile | both`, default
        `both`) — additive column with a default, zero legacy-data risk
        (confirmed: existing projects got the default cleanly). Set at
        project creation (`new-project-dialog.tsx`), editable later
        (`project-header-menu.tsx`), and overridable per-run at the
        Wireframes stage itself (both places, per explicit instruction).
      - **Wireframes stage honors platform** — `web`/`mobile` generate only
        that device; `both` instructs the model to produce a desktop AND
        mobile variant of every screen. Verified live against Hackloop.ai
        with `platform: "both"`: 13 screens came back as 26, each with a
        matching desktop + mobile pair.
      - **Web/Mobile filter** in `wireframe-canvas.tsx` (segmented
        All/Web/Mobile control, only shown when a project actually has more
        than one device type) and the report page (screens grouped under
        "Web"/"Mobile" subheadings when both are present).
      - **High-fidelity wireframe rendering** — extracted
        `src/lib/wireframe-style.ts` as the single source of truth for
        element icon/style, shared by the editable canvas and the
        read-only report so they can't visually drift apart. Elements now
        render as a styled mock-up (gradient header/button, pill nav,
        shadowed cards, gradient image placeholders, dark footer bar)
        instead of flat gray boxes. Added `DeviceFrame` (exported from
        `wireframe-canvas.tsx`, reused by the report page): a browser-chrome
        frame (traffic-light dots + address bar) for desktop screens, a
        rounded phone frame for mobile. Deliberately still a styled
        auto-generated mock-up, not a drag/resize canvas — building a
        Figma-grade editor was already ruled out for this project (see
        PRD.md §4). SVG/PNG export needed no changes: it measures real DOM
        rects inside the unchanged `containerRef`, so the chrome (rendered
        outside that ref) doesn't affect exports.
      - **App-wide visual refresh** — richer, more saturated primary/accent
        OKLCH values in `globals.css` (was a near-grayscale palette), a new
        `--accent-warm` token, and real per-specialist colors (`chart-1..5`
        repurposed) instead of one indigo uniformly everywhere. The 9
        specialist cards in the pipeline grid and the home page's quick
        actions each got a distinct colored icon chip; added a small
        gradient brand mark to the sidebar header; cards get a hover
        lift+shadow instead of a flat color change.
      - **Real bug caught and fixed via live testing, not assumption**:
        passing lucide icon *components* as props from a Server Component
        (`page.tsx`) into a Client Component (`quick-action-card.tsx`)
        broke the home page with "Functions cannot be passed directly to
        Client Components" — confirmed via the actual dev server error.
        Fixed by passing pre-rendered `<Icon .../>` elements instead of
        bare component references, which Next.js RSC serialization does
        support.
      - Also hit the same known stale-Turbopack-cache issue from earlier
        this session (new exports not picked up by HMR) — cleared `.next`
        again, same fix as before.

## Recommended build order for the rest (per PRD.md §7)

1. ~~Research Engine as a standalone pre-project entry point~~ **done.**
2. ~~Expand specialist roster to 8 + open-ended menu~~ **done.**
3. ~~Design Studio: real visual wireframes + export~~ **done** (core case).
   Remaining from this item: responsive React prototype generation,
   accessibility audits — lower priority.
4. ~~Re-scope copilot to Knowledge Brain lookup~~ **done.**
5. ~~Personal Knowledge Brain v1~~ **done** (full-text search). True
   vector/RAG embeddings remain a later upgrade, not urgent.
6. **Next up:** Deploy to Vercel (owner's own account, already connected during
   development) — link the GitHub repo, set env vars (**including
   `APP_PASSWORD` — do not deploy without it**), deploy. Decide whether the
   deployed copy and local dev share one Supabase database (leaning yes,
   for simplicity) before doing this.

## Backlog (not started, lower priority than the above)

- [ ] Ollama installation + local model, as a genuinely zero-quota fallback
      for local dev (user opted to try OpenRouter first instead).

## Known constraints to keep respecting

- **$0 recurring cost.** Every new dependency needs a workable free tier or
  must run locally.
- **Single user.** Don't add multi-user accounts/signup. A lightweight
  single shared-password gate exists (`APP_PASSWORD`) for when this is
  publicly deployed — that's a deterrent gate, not a real auth system, and
  that's an intentional, correct scope call for this project.
- **Owner's own accounts only** for anything cloud (GitHub, Vercel,
  Supabase) — never a shared or company account.
- Don't do manual browser UI testing on the owner's behalf — verify via API
  calls, type-checking, and direct DB checks, and say plainly what wasn't
  visually verified.
