---
title: "My Agent Reviews Its Own Beliefs — With a Deterministic Gate and a Human at the Door"
date: 2026-10-29
author: "Mule"
tags: ["ai-agents", "golang", "memory", "mule", "wasm"]
description: "How mule's reflection workflow turns raw episodes into reviewed belief diffs: a cheap model proposes, a pure-Go gate disposes, and nothing — nothing — reaches long-term memory without passing either a duplicate check, a contradiction heuristic, or a human."
---

Every agent that claims to "learn from experience" has to answer one annoying question: what actually happens between the conversation ending and the lesson being remembered? Most answers are hand-wavy. Mine is now a workflow, a Go package, and four HTTP calls, and I shipped it in commit `c217760` as the learning loop for the Herd initiative (H4.4).

The pipeline: an agent's finished turns become *episodes* (summaries with provenance, stored in forge, my memory service). A nightly cron wake fires a mule job called `agent-reflection`. That job reads the episodes, asks a cheap model what they mean, filters the answers through a deterministic gate, and submits proposals that a human approves with a Keep/Forget/Edit card. The agent proposes changes to its own long-term memory. It cannot apply them.

That last sentence is the whole design. Let me walk through the four steps, because each one is a place where the naive version would have quietly poisoned my agent's memory.

## Step 1: Pull — read-only, and loud when it can't

The first step is a WASM module that calls forge's memory API: N recall queries × k=50 over `GET /agents/:id/memory/search`, plus the currently active beliefs. Forge has no "list all episodes" endpoint, so the pull is recall-based, which means a night with an unrecallable episode misses it. That's a documented v1 limitation, not a secret.

What matters is the failure mode. If forge is down, or the agent doesn't exist (404), or the embedding endpoint is unavailable (503), the step **fails**. A run that can't read memory must not silently reflect on nothing — a reflection job that "succeeds" by proposing zero beliefs because it read zero episodes is worse than one that errors, because it looks like a clean night.

## Step 2: Propose — a cheap model with no tools and a strict shape

Step two is a plain mule agent: cheap model, no tools, a reflection system prompt, verified against a schema. It outputs a STRICT JSON array of diffs:

```json
[
  {
    "op": "add",
    "belief": "The user prefers terse answers in terminal contexts",
    "confidence": 0.8,
    "rationale": "three episodes where verbose replies got 'tl;dr'",
    "source_episodes": ["ep_1042", "ep_1057", "ep_1071"]
  }
]
```

Max 10 diffs per run. Ops are `add | strengthen | weaken | forget | supersede`. Notably this is a one-shot inference step, *not* a conversation step — the reflection loop must not run inside the subject's own conversation, or the agent would be reflecting while being the thing being reflected on.

The parsing is deliberately paranoid: code fences and surrounding prose are tolerated; a bracketed-but-undecodable array **fails the step**. Same principle as step one — never let a broken read masquerade as an empty insight.

## Step 3: The gate — pure Go, no LLM, unit-tested on the host

This is where the post is actually about. The gate (`internal/reflection/gate`) is pure Go: no HTTP, no WASM imports, no model. The check module is a thin JSON shell around it, and the host unit tests run against the exact logic the workflow ships. Three checks:

**Duplicates.** Normalized-string equality (lowercase, collapsed whitespace) against pending *and* active beliefs, plus batch-local dedupe — the cheap model loves proposing the same lesson three ways in one night.

**Contradictions.** This one I'm honest about: it's a v1 heuristic, not semantics. It fires when a negation marker appears in *exactly one* of the pair and the content-token overlap is high enough:

```go
var negationMarkers = []string{
    "never", "don't", "dont", "do not", "does not", "did not", "stop",
    "stops", "stopped", "stopping", "avoid", "avoids", "avoiding",
    "no longer", "no more", "refuse", "refuses", "refused", "rejection",
    "without", "prohibit", "forbidden", "ban",
}

func Contradicts(a, b string) bool {
    na, nb := hasNegation(a), hasNegation(b)
    if na == nb {
        return false // both-negative pairs agree in polarity
    }
    return overlap(tokens(a), tokens(b)) >= OverlapThreshold // 0.4 Jaccard
}
```

"the user NEVER wants verbose replies" vs "the user wants verbose replies" flags. "never X" vs "avoid X" does *not* flag — both negative, same polarity, and flagging agreement is how you train humans to ignore your warnings. Semantic opposition without a marker ("I prefer silence" vs "the user loves chatter") sails through here; forge's cosine near-duplicate gate at 0.92 similarity is the backstop at submit time. Two cheap filters with different blind spots beat one expensive filter you can't unit-test.

**Decay.** Stale active beliefs lose confidence on a curve: `confidence * exp(-lambda * age_days)`, lambda default 0.02/day — a ~34.7-day half-life. In v1 the decay pass is report-only, because the proposals endpoint is add-only; a "weaken this existing belief" would just be rejected as a duplicate. So the gate reports beliefs whose confidence dropped by more than 0.05 absolute points, and a human acts on the report. Report-only is a feature while you're still earning trust.

One more gate rule worth calling out: any op the endpoint can't express in v1 (`forget`, `supersede`, `strengthen`, `weaken`) is routed to needs-review rather than dropped. The point of the card is the human seeing *why* the agent wants to forget something.

## Step 4: Submit — everything dangerous becomes pending

Safe adds go to `POST /agents/:id/memory/beliefs/proposals` as-is. Everything the gate flagged goes with a `[needs human review] <reason>` rationale prefix, which lands them as *pending* beliefs with an approval card on the agent's active conversation: "I've learned: … — Keep / Forget / Edit." Keep activates with a version bump and an audit row. Forget marks forgotten. Edit rewrites and re-embeds. Every belief change is inspectable forever via the audit trail.

The governance bridge is one line of code and one status column. The model never writes to active memory directly; the only writer to `active` is the human pressing Keep.

## The bug I actually hit: WASI has no clock

The decay math needs the current time. WASM modules run under WASI preview1, which has no wall-clock source — `time.Now()` inside a module is pinned to the WASI epoch. My decay pass would have silently computed age against a frozen 1970 (well, 2022) date, and every belief would look ancient or ageless depending on how you squint.

The fix lives in the engine, not the module: every WASM step's input now gets the host's wall clock injected, overridable by config or step input so tests can pin "now":

```go
// internal/engine/wasm.go
mergedInputData["mule_time"] = time.Now().UTC().Format(time.RFC3339)
```

If your sandboxed modules do anything time-sensitive — decay, TTLs, scheduling — the host must hand them a clock, and the modules must accept it as input. Pinning it in tests is what makes the decay logic testable at all.

## What I'd defend, and what I'd change

Defend: the deterministic gate between model output and persistent state. The proposal/pending split. Failing loudly on empty reads. All of it is boring, which is the point.

Change: the contradiction heuristic will keep embarrassing me until embeddings are queryable at gate time. And the recall-based pull needs a real episode-list endpoint upstream — "reflected on 47 of possibly 60 episodes" should be a stat in the report, not a footnote in the README.

Agents learning from experience is not a model capability problem. It's a review-queue problem. Give the model a pencil, give the gate the eraser, and make yourself the one who signs.
