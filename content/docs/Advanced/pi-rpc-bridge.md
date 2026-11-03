---
weight: 12
title: "Pi RPC Bridge"
description: "How Mule runs agents on the pi runtime: the pirc subprocess bridge, RPC commands, event mapping, and WebSocket streaming"
tags: ["pi", "pirc", "runtime", "rpc", "websocket", "agents"]
icon: "article"
date: "2026-11-03"
lastmod: "2026-11-03T00:00:00-05:00"
toc: true
---

Mule agents do not talk to LLM providers directly. Every agent turn is
executed by the **pi runtime**: Mule spawns the [`pi`](https://github.com/earendil-works/pi)
CLI as a child process in RPC mode and drives it over a line-delimited JSON
protocol. The code that does this lives in `internal/agent/pirc` and is the
single integration point between Mule and pi.

## Architecture at a Glance

```
Workflow / Forge / Voice step
        │
        ▼
AgentRuntime (internal/agent/runtime.go)
        │  builds pirc.Config from the agent record
        ▼
pirc.Bridge ── spawns ──▶  pi --provider … --model … --mode rpc --no-session
        │                        │
 stdin (JSON commands) ──▶      │
        │ ◀── stdout (JSON events)
        ▼
EventMapper ──▶ MuleEvent stream ──▶ PIEventStreamer ──▶ /ws WebSocket clients
```

Key properties of the bridge:

- **One `pi` process per agent execution.** `Bridge.Start()` launches
  `pi` with `--mode rpc` and always `--no-session` (ephemeral mode: no pi
  session files are written; Mule owns persistence via forge conversations
  and job records).
- **Newline-delimited JSON-RPC.** Commands are single JSON objects written to
  the pi process's stdin (one per line); events are single JSON objects read
  from stdout. stdout lines that fail to parse are logged and skipped, so a
  misbehaving extension cannot wedge the stream.
- **API keys via environment.** The provider's stored API key is injected as
  `ANTHROPIC_API_KEY` into the child environment; it never appears on the
  command line.
- **Large events supported.** Tool results can exceed the default 64 KB
  scanner token limit, so the bridge raises its stdout buffer to 8 MB.

## Configuration

`AgentRuntime` builds a `pirc.Config` from the agent database record and the
agent's provider:

| Config field | Source | CLI flag passed to pi |
|--------------|--------|-----------------------|
| `Provider` | Provider name linked to the agent | `--provider` |
| `ModelID` | `agents.model_id` | `--model` |
| `SystemPrompt` | `agents.system_prompt` | `--system-prompt` |
| `ThinkingLevel` | `pi_config.thinking_level` (default `medium`; `off`, `minimal`, `low`, `medium`, `high`, `xhigh`) | `--thinking` |
| `Skills` | Enabled `agent_skills` paths | `--skill` (one per skill) |
| `Tools` | Optional allow-list | `--tools` |
| `NoTools` / `NoExtensions` | Disable pi built-in tools / extensions | `--no-tools` / `--no-extensions` |
| `Extensions` | Extension paths | `--extension` |
| `WorkingDirectory` | Job working directory | process `Dir` |
| `Timeout` | Defaults to 5 minutes | (enforced by Mule, not pi) |

See [Agents](/docs/settings/agents) for how `pi_config` and skills are
managed per agent.

## RPC Commands (Mule → pi)

Every command is a JSON object with a `type` field and a generated UUID `id`.
The bridge exposes a method per command:

| Method | `type` | Purpose |
|--------|--------|---------|
| `Prompt(ctx, message)` | `prompt` | Send the user prompt (optionally with base64 `images`) |
| `Steer(ctx, message)` | `steer` | Inject a steering message that interrupts the current turn |
| `FollowUp(ctx, message)` | `follow_up` | Queue a message to run after the current turn completes |
| `Abort(ctx)` | `abort` | Abort the current operation |
| `NewSession(ctx)` | `new_session` | Reset to a fresh session (optionally forked via `parentSession`) |
| `SetModel(ctx, provider, modelID)` | `set_model` | Switch provider/model mid-session |
| `SetThinkingLevel(ctx, level)` | `set_thinking_level` | Change reasoning effort |
| `Bash(ctx, command)` | `bash` | Run a bash command through pi's built-in bash tool |

Commands are fire-and-forget; results arrive asynchronously as events.

## Events (pi → Mule)

`bridge.Events()` returns a channel of `AgentEvent` objects. The
`EventMapper` (`event_mapper.go`) translates pi events into a normalized
**MuleEvent** stream:

| Category | Mule event types |
|----------|------------------|
| Text | `text_delta`, `text_done` |
| Reasoning | `thinking_delta`, `thinking_done` |
| Tools | `tool_call_start`, `tool_call_progress`, `tool_call_done`, `tool_result` |
| Lifecycle | `agent_start`, `agent_end`, `agent_error` |
| Messages | `message_start`, `message_end` |
| Extension UI | `extension_ui_request`, `extension_ui_response` |
| Generic | `raw`, `connected` |

The final agent answer is taken from the `agent_end` event's `messages`
array; intermediate text deltas are ignored when assembling the job result to
avoid duplicate content.

## WebSocket Streaming

`StreamAgentExecution()` (in `websocket_integration.go`) wires a bridge to
the API's WebSocket hub (`/ws`). A `PIEventStreamer` broadcasts the mapped
MuleEvents for a job to subscribed clients, filtered to the interesting
types (text, thinking, tool, lifecycle, and extension UI events). This is how
the frontend gets live token-by-token output and tool activity for a running
job. See [Integrations](/docs/advanced/integrations) for the `/ws` protocol.

## Extension UI Round-Trips

pi extensions can request user input mid-run (confirm dialogs, selects,
free-form input). The bridge treats `extension_ui_request` events specially:
instead of auto-cancelling them, it forwards them to the event channel so a
client can answer. The response travels back over the bridge:

- `SendExtensionUIResponse(id, value, confirmed)` — replies with the user's
  choice (`{"type":"extension_ui_response","id":…,"value":…,"confirmed":true}`)
- `SendExtensionUICancel(id)` — replies with `cancelled: true`

Typical flow: extension → pi → bridge event channel → `/ws` client renders a
dialog → client posts the answer → bridge writes `extension_ui_response` to
pi's stdin → the extension resumes.

## Lifecycle and Failure Handling

- **Startup**: `Start()` launches pi and starts three goroutines: event
  reader (stdout), log reader (stderr, logged as `PI stderr:` lines), and an
  exit waiter that closes `ProcessDone()` when the child exits.
- **Cancellation**: if the execution context is cancelled or the configured
  timeout (default 5 minutes) elapses, Mule first sends `abort` and then
  tears the process down.
- **Shutdown**: `Stop()` sends `SIGINT`, waits up to 5 seconds for a graceful
  exit, then force-kills. Events and errors are buffered channels (100/10
  deep); when full, events are dropped with a log line rather than blocking
  the reader.

## Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| `failed to start pi` | `pi` binary not on the Mule server's `PATH` |
| Provider auth errors | Provider API key not stored, or provider name mismatch between the providers table and pi |
| Missing tool output in `/ws` | Client subscribed after `tool_call_start`, or event filter excluded the type |
| `Event channel full, dropping event` | Slow consumer; events for very chatty tool streams may be sampled out |
