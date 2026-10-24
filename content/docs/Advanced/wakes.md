---
weight: 7
title: "Wakes"
description: "The wake engine: cron, webhook, event, and job-triggered proactivity for agents and workflows"
icon: "article"
date: "2026-10-24"
lastmod: "2026-10-24T00:00:00-05:00"
toc: true
---

A **wake** is Mule's proactivity primitive: a stored condition (a cron
schedule, a webhook match, an event, a job outcome) plus a **target** (a Mule
workflow or a forge agent conversation) plus a **prompt template**. The wake
scheduler fires due wakes automatically, so agents can act on schedules and
events instead of only replying to requests.

Wakes are owner-scoped: every key can list and manage its own wakes. All
endpoints require `Authorization: Bearer sk_mule_<hex>`.

## Wake Kinds

| Kind | Fires when | Spec fields |
|------|-----------|-------------|
| `cron` | A 5-field cron expression matches (UTC) | `expr` (required) |
| `webhook` | `POST /api/v1/wakes/fire` with matching source/tag | `source` (required), `tag` (optional) |
| `event` | An event of the given type is published | `type` (required, e.g. `job.completed`) |
| `job` | A workflow job reaches a terminal status | `workflow_id`, `status` (`completed` \| `failed`) |
| `memory` | A forge memory watch matches an episode | `agent_id`, `predicate` (forwarded by the memory-trigger lane) |
| `agent_signal` | Reserved | `agent_id`, `kinds[]` (registered and validated; not yet fired) |

The `memory` kind is fired only by the in-process memory-trigger forwarder
(polling forge's trigger queue every 30 s when `FORGE_TRIGGER_AGENTS` is
configured); it is deliberately inert in the cron/webhook/event lanes.
`agent_signal` wakes are stored but never fire.

## Targets

Every wake needs exactly one target:

```json
{ "workflow_id": "wf-uuid" }
```

or a forge conversation:

```json
{ "forge_conversation": { "forge_url": "https://forge.example", "api_key": "...", "agent_id": "agent-uuid" } }
```

(`conversation_id` may be used instead of `agent_id`.)

- **Workflow target**: the rendered prompt is submitted as a Mule job with
  input `{prompt, payload}`. The resulting `job_id` is recorded in the wake log.
- **Forge target**: the rendered prompt (prefixed `[mule wake <id>] `) is
  posted to the conversation fire-and-forget.

## Prompt Templates

`prompt_template` is a Go `text/template` rendered over the fire payload:

```
{{.payload.pull_request.title}} needs review (wake {{.wake_name}}, source {{.source}})
```

Available keys: `wake_id`, `wake_name`, `kind`, `source`, `payload`,
`fired_at`. Missing keys are a **hard error** — a typo in the template fails
the fire and shows up in the wake log rather than silently rendering nothing.

## Cron Expressions

Cron uses a strict 5-field subset (minute hour day-of-month month
day-of-week), matched in **UTC**. Supported per field: `*`, `*/n`, `a`,
`a-b`, and comma-separated lists of these. Day-of-week is 0–6 (0 = Sunday;
`7` is not accepted). `?`, `L`, `W`, month/weekday names, and `a-b/n` are not
supported. All matching is minute-granular and the scheduler scans every
30 seconds, so a cron wake fires at most once per due minute.

## Scheduling Behavior

- **Scan lane**: every 30 s, enabled cron wakes with `next_due_at <= now`
  fire. Wakes that came due while Mule was down fire once on startup
  (catch-up).
- **Cadence always advances**: a cron wake moves to its next slot on
  success, on a rate-limited drop, and on a failed dispatch — a broken wake
  can never hot-loop the scheduler.
- **Failure backoff**: consecutive failed dispatches push the next slot to at
  least 60 s, 120 s, 240 s, … out, capped at 1 hour. Success resets it.
- **Rate limit**: each wake has `rate_limit_per_hour` (default 24). Fires
  beyond the limit are dropped and logged with `error: "rate_limited"`.
- **NULL `next_due_at` adoption**: cron wakes inserted outside the API
  (direct SQL, restores) are given their next slot automatically on the
  next scan rather than sitting unfired forever.

## API

### CRUD

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/api/v1/wakes` | List your wakes |
| `POST` | `/api/v1/wakes` | Create; validates kind/spec/target and cron expr |
| `GET` | `/api/v1/wakes/{id}` | Fetch one wake |
| `PATCH` | `/api/v1/wakes/{id}` | Partial update (re-validates cron expr) |
| `DELETE` | `/api/v1/wakes/{id}` | Delete (cascades its log) |
| `GET` | `/api/v1/wakes/{id}/log` | Last 100 fire records |

Create example — a nightly heartbeat into a forge agent conversation:

```bash
curl -X POST http://localhost:8140/api/v1/wakes \
  -H "Authorization: Bearer sk_mule_..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nightly-heartbeat",
    "kind": "cron",
    "spec": { "expr": "0 3 * * *" },
    "target": { "forge_conversation": {
        "forge_url": "https://forge.example",
        "api_key": "...",
        "agent_id": "agent-uuid" } },
    "prompt_template": "Heartbeat {{.fired_at}}: summarize anything urgent and post a short note.",
    "rate_limit_per_hour": 4
  }'
```

The response echoes the stored wake including the computed `next_due_at` for
cron wakes.

### External Fire Ingress

```bash
curl -X POST http://localhost:8140/api/v1/wakes/fire \
  -H "Authorization: Bearer sk_mule_..." \
  -H "Content-Type: application/json" \
  -d '{ "kind": "webhook", "source": "github", "event_tag": "push",
        "payload": { "pull_request": { "title": "Fix flaky test" } } }'
```

- `kind: "webhook"` matches `webhook` wakes by `source` (and `tag` when the
  wake sets one).
- `kind: "event"` — `source` carries the event **type** and matches `event`
  wakes by `spec.type`.
- Response: `{"fired": N, "results": [...]}` with one result per matched wake
  (`ok`, `job_id`, `rate_limited`, `error`).

Any valid API key may call the fire endpoint — it is an ingress, not a
mutation, and matches fleet-wide enabled wakes.

### Kill Switch and Activity Feed

```bash
# Bulk-pause/resume all wakes targeting one forge agent
curl -X POST http://localhost:8140/api/v1/wakes/pause \
  -H "Authorization: Bearer sk_mule_..." \
  -d '{ "agent_id": "agent-uuid", "paused": true }'

# Recent fire activity (newest first)
curl -H "Authorization: Bearer sk_mule_..." \
  "http://localhost:8140/api/v1/wakes/activity?since=2026-10-23T00:00:00Z&limit=50"
```

`/wakes/activity` defaults to the last 24 hours, limit 50 (max 100). It
returns `wake_id`, `name`, `kind`, `fired_at`, `job_id`, `ok`, and `error` —
the same audit trail the wake log keeps per wake.

## Job and Event Wakes

`job` wakes fire when a specific workflow's job completes or fails; Mule's
job engine publishes `job.completed` / `job.failed` events internally, so no
external call is needed. `event` wakes match any event type — from the
internal bus or from `POST /wakes/fire` with `kind: "event"`.

```json
{
  "name": "notify-on-build-fail",
  "kind": "job",
  "spec": { "workflow_id": "wf-uuid", "status": "failed" },
  "target": { "forge_conversation": { "forge_url": "https://forge.example", "api_key": "...", "agent_id": "agent-uuid" } },
  "prompt_template": "Build failed (job {{.payload.job_id}}). Investigate and report."
}
```

## Debugging

Check `GET /api/v1/wakes/{id}/log` first: every fire attempt — including
rate-limited drops (`error: "rate_limited"`) and template render failures —
is recorded with its payload and timestamp. A cron wake that never fires is
usually disabled, rate-limited, or sitting in failure backoff (check
`next_due_at` on the wake itself).
