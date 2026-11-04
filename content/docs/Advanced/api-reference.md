---
weight: 13
title: "HTTP API Reference"
description: "Complete reference for Mule's REST surface: the OpenAI-compatible /v1 endpoints, all /api/v1 management resources, and the unauthenticated /health, /ws, and /voice routes"
tags: ["api", "endpoints", "reference", "rest"]
icon: "article"
date: "2026-11-04"
lastmod: "2026-11-04T00:00:00-05:00"
toc: true
---

Mule's API server exposes three classes of HTTP routes, all served from the
same listener (the binary defaults to `:8080`; the shipped `docker-compose.yml`
publishes it as `8140:8080`, so `http://localhost:8140` in the examples below):

| Class | Prefix | Auth | Purpose |
|---|---|---|---|
| OpenAI-compatible | `/v1/*` | **Yes** | Model catalog + chat completions (drop-in for OpenAI SDKs) |
| Management | `/api/v1/*` | **Yes** | CRUD for providers, tools, skills, agents, workflows, jobs, wakes, policies, WASM modules, settings, memory config |
| Infrastructure | `/health`, `/ws`, `/voice/{job_id}/*`, frontend catch-all | No | Health probes, WebSocket events, per-call voice audio, web UI shell |

Authentication uses `Authorization: Bearer sk_mule_<hex>` on every `/v1/*` and
`/api/v1/*` request. See [Authentication & Tenancy](/docs/settings/authentication/)
for key minting, the `MULE_NO_AUTH=1` dev mode, and restricted keys. Routes are
defined in `cmd/api/server.go`; the auth middleware lives in
`internal/api/auth.go`.

## OpenAI-compatible surface (`/v1`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/models` | List models across configured providers |
| `POST` | `/v1/chat/completions` | Chat completion (OpenAI request/response shape) |

These endpoints let any OpenAI-compatible client talk to Mule. A restricted
API key may still **execute** workflows through this surface — restricted keys
are only blocked from writes under `/api/v1/agents`, `/workflows`, `/jobs`,
and `/policies`.

## Providers (`/api/v1/providers`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/providers` | List AI providers |
| `POST` | `/api/v1/providers` | Create a provider |
| `GET` | `/api/v1/providers/{id}` | Get a provider |
| `PUT` | `/api/v1/providers/{id}` | Update a provider |
| `DELETE` | `/api/v1/providers/{id}` | Delete a provider |
| `GET` | `/api/v1/providers/{id}/models` | List models reported by the provider |

## Tools (`/api/v1/tools`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/tools` | List tools |
| `POST` | `/api/v1/tools` | Create a tool |
| `GET` | `/api/v1/tools/{id}` | Get a tool |
| `PUT` | `/api/v1/tools/{id}` | Update a tool |
| `DELETE` | `/api/v1/tools/{id}` | Delete a tool |

Tools are global (shared across users) by design.

## Skills (`/api/v1/skills`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/skills` | List skills |
| `POST` | `/api/v1/skills` | Create a skill |
| `GET` | `/api/v1/skills/{id}` | Get a skill |
| `PUT` | `/api/v1/skills/{id}` | Update a skill |
| `DELETE` | `/api/v1/skills/{id}` | Delete a skill |

Skills are assigned to agents through the agent-skills routes below. See
[Skills](/docs/settings/skills/).

## Agents (`/api/v1/agents`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/agents` | List agents (owner-scoped) |
| `POST` | `/api/v1/agents` | Create an agent — **restricted keys blocked** |
| `GET` | `/api/v1/agents/{id}` | Get an agent |
| `PUT` | `/api/v1/agents/{id}` | Update an agent — **restricted keys blocked** |
| `DELETE` | `/api/v1/agents/{id}` | Delete an agent — **restricted keys blocked** |
| `GET` | `/api/v1/agents/{id}/tools` | List tools assigned to the agent |
| `POST` | `/api/v1/agents/{id}/tools` | Assign a tool to the agent |
| `DELETE` | `/api/v1/agents/{id}/tools/{toolId}` | Remove a tool from the agent |
| `GET` | `/api/v1/agents/{id}/skills` | List skills assigned to the agent |
| `PUT` | `/api/v1/agents/{id}/skills` | Replace the agent's skill assignment set |
| `DELETE` | `/api/v1/agents/{id}/skills/{skillId}` | Remove a skill from the agent |

## Workflows (`/api/v1/workflows`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/workflows` | List workflows (owner-scoped) |
| `POST` | `/api/v1/workflows` | Create a workflow — **restricted keys blocked** |
| `GET` | `/api/v1/workflows/{id}` | Get a workflow |
| `PUT` | `/api/v1/workflows/{id}` | Update a workflow — **restricted keys blocked** |
| `DELETE` | `/api/v1/workflows/{id}` | Delete a workflow — **restricted keys blocked** |
| `GET` | `/api/v1/workflows/{id}/steps` | List workflow steps |
| `POST` | `/api/v1/workflows/{id}/steps` | Create a step |
| `POST` | `/api/v1/workflows/{id}/steps/reorder` | Reorder steps |
| `PUT` | `/api/v1/workflows/{workflow_id}/steps/{step_id}` | Update a step |
| `DELETE` | `/api/v1/workflows/{workflow_id}/steps/{step_id}` | Delete a step |

## Jobs (`/api/v1/jobs`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/jobs` | List jobs (owner-scoped) |
| `POST` | `/api/v1/jobs` | Submit a job — **restricted keys blocked** |
| `GET` | `/api/v1/jobs/{id}` | Get a job |
| `DELETE` | `/api/v1/jobs/{id}` | Cancel a job — **restricted keys blocked** |
| `GET` | `/api/v1/jobs/{id}/steps` | List a job's step history |

## Wakes (`/api/v1/wakes`)

The wake engine stores scheduled/event-triggered proactivity (cron, webhook,
event, and job-outcome wakes). See [Wakes](/docs/advanced/wakes/).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/wakes` | List wakes (owner-scoped) |
| `POST` | `/api/v1/wakes` | Create a wake |
| `POST` | `/api/v1/wakes/fire` | Fire wake(s) immediately |
| `POST` | `/api/v1/wakes/pause` | Scheduler kill-switch: bulk-pause |
| `GET` | `/api/v1/wakes/activity` | Recent wake activity feed |
| `GET` | `/api/v1/wakes/{id}` | Get a wake |
| `PATCH` | `/api/v1/wakes/{id}` | Update a wake (enable/disable, edit) |
| `DELETE` | `/api/v1/wakes/{id}` | Delete a wake |
| `GET` | `/api/v1/wakes/{id}/log` | Per-wake fire log |

> Static segments (`/fire`, `/pause`, `/activity`) are registered before the
> `{id}` routes because the router matches in registration order.

## Policies (`/api/v1/policies`)

The policy engine gates forge tool calls with deterministic
allow/deny/ask verdicts. See [Policy Engine](/docs/advanced/policy-engine/).

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/policies` | List policy rules (owner-scoped) |
| `POST` | `/api/v1/policies` | Create a rule — **restricted keys blocked** |
| `POST` | `/api/v1/policies/evaluate` | Synchronous before_tool decision query — *open to restricted keys* |
| `POST` | `/api/v1/policies/memo` | Record a human approved/denied verdict — *open to restricted keys* |
| `POST` | `/api/v1/policies/proposals` | Agent-drafted rule proposal — *open to restricted keys* |
| `POST` | `/api/v1/policies/proposals/{id}/approve` | Approve a proposal (non-restricted key required) |
| `GET` | `/api/v1/policies/{id}` | Get a rule |
| `PATCH` | `/api/v1/policies/{id}` | Update a rule — **restricted keys blocked** |
| `DELETE` | `/api/v1/policies/{id}` | Delete a rule — **restricted keys blocked** |

The three exempt POST routes are deliberate: asking about an action,
recording a decision, and drafting a proposal are not policy mutations.

## WASM modules (`/api/v1/wasm-modules`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/wasm-modules` | List modules (global) |
| `POST` | `/api/v1/wasm-modules` | Create a module |
| `POST` | `/api/v1/wasm-modules/compile` | Compile source to WASM |
| `POST` | `/api/v1/wasm-modules/test` | Test-compile without persisting |
| `GET` | `/api/v1/wasm-modules/example` | Fetch the example module source |
| `GET` | `/api/v1/wasm-modules/{id}` | Get a module |
| `PUT` | `/api/v1/wasm-modules/{id}` | Update a module |
| `DELETE` | `/api/v1/wasm-modules/{id}` | Delete a module |
| `GET` | `/api/v1/wasm-modules/{id}/source` | Get stored source |
| `PUT` | `/api/v1/wasm-modules/{id}/source` | Update stored source (hot-reload) |

See [Building a WASM Module](/docs/tutorials/building-wasm-module/).

## Settings & memory config

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/settings` | List all settings (global) |
| `GET` | `/api/v1/settings/{key}` | Get one setting |
| `PUT` | `/api/v1/settings/{key}` | Update one setting |
| `GET` | `/api/v1/memory-config` | Get RAG/memory configuration |
| `PUT` | `/api/v1/memory-config` | Update RAG/memory configuration |

## Unauthenticated routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/health` | Returns `200 OK` with body `OK`; used by container health probes |
| `GET` | `/ws` | WebSocket event stream (job/agent events). No Bearer header on WS upgrades |
| `GET/POST` | `/voice/{job_id}/in`, `/voice/{job_id}/out` | Voice-loop per-call audio sockets; the 128-bit job id is the capability |
| `GET` | `/*` (catch-all) | Serves the embedded web frontend |

## Quick example

```bash
# List your agents
curl -s http://localhost:8140/api/v1/agents \
  -H "Authorization: Bearer sk_mule_<hex>"

# Chat completion via the OpenAI-compatible surface
curl -s http://localhost:8140/v1/chat/completions \
  -H "Authorization: Bearer sk_mule_<hex>" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"ping"}]}'
```
