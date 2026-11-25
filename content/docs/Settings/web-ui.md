---
weight: 4
title: "Web UI"
description: "Mule's embedded React web interface: the Dashboard, Workflow Builder, Jobs live view, WASM editor, and how the SPA is served from the Go binary"
tags: ["settings", "web-ui", "frontend", "ui"]
icon: "article"
date: "2026-11-25T00:00:00-05:00"
lastmod: "2026-11-25T00:00:00-05:00"
toc: true
---

Mule ships with a single-page web application for managing providers, agents,
workflows, WASM modules, and jobs. The UI is a React SPA compiled into the
Mule binary itself — there is no separate web server or static hosting to
configure. Open `http://localhost:8140/` (or wherever Mule listens) and the
UI is there.

## How It Is Served

The frontend lives in the Mule repository under `frontend/` (React 18,
Vite, React Router, React Bootstrap, Monaco editor). `npm run build` emits a
`build/` directory that is embedded into the Go binary with `go:embed`
(`internal/frontend/embed.go`). The API server mounts the SPA as a catch-all
route:

- Requests for built assets (JS/CSS under `/assets/…`) are served directly.
- Any other path that isn't an API route (`/api/v1/*`, `/v1/*`, `/health`,
  `/ws`, `/voice/*`) falls back to `index.html`, so browser-side routing
  works when you deep-link or refresh, e.g. `http://localhost:8140/jobs`.

Because it is compiled in, the UI version always matches the Mule binary —
you can never get a stale UI from a cached deployment.

## Pages

The top navigation exposes nine pages:

| Route | Page | What it does |
|---|---|---|
| `/` | **Dashboard** | Two execution consoles: *Execute Agent / Workflow* and *Execute WASM Module*, each with its own *Execution History* panel. Quick way to fire a one-off run without creating a job via the API. |
| `/workflows` | **Workflow Builder** | Create workflows and manage their steps. Steps are reordered by drag-and-drop (`@dnd-kit`); reordering persists through the step reorder API. |
| `/agents` | **Agents** | CRUD for agents: name, provider/model, system prompt, and tool/skill assignments. |
| `/providers` | **Providers** | CRUD for AI providers (base URL, API key). Keys are stored encrypted at rest. |
| `/skills` | **Skills** | CRUD for agent skills. |
| `/wasm-modules` | **WASM Modules** | List, upload, and manage WASM modules usable as workflow steps. |
| `/wasm-editor` | **WASM Editor** | Full code editor for WASM modules: Monaco editor with the module's source, one-click **compile** (server-side `go build` with `GOOS=wasip1 GOARCH=wasm` — Go source is the only supported language today), and an AI chat side panel — pick an agent, describe what you want, and insert the generated code into the editor. |
| `/jobs` | **Jobs** | Job queue with status/search/workflow filters, pagination, per-step drill-down (status badges plus input/output data JSON), and live updates over WebSocket (see below). |
| `/settings` | **Settings** | Edit the key/value `settings` table, including the *Tool Execution Configuration* card. See [General Settings](/docs/settings/general). |

> **Note:** A `/tools` route exists in the router but is not in the
> navigation and currently renders the Skills page. Tools are legacy —
> prefer [skills](/docs/settings/skills).

## Live Job Updates

The Jobs page opens a WebSocket to `ws(s)://<host>/ws` and subscribes to
`job_update` events, so job status changes appear without refreshing. A
connection indicator reflects the socket state; if the socket drops the page
still works via normal API polling on interaction.

`/ws` is one of the deliberately unauthenticated endpoints (WebSocket
upgrades cannot carry a Bearer header), matching the rest of the UI shell.
See [Authentication & Tenancy](/docs/settings/authentication) for the full
auth matrix.

## API Keys and the UI

The embedded UI calls `/api/v1/*` **without** an `Authorization` header —
there is no login form and no key entry field. Consequences:

- **Local development**: run Mule with `MULE_NO_AUTH=1` and the UI works
  fully (every request is treated as the synthetic admin).
- **Auth-enabled deployments**: UI management calls return `401`. Manage
  resources with `curl`/your own client using an API key, or keep the UI on
  a trusted network behind `MULE_NO_AUTH`. There is currently no
  UI-side login flow.

## Developing the Frontend

The frontend is a standard Vite app (migrated off Create React App; the
build output directory is still `build/` so the Go embed path stays stable:

```bash
cd frontend
npm install
npm run dev      # Vite dev server on :3000
```

The dev server proxies `/api` and `/ws` to a local Mule instance on
`:8080`, so run the Go server on that port (or adjust `vite.config.js`).
For tests, `npm test` runs Vitest with jsdom. Build output (`frontend/build/`)
is git-ignored; packaging copies it into `internal/frontend/build/` for the
`go:embed` step (see `rebuild-local.sh` locally and the multi-stage
`Dockerfile` in CI), so rebuild the frontend before rebuilding the Go binary
after UI changes.

## Troubleshooting

### Blank page at `/`

The UI is served from the embedded build. A minimal *fallback* page is
served instead of the app when the binary was built without a real
`build/` payload (typical for CI or partial source trees). Rebuild the
frontend (`npm run build` in `frontend/`) and then rebuild the Go binary.

### "Connection lost" banner on the Jobs page

The `/ws` socket dropped. The Jobs list still loads over REST; check that a
reverse proxy in front of Mule forwards WebSocket upgrades (`Upgrade`/
`Connection` headers) if you access it through one.

### Everything 401s in the UI

Expected when auth is enabled — see [API Keys and the UI](#api-keys-and-the-ui).

## Related Documentation

- [Getting Started](/docs/getting-started) — first run with the web UI
- [Authentication & Tenancy](/docs/settings/authentication) — auth matrix and API keys
- [Workflows](/docs/settings/workflows) — what the Workflow Builder edits
- [WASM Modules](/docs/advanced/wasm-modules) — the module lifecycle behind the WASM Editor
