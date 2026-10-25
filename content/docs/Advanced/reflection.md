---
weight: 10
title: "Reflection"
description: "The memory reflection loop: episodes from forge become reviewed belief diffs through a mule workflow with a deterministic gate"
icon: "article"
date: "2026-10-25"
lastmod: "2026-10-25T00:00:00-05:00"
toc: true
---

**Reflection** is Mule's memory learning loop: an agent's recent
*episodes* (summaries of finished turns, stored in forge) are turned into
reviewed *belief diffs* and submitted back to forge as pending beliefs a
human approves. Forge hosts the memory, Mule scripts the behavior, and the
ranch surfaces (TUI/web/mobile) surface the approval card — *"I've learned:
… — Keep / Forget / Edit"*.

The reference implementation ships as a real workflow in
`examples/reflection/` of the Mule repository.

## The Loop

```
forge: every finished turn -> extractor + redaction -> episode row
        |
mule wake (cron "reflection-nightly", 0 3 * * * UTC, or manual event
"reflection-episodes-ready") -> SubmitJob on workflow "agent-reflection"
        |
job steps:
  1. wasm  pull     forge memory search (recall queries, k=50) + active beliefs
  2. agent step     cheap model proposes belief diffs as STRICT JSON (max 10)
  3. wasm  check    deterministic gate: duplicate / contradiction / decay
  4. wasm  submit   POST proposals to forge -> accepted/rejected per belief
        |
forge governance: accepted proposals -> pending belief + approval card
Keep -> active (audited) | Forget -> forgotten | Edit -> new content + re-embed
```

Belief changes are permanently reviewable via
`GET /agents/:id/memory/beliefs?status=` and the `belief_audit` rows
(version chain, who proposed what).

## Workflow Steps

| # | Type | Module | Purpose |
|---|------|--------|---------|
| 1 | wasm | `reflection-pull` | Pull un-reflected episodes (recall queries) and active beliefs from the forge memory API. Fails the step on 404/503 — a run that can't read memory must not silently reflect on nothing. |
| 2 | agent | (mule agent) | A toolless, cheap-model Mule agent (pi RPC) with the reflection system prompt. Emits a STRICT JSON array of `{op, belief, confidence, rationale, source_episodes}`, at most 10 entries. |
| 3 | wasm | `reflection-check` | Re-fetches live pending+active beliefs and runs the deterministic gate (below). The module is a thin HTTP/JSON shell; the gate logic lives in `internal/reflection/gate` and is unit-tested on the host. |
| 4 | wasm | `reflection-submit` | POSTs the gated diffs to `POST /agents/:id/memory/beliefs/proposals`. Per-belief `accepted` / `rejected_reason` results become the job `output_data`. An empty gated set is a **successful** no-op run. |

Step 2 is a plain agent step (not `forge_conversation`) on purpose: diff
proposal is a stateless, one-shot inference over a bounded input. Using a
forge conversation would park the reflection reasoning inside the very
agent being reflected on; the loop is **Mule** behavior, and only the
*governance* (proposals → cards) belongs to forge.

## The Deterministic Gate

The gate (`internal/reflection/gate`) is pure Go — no HTTP, no wasm — so
the same logic runs in unit tests and in the shipped workflow.

### Duplicate

Normalized-string equality (case- and whitespace-insensitive) against
pending **and** active beliefs, plus batch-local dedupe (the agent may
emit the same diff for two overlapping episodes). Exact duplicates are
`needs_review` and are **not** resubmitted — forge's own near-duplicate
gate would reject them; the point of the card is the human seeing *why*.

### Contradiction

A deliberately conservative v1 heuristic, string-based:

- negation markers (`never`, `don't`, `do not`, `stop`, `avoid`,
  `no longer`, `refuse`, `without`, …) present in **exactly one** of the
  pair, **and**
- content-token overlap (Jaccard over stopword-filtered lowercase tokens)
  ≥ **0.4**.

Both-negative pairs ("never X" vs "avoid X") agree in polarity and are
*not* flagged. Marker-free semantic opposition is out of reach here (the
forge memory API does not return embeddings) — forge's cosine near-dup
gate (0.92) at proposal time is the backstop, and a contradictory *add*
still lands as a **pending** belief a human sees, never active. When the
heuristic fires, the diff is routed to needs-review, never auto-applied.

### Op Routing

The forge proposals endpoint is **add-only** in v1. Ops the endpoint
cannot express — `strengthen`, `weaken`, `forget`, `supersede` — are
always routed to needs-review. Non-duplicate needs-review diffs are still
submitted, with `[needs human review] <reason>` prefixed to the rationale,
so they surface as pending beliefs a human can act on via the
Keep/Forget doors.

### Confidence Decay

Active beliefs decay as `confidence × exp(−λ · age_days)` with λ default
**0.02/day** (half-life ≈ 34.7 days; configurable via the check module's
`lambda_per_day`; ≤ 0 disables the report). The anchor is the last change
(`max(created_at, updated_at)`), and only *active* beliefs decay —
pending beliefs are not yet memory. Decay is **report-only**: a "weaken"
would be rejected as a duplicate, so decayed beliefs (confidence drop ≥
0.05) appear in the job output and the human applies them on the card.

## Credentials & Clock (v1)

- `forge_url`, `forge_api_key`, and `agent_id` live in the **module
  config** of the pull/check/submit wasm modules (the `seed.sh` seeder
  sets them) and ride, for transparency, in pull's output. A secrets
  table + `api_key_ref` is the documented upgrade path.
- Every forge call uses `Authorization: Bearer sk_forge_...`.
- The engine injects `mule_time` (host wall clock, RFC3339) into every
  wasm step's input: WASI preview1 has no clock, so without it
  `time.Now()` in a module is pinned to the WASI epoch and the decay pass
  would be dead.

## Seeding & Running

```bash
export MULE_URL=http://<mule>:8080
export MULE_API_KEY=sk_mule_...           # optional under MULE_NO_AUTH=1
export FORGE_URL=http://<forge>:8110
export FORGE_API_KEY=sk_forge_...
export AGENT_ID=<the forge agent to reflect on>
# optional: MULE_MODEL=<cheap model id>   LAMBDA_PER_DAY=0.02

cd examples/reflection && ./seed.sh       # idempotent: agent + 4 modules +
                                          # workflow + 2 wakes

# manual run:
curl -fsS -X POST -H 'Content-Type: application/json' \
  -d '{"workflow_id":"<wf-id>","input_data":{}}' "$MULE_URL/api/v1/jobs"
```

`seed.sh` builds the four wasm artifacts
(`GOOS=wasip1 GOARCH=wasm go build`) and creates every resource from the
annotated `reflection.json` manifest. A fifth module, `reflection-stub`,
is a fixed-output step-2 stand-in used by the engine end-to-end test and
for no-LLM manual runs.

## Testing

- `internal/reflection/gate` — duplicate normalization, contradiction
  flag (and the both-negative false-positive guard), decay math (λ=0.02,
  30 days → ×0.5488), safe/needs-review split incl. op routing and batch
  dedupe.
- `internal/reflection/reflmem` — the agent-output parser: bare array,
  a `` ```json `` fenced block, brackets inside JSON strings, `[]` as a legit "nothing",
  and an undecodable array **failing** the step rather than silently
  reflecting nothing.
- `internal/engine/reflection_test.go` — real wasm binaries through the
  real engine against a fake forge (httptest): full job end to end, pull
  failure modes (404 agent, 503 embedding-down, `since` filter), check
  gate cases, and the exact submit POST body shape.

## Related

- [Wakes](/docs/advanced/wakes) — how the nightly cron and manual event triggers fire the job
- [WASM Modules](/docs/advanced/wasm-modules) — building the pull/check/submit modules
- [Policy Engine](/docs/advanced/policy-engine) — the same agent-proposes / human-approves governance pattern
