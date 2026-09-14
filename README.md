# ScopePilot

Turn messy freelance/client briefs into a structured project scope.

Paste a brief, generate a 13-section scope (summary, goals, target users, assumptions, missing
information, in scope, out of scope, deliverables, milestones, timeline, estimate range, risks,
next steps), edit any section inline, then save it, copy it as Markdown, or download it.

## Stack

- React 19 + TanStack Start (Vite) — file-based routing, server functions
- Tailwind CSS v4 (design tokens in `src/styles.css`)
- Lovable Cloud (Postgres, powered by Supabase) for saved scopes
- Lovable AI Gateway for the scoping model — the API key stays server-side

## Pages

| Route    | Purpose                                                        |
| -------- | -------------------------------------------------------------- |
| `/`      | Paste client brief, "Generate scope", "Try sample brief"        |
| `/scope` | Editable scope sections + Save / Copy MD / Download / Regenerate |
| `/saved` | Saved scopes with title, date and an Open button                |

`/scope?id=<uuid>` opens a saved scope; without an `id` it shows the scope generated in the
current browser session.

## Data model

Table `projects`:

| Column       | Type        |
| ------------ | ----------- |
| `id`         | uuid (pk)   |
| `title`      | text        |
| `raw_brief`  | text        |
| `scope_json` | jsonb       |
| `created_at` | timestamptz |

No auth is required for this MVP: row-level security is on and policies allow public read/write.
Add sign-in and per-user policies before putting real client data in it.

## AI call

The model is called from a server function (`src/lib/scope.functions.ts`) — never from the
browser — with this system prompt:

> You are a senior project scoping assistant. Given a messy client brief, return only valid JSON
> with fields: summary, goals, target_users, assumptions, missing_information, in_scope,
> out_of_scope, deliverables, milestones, timeline, estimate_range, risks, next_steps. If
> information is missing, list it under missing_information. Do not invent budget or dates unless
> clearly implied. Be specific and concise.

The response is parsed and coerced into the exact scope shape in `src/lib/scope.ts`, so a stray
string-instead-of-array never breaks the UI.

## Environment variables

Created and injected automatically by Lovable Cloud (`.env`, not committed):

| Variable                        | Where it is read     | Purpose                        |
| ------------------------------- | -------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`             | browser              | database URL                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser              | public database key            |
| `SUPABASE_URL`                  | server               | database URL (server side)     |
| `LOVABLE_API_KEY`               | server functions only | AI gateway auth — never expose |

If you run this outside Lovable and want to call OpenAI directly, swap the `fetch` URL, header and
model in `src/lib/scope.functions.ts` and read your own key from `process.env` **inside** the
handler.

## Run locally

```bash
bun install      # or: npm install
bun run dev      # or: npm run dev
```

The dev server prints a local URL (default `http://localhost:8080`).

Other scripts:

```bash
bun run build    # production build
bun run preview  # preview the production build
bun run lint     # eslint
```

## Project layout

```
src/
  components/AppShell.tsx      shared header, nav and background
  components/ScopeSkeleton.tsx loading skeleton
  lib/scope.ts                 scope shape, section list, Markdown export, sample brief
  lib/scope.functions.ts       server function that calls the AI model
  lib/projects.ts              database reads/writes for saved scopes
  lib/draft.ts                 session-scoped unsaved scope
  routes/index.tsx             home
  routes/scope.tsx             results
  routes/saved.tsx             saved projects
  styles.css                   design tokens
```
