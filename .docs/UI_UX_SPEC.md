# UI/UX Spec

## Visual language

- Tailwind CSS v4 utility classes directly in components — no separate theme
  file beyond what shadcn's `init` generated into `globals.css`.
- shadcn/ui components are built on **Base UI**, not Radix. This matters for
  anyone extending a component: use the `render` prop to swap the underlying
  element, not `asChild`:
  ```tsx
  // Correct (Base UI):
  <DialogTrigger render={<Button variant="outline" />}>Create project</DialogTrigger>
  // Wrong (Radix pattern — will not type-check here):
  <DialogTrigger asChild><Button>Create project</Button></DialogTrigger>
  ```
- Light/dark handled via Tailwind's `dark:` variants throughout; no manual
  theme toggle built yet (follows OS preference by default via Tailwind's
  standard behavior).
- Zinc as the neutral palette (`zinc-50` through `zinc-950`), kept minimal —
  this is a personal tool, not a branded product.

## Layout: the three-column workspace shell

Every page (`/` and `/project/[id]`) uses the same shell:

```
┌──────────┬─────────────────────────────┬───────────────┐
│          │                             │               │
│  Sidebar │      Main content area      │  AI Copilot   │
│  (nav +  │   (dashboard, or a React    │  (chat panel, │
│ projects │    Flow canvas on a         │   always      │
│  list)   │    project page)            │   visible)    │
│          │                             │               │
└──────────┴─────────────────────────────┴───────────────┘
```

The copilot panel is **not** a modal or collapsible drawer — it's always
present, because the product thesis is that the AI is a constant work
partner, not a feature you open and close.

## Pages

### Home (`/`)

- Welcome header.
- "Quick actions" cards (currently static labels — not yet wired to actually
  start a Research/Product-Thinking/Design flow; clicking them does nothing
  yet).
- "Recent projects" list, each a clickable card linking to `/project/[id]`.
- "Create project" button opens a dialog (name + description), submits via
  the `createProject` server action.
- Sidebar and recent-projects list are server components wrapped in
  `<Suspense>` with skeleton fallbacks, so the shell paints immediately while
  the DB query resolves.

### Project workspace (`/project/[id]`)

- Header: project name + description.
- Main area: the React Flow diagram editor (see below).
- Same sidebar + copilot panel as home.
- 404s (via `notFound()`) if the project id doesn't exist.

## The diagram editor (React Flow)

- Three node types: **Start** (green border), **Action** (neutral),
  **Decision** (amber border, two outgoing handles labeled yes/no).
- Toolbar: "+ Start" / "+ Action" / "+ Decision" buttons, each prompting
  (via a plain `window.prompt`) for a label, then placing the node at a
  semi-random position.
- Double-click a node to rename it (also via `window.prompt` — intentionally
  minimal, not a rich inline editor).
- Drag between node handles to connect them.
- "Save" button POSTs the current nodes/edges JSON to `/api/artifacts` as a
  `user_flow` artifact; shows a "Saved at HH:MM:SS" timestamp on success.
- On page load, if a `user_flow` artifact already exists for the project,
  its saved nodes/edges are restored as the initial canvas state.

This is intentionally minimal (no multi-select, no copy/paste, no
undo/redo) — it's a working proof of the "generate structured data, render
it visually, let the user edit it" pattern from PRD.md, not a finished
diagramming tool.

## The copilot panel

- Message list (user messages dark-filled, assistant messages
  light-filled), each assistant message labeled with which subagent
  answered (e.g. "USER STORIES MAKER") once the `meta` stream event arrives.
- Streams tokens in as they arrive (uses `flushSync` so partial text renders
  immediately rather than batching).
- Textarea + Send button; Enter sends, Shift+Enter inserts a newline.
- On error, the error message is appended to whatever partial content had
  already streamed in, rather than replacing it — so a failure never erases
  useful partial output.

## User journeys (current, working end-to-end)

1. **Create and chat:** open `/` → click "Create project" → fill
   name/description → land back on `/` with the new project listed → type a
   task into the copilot (e.g. "give me user stories for X") → see it
   routed to the correct subagent and stream back a real answer.
2. **Diagram a flow:** open a project → add Start/Action/Decision nodes →
   connect them → rename a node → Save → reload the page → confirm the
   diagram is still there exactly as left.

## Not yet designed

- The "gossip mode" vs. plain-explanation toggle for the Research Agent
  (an original, vivid requirement from the project's earliest brainstorm —
  don't let it quietly drop from scope).
- Any UI for browsing an artifact's version history (the data model
  supports it; no screen reads `artifact_versions` yet).
- Figma push UI (a button/flow to send a Design Agent output to a real
  Figma file).
