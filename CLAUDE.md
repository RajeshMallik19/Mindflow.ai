# MindFlow AI — instructions for Claude Code

Read `.docs/TASKS.md` first to see what's done and what's next. Full detail
lives in `.docs/`: `PRD.md` (what and why), `ARCHITECTURE.md` (stack and
patterns), `DATAMODEL.md` (schema), `API_SPEC.md` (routes + integrations),
`UI_UX_SPEC.md` (pages and interactions).

(Note: this project does not use `.cursorrules` — that's a Cursor-specific
file and has no effect in Claude Code. This file is the equivalent.)

## Hard constraints — do not violate these

- **$0 recurring cost.** No paid APIs, no paid hosting, no cloud VM. Every
  dependency needs a real free tier or must run locally.
- **Single user.** No multi-user accounts/signup, ever. A lightweight
  single shared-password gate exists for public deployment (`APP_PASSWORD`,
  see `src/proxy.ts`) — that's a deterrent, not a real auth system, and is
  the deliberately correct scope for this project. Don't build anything
  beyond it (no OAuth, no user table, no sessions-per-user).
- **Owner's own accounts only** for anything cloud (GitHub, Vercel,
  Supabase) — never a shared, third-party, or company account. This app is
  explicitly meant to survive the owner leaving their job.
- Never commit `.env` or any secret. It's already gitignored — keep it that
  way.

## Working style

- Don't do manual browser UI testing on the owner's behalf — they test
  interactions themselves. Verify your work via API calls, type-checking
  (`npx tsc --noEmit`), lint (`npm run lint`), the Vitest suite (`npm test`),
  and direct DB queries, and say plainly what you did and didn't verify.
- Before changing any stored-artifact shape, check whether real projects
  already have data in the old shape (query the live DB) — this has
  happened twice already (research_brief, wireframes) and both times caused
  a real crash that was only caught by checking first. Add a back-compat
  normalizer, not just a type change.
- Before trusting a new AI provider/model, test it directly against its raw
  API first (see `.docs/API_SPEC.md` for a real incident where a model's
  free-tier quota was silently exhausted and looked like a broken app).
- Run `npm run build` locally before every deploy, not just `tsc`/lint/
  `next dev`. `next dev` does not catch Cache Components prerendering
  errors (a page awaiting `params`/`searchParams`/`cookies()` outside
  Suspense) — this caused a real failed first deployment that `tsc`, lint,
  and all of dev-mode testing missed entirely.
- Discuss significant architecture changes before scaffolding them; once
  agreed, execute without re-confirming every step.
- Don't propose: fine-tuning a model on the owner's personal data (use RAG
  instead), a Grok-Bot-style always-on cloud VM with GUI automation, or
  building an in-app Figma-grade canvas. These were already considered and
  rejected — see `.docs/PRD.md` section 4 for why.
