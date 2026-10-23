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
- **Single user, no auth/signup.** There is exactly one user, forever.
- **Owner's own accounts only** for anything cloud (GitHub, Vercel,
  Supabase) — never a shared, third-party, or company account. This app is
  explicitly meant to survive the owner leaving their job.
- Never commit `.env` or any secret. It's already gitignored — keep it that
  way.

## Working style

- Don't do manual browser UI testing on the owner's behalf — they test
  interactions themselves. Verify your work via API calls, type-checking
  (`npx tsc --noEmit`), lint (`npm run lint`), and direct DB queries, and
  say plainly what you did and didn't verify.
- Before trusting a new AI provider/model, test it directly against its raw
  API first (see `.docs/API_SPEC.md` for a real incident where a model's
  free-tier quota was silently exhausted and looked like a broken app).
- Discuss significant architecture changes before scaffolding them; once
  agreed, execute without re-confirming every step.
- Don't propose: fine-tuning a model on the owner's personal data (use RAG
  instead), a Grok-Bot-style always-on cloud VM with GUI automation, or
  building an in-app Figma-grade canvas. These were already considered and
  rejected — see `.docs/PRD.md` section 4 for why.
