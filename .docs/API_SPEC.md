# API Spec

## App routes

### `POST /api/orchestrator`

Routes a task to a subagent, streams the AI response, persists the
conversation. Body:

```json
{ "task": "string, required", "projectId": "string, optional", "conversationId": "string, optional" }
```

Response: `application/x-ndjson` stream, one JSON object per line:

```json
{"type":"meta","conversationId":"...","subagent":{"id":"...","name":"...","title":"..."}}
{"type":"chunk","text":"..."}        // repeated as tokens arrive
{"type":"done"}
{"type":"error","error":"..."}       // instead of "done", if something failed
```

The client (`copilot-panel.tsx`) reads this stream line-by-line and appends
each chunk to the in-progress assistant message. **If you change this
format, update the client's parser in the same commit** — the two are
tightly coupled and not type-checked against each other.

### `POST /api/artifacts`

Upserts an artifact for a project. Body:

```json
{ "projectId": "string", "type": "string", "title": "string", "content": "string" }
```

Behavior: if an artifact of that `type` already exists for the project, its
*old* content is copied into `artifact_versions` before being overwritten
(so saves are non-destructive). Otherwise a new artifact is created.

### Server action: `createProject` (`src/app/actions.ts`)

Not a route — a Next.js server action called directly from
`new-project-dialog.tsx`'s form. Creates a project, revalidates `/`.

## Third-party integrations

### AI providers (`src/lib/ai-provider.ts`)

Selected via `AI_PROVIDER` env var. All implement `generate()` (one-shot)
and `stream()` (chunked).

| Provider | `AI_PROVIDER` value | Needs | Notes |
|---|---|---|---|
| Gemini | `gemini` (default) | `GEMINI_API_KEY`, `GEMINI_MODEL` | Google's free tier. **Known incident:** `gemini-3.8-flash`'s free tier caps at 20 requests/day — this was silently exhausted and looked like a broken app. Currently set to `gemini-3.5-flash-lite`, which has a much higher free quota. The quota is per-model, not account-wide, so switching models resets the allowance. |
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Single key, many providers' models, several genuinely free (`:free` suffix). **Caveat:** free models share an upstream pool across all OpenRouter users — popular ones (e.g. `google/gemma-4-31b-it:free`, which proxies through Google AI Studio's own free tier) get rate-limited easily. `nvidia/nemotron-3.5-lightning:free` tested reliably with a 1M context window. |
| Ollama | `ollama` | `OLLAMA_HOST` (default `http://localhost:11434`), `OLLAMA_MODEL` (default `llama3.2:3b`) | Fully local, genuinely zero quota — but needs Ollama installed and a model pulled, and is CPU-bound without a GPU. Not yet installed on this machine. Cannot work once the app is deployed to Vercel (no persistent local machine there) — local dev use only. |
| Echo | `echo` | nothing | Stub that echoes the prompt back. Zero cost, zero AI, useful for testing the pipeline wiring itself. |

**Always test a model directly against the raw API before assuming it works**
(see the quota incident above) — a 200-looking integration can still be
silently capped. A quick way: hit the provider's endpoint directly with
`curl`/`Invoke-WebRequest` using the same key/model before trusting the app.

### Database: Supabase (Postgres)

Connection via `DATABASE_URL` in `.env` (pooled connection string, port
5432). Never commit this — it contains the database password.

### Planned, not yet integrated

- **Figma REST API / plugin** — for pushing Design Agent output to a real
  Figma file. Deliberately *not* an in-app canvas (see PRD.md, section 4).
- **Vercel** — for deployment. The Vercel MCP connection used during
  development is tied to a specific Claude session/account and is **not**
  a credential the app itself uses — deployment should go through the
  owner's own Vercel account directly (CLI or dashboard), linked to the
  GitHub repo.

## Secrets

All of the above live in `.env`, which is gitignored and **must never be
committed**. If you're reading this after losing access to a machine that
had `.env` on it, you'll need to regenerate: a new Supabase connection
string (if rotated), a new Gemini key (aistudio.google.com), a new
OpenRouter key (openrouter.ai/settings/keys).
