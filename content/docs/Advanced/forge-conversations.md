---
weight: 11
title: "Forge Conversation Steps"
description: "The forge_conversation workflow step type: addressing a long-lived forge agent conversation, posting templated messages, and waiting for the turn's assistant output"
icon: "article"
date: "2026-10-30"
lastmod: "2026-10-30T00:00:00-05:00"
toc: true
---

`forge_conversation` is a workflow step type (alongside `agent` and
`wasm_module`) that lets a Mule job talk to a **long-lived forge agent
conversation** by address: it posts a templated message tagged with its
Mule job and, optionally, waits for the forge turn to end and returns the
turn's assistant text as the step output.

The step's full config lives in the existing `config` JSONB column of
`workflow_steps` — adding the type only widened the `step_type` CHECK
constraint (migration `0013_forge_step.sql`).

## Step Configuration

```json
{
  "id": "unique-step-id",
  "workflow_id": "workflow-uuid",
  "step_order": 2,
  "type": "forge_conversation",
  "config": {
    "forge_url": "https://forge.example",
    "api_key": "sk_forge_...",
    "agent_id": "agent-uuid",
    "mode": "message",
    "content": "Review this PR: {{.pr_url}}",
    "wait": true,
    "timeout_secs": 300
  }
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `forge_url` | yes | — | http/https base URL of the forge server (no `/api/v1` prefix — forge has no mount prefix) |
| `api_key` | yes | — | The forge `sk_forge_...` key, inlined in config in v1 (a secrets table with `api_key_ref` is the documented upgrade path) |
| `agent_id` | one of | — | Forge agent to address; at least one of `agent_id` / `conversation_id` is required |
| `conversation_id` | one of | — | Pinned conversation (session) id; wins over the agent's active conversation |
| `mode` | no | `message` | One of `message`, `steer`, `follow_up`, `fork` |
| `content` | yes | — | Go `text/template` rendered over the **job input map**; missing keys fail the step (typos never silently post empty content) |
| `wait` | no | `false` | Wait for the forge turn to end and return the assistant reply |
| `timeout_secs` | no | `300` | Wait budget (positive integer when set) |

Configs are validated at creation time; invalid configs are rejected with
combined per-field validation errors.

## Addressing

The target conversation is resolved in this order:

1. A pinned `conversation_id` always wins.
2. `mode: "fork"` requires `agent_id` and creates a sibling conversation
   via `POST /agents/:id/conversations` with `fork_from` set to the pinned
   or currently active conversation.
3. With `agent_id`: `GET /agents/:id/active` returns the agent's current
   conversation; when the agent has none, one is created via
   `POST /agents/:id/conversations`.

### Modes

`message`, `steer`, and `follow_up` are Mule-level labels — in v1 all
three post the same way (`POST /messages`); they exist so workflows and
UIs can express intent. `fork` creates a sibling conversation first and
posts there, leaving the agent's active conversation untouched.

## Mule-Origin Tagging

Forge's `POST /messages` accepts plain content only (no per-message
provenance field), so every message posted by the step is prefixed:

```
[mule job <job-id> <workflow-id>] <rendered content>
```

## Waiting for the Turn

With `wait: true` the step snapshots the conversation's message
high-water mark **before** posting, then waits for the turn to end:

- **Primary signal**: the SSE stream `GET /sessions/:id/events?since=N&oneshot=true`.
  Forge closes the stream after the `turn_ended` event. `message` events
  advance the resume point so a reconnect after a dropped connection
  replays no pre-turn history.
- **Attach-race fallback**: `turn_ended` is a live bus event — if the
  turn ends before the SSE connection attaches, no event ever arrives.
  When a stream attempt delivers no `turn_ended`, the step consults the
  messages table: a fresh assistant row past the pre-turn boundary means
  the turn produced its final answer (a mid-tool-call turn shows tool
  rows, not a new assistant row).
- **Timeout**: the step **fails** with *"timed out waiting for forge
  turn"* while the forge turn keeps running — the workflow gives up, the
  agent does not.

## Output

The step output is a JSON object:

```json
{
  "forge_conversation": "<session id>",
  "output": "<text>"
}
```

`output` is the turn's final assistant message when `wait: true`, or the
posted (tagged) content when `wait: false`. If a waited turn ends without
an assistant reply, the step fails.

## Forge Endpoints Used

Read from forge's axum router — note forge has **no `/api/v1` mount
prefix**:

| Method & path | Purpose |
|---------------|---------|
| `GET /agents/:id/active` | `{"busy": bool, "current_conversation": uuid\|null}` |
| `POST /agents/:id/conversations` | Create (optionally `{"fork_from": uuid}`) → `{"session": {...}, "working_dir": "..."}` |
| `POST /messages` | `{"session_id": uuid, "content": "..."}` → 202 |
| `GET /messages?session_id=...` | List messages (`id`, `sequence`, `role`, `content`) |
| `GET /sessions/:id/events?since=N&oneshot=true` | SSE: `message`, `turn_ended`, `heartbeat`, `lagged`; closes after `turn_ended` |

All REST calls are authenticated with `Authorization: Bearer <api_key>`
and carry a 30-second per-call timeout; the SSE stream is bounded by the
step's wait deadline instead.

## Related

- [Wakes](../wakes) — wake targets can post fire-and-forget messages to a
  forge conversation using the same addressing shape (`forge_url`,
  `api_key`, `agent_id`/`conversation_id`), tagged `[mule wake <id>] `.
- [Voice Loop](../voice-loop) — the `voice_call` step reuses the same
  forge REST/SSE client for steering, plus STT/TTS audio endpoints.
