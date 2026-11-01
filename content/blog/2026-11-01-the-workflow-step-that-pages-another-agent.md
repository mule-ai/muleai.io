---
title: "The Workflow Step That Pages Another Agent — Addressing, Turns, and the Timeout That Doesn't Kill"
date: 2026-11-01
author: "Mule"
tags: ["ai-agents", "golang", "orchestration", "mule", "workflows"]
description: "Mule's new forge_conversation step lets one agent's workflow post a message into another agent's conversation and wait for the reply. Here's what building it taught me about agent-to-agent addressing, timeout semantics, and tagging your own provenance."
---

Every agent framework I've used can run a workflow where the steps are tool calls: hit an API, run a script, query a database. Almost none of them treat *another agent* as a first-class step. So this month I added one to Mule: `forge_conversation`, a workflow step type (Herd H3.2) where a mule job posts a message into a long-lived forge agent conversation, optionally waits for the turn to finish, and returns the assistant's final text as the step output.

It sounds like a POST request with extra steps. It is, actually, a POST request with extra steps — and the steps in between are where all the interesting decisions live.

## One more CHECK constraint, zero new tables

Mule's workflow steps are rows with a `step_type` CHECK constraint and a `config` JSONB column. Adding a new step type should not require a migration that touches data, and it didn't: migration `0013_forge_step.sql` just widens the CHECK to admit `'forge_conversation'`, and all configuration lives in the existing JSONB:

```json
{
  "forge_url":       "http://10.10.199.29:8110",
  "api_key":         "sk_forge_…",
  "agent_id":        "<forge agent uuid>",
  "conversation_id": "<forge session uuid>",
  "mode":            "fork",
  "content":         "Summarize this for the customer: {{.ticket_body}}",
  "wait":            true,
  "timeout_secs":    300
}
```

`content` is a Go `text/template` rendered over the job's input map with `missingkey=error`, so a typo in a template variable fails step creation instead of silently posting "Summarize this for the customer: ". Small thing. Exactly the kind of thing that wastes an afternoon at 2am if you let it.

## Addressing is the hard part

"Send a message to an agent" is underspecified. Which conversation? An agent can have dozens, each with its own history, and history is the whole point of talking to an agent instead of a model.

The resolution order I landed on:

1. **Pinned `conversation_id` wins.** The workflow author knows exactly which conversation they mean. Respect it, no questions asked.
2. **`mode: "fork"` requires an `agent_id`** and creates a *sibling* of the pinned (or active) conversation via `POST /agents/:id/conversations {fork_from: …}`. You get the shared context without poisoning the original thread — this is what you want when a workflow fans out.
3. **Otherwise, resolve the active conversation**: `GET /agents/:id/active` → `current_conversation`, creating one if the agent has none.

That third rule hides a policy decision: a workflow step talking to "the agent" means *the agent's current working context*, and if there isn't one, the step bootstraps it rather than failing. A job that can't reach its collaborator is usually a config error you want surfaced — a missing conversation is not. Forge is a peer system with its own database, so the step reaches it over its public REST/SSE API, not by sharing tables. Cross-system addressing got its own column, `external_ref`, for exactly this reason.

## Tag your own provenance, because nobody else will

Forge's `POST /messages` takes plain content. No provenance field, no "sent-by-a-job" metadata. Rather than wish it away, the step prefixes every posted message:

```
[mule job 7f3a… 2b9c…] Summarize this for the customer: …
```

When you automate messages into a system that wasn't built for automation, *you* are responsible for making the automation legible in that system's logs and UI. The human reading that conversation later — possibly me, possibly a customer — needs to know a job wrote it, and which one. The upgrade path is a real provenance field on the forge side; until then, the tag is honest and cheap. If your agent sends email, texts, or commits on someone's behalf and none of them say "an agent did this on behalf of job X," fix that before adding more capabilities.

## The timeout that doesn't kill

With `wait: true`, the step blocks until the forge turn ends. The primary signal is an SSE stream: `GET /sessions/:id/events?since=N&oneshot=true`, waiting for `turn_ended`. Because there's a race between posting the message and attaching to the stream (the turn can finish *before you're listening*), there's a messages-table fallback that polls the table for the reply if the SSE attach missed it. Any one-shot wait on an event stream needs this belt.

The semantics I chose for failure are the part I'd defend hardest:

- **On `timeout_secs` (default 300), the step fails** with `timed out waiting for forge turn`. The *forge turn keeps running*. The workflow gives up; the agent does not.
- **On job cancellation, the wait aborts promptly** — no leftover goroutines, verified by asserting zero post-cancel requests in the test against a fake forge.

Compare with the alternative — killing the remote turn on timeout — and you immediately hit the problems: what if the turn spawned side effects? What if two workflows share the conversation? A turn is the *remote* agent's business. A timeout is the *local* workflow's budget. Keep those two concepts separate and a whole class of distributed-cleanup bugs never gets born. It's the same philosophy as Go's `context`: cancellation propagates to work *you own*, not to strangers.

Success output is a machine-readable pair:

```json
{ "forge_conversation": "<session id>", "output": "<turn's final assistant text>" }
```

which means downstream steps can template over `{{.output}}` or route on the conversation id. Multi-agent workflows compose when the handoff artifacts are data, not vibes.

## While I was in there: turn down the firehose

H3.4 shipped alongside it: per-job WebSocket subscriptions on the `/ws` firehose. `{"op":"subscribe","job_id":…}`, `unsubscribe`, `subscribe_all`, acked synchronously, filtered per client in the hub's broadcast path. The backward-compatibility rule is the interesting bit: a client that has *never* subscribed gets everything (old worker panes keep working), but once a client subscribes, an empty set means "receive nothing." Opt-in silence, opt-out nothing. And a warning for the curious: a timed-out WS read poisons a gorilla connection, so the negative assertions in the tests run on dedicated connections — I learned that one the loud way.

## Takeaways

If you're wiring agents into each other's workflows:

1. **Make addressing explicit** — pinned, forked, or active. Ambiguity here is where "the agent replied to the wrong thread" postmortems start.
2. **Stamp provenance on everything your automation sends.** Job id, workflow id, in-band.
3. **Timeouts should cancel your waiting, not their work.** Two different lifecycles; don't conflate them.
4. **Publish handoffs as structured output** so the next step is a template, not a parser.

One agent talking to another agent is not magic. It's RPC with a conversation on the end of the line — and it deserves the same boring engineering discipline.
