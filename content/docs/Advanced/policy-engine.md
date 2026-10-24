---
weight: 8
title: "Policy Engine"
description: "Versioned, owner-scoped policy rules that gate every forge tool call with a deterministic allow/deny/ask verdict, a memo cache, and an agent-proposes/human-approves loop"
icon: "article"
date: "2026-10-24"
lastmod: "2026-10-24T00:00:00-05:00"
toc: true
---

The **policy engine** is Mule's control plane for autonomous agent actions:
versioned, owner-scoped bundles of deterministic rules that answer
`(agent_id, tool, input)` with a synchronous **verdict** — `allow`, `deny`,
or `ask`. Forge's `before_tool` hook is the enforcement point, so an agent
cannot run a blocked tool call; the verdict reason is written into the agent
transcript.

All endpoints live under `/api/v1/policies` and require
`Authorization: Bearer sk_mule_<hex>`.

## Concepts

| Concept | Meaning |
|---------|---------|
| **Policy** | One row of the `policies` table: a `scope`, optional `agent_id`, a non-empty `rules` array, an `enabled` flag, and an auto-incremented `version`. Owned by an owner-scoped API key. |
| **Rule** | One deterministic decision: "when `<tool>` is called and `<match>` applies, the verdict is `<disposition>`." |
| **Verdict** | `allow` \| `deny` \| `ask`, plus the winning `rule_id`, a transcript-ready `reason`, and a `memoized` flag. |
| **Memo** | A cached verdict keyed by `(agent_id, action_hash)` — the "human said yes/no" record for an `ask` round-trip. |
| **Proposal** | A drafted policy an agent recorded; a human must approve it before it becomes an active policy. |

## Rules

A rule (the `rules` array of a policy) looks like:

```json
{
  "id": "rm-guard",
  "description": "block recursive force deletes",
  "action": { "tool": "bash", "match": "rm -rf" },
  "sensitivity": "sensitive",
  "disposition": "deny",
  "reason": "rm -rf is blocked by operator policy"
}
```

| Field | Allowed values |
|-------|----------------|
| `id` | required, unique within the policy |
| `action.tool` | `bash`, `write`, `edit`, `web`, `email`, or `*` (any tool) |
| `action.match` | optional glob (≤ 512 chars); empty means "every call of this tool" |
| `sensitivity` | `low`, `normal`, `sensitive` |
| `disposition` | `allow`, `deny`, `ask` |
| `reviewer` / `review_mode` | v1 stub — see [Reviewer rules](#reviewer-rules) |

Sensitivity tiers follow the "dots" model: `sensitive` data → named-recipient
rules; destructive/irreversible or money → always `ask`; credential exposure
or money transfer → `deny` with a hand-back-to-human `reason`.

### Matching semantics

A rule's `match` fires when **either** of two deterministic legs hits:

1. **Rendered-line glob** — the tool input is rendered as sorted
   `field=value` lines (strings unquoted, everything else compact JSON). The
   glob is anchored and tested against **each** line; one hit is enough.
   `*` matches any characters *including* `/`, `?` matches exactly one
   character, everything else is literal.
2. **Bash raw-command substring** (`bash` only) — the match string must occur
   as a literal substring of the raw `command` (no glob interpretation on
   this leg). So `{"tool":"bash","match":"rm -rf"}` blocks
   `sudo rm -rf /tmp/x` even though the rendered line doesn't start with it.

Nothing else is consulted; a rule with no `match` matches every call of its
tool.

## Evaluation

`POST /api/v1/policies/evaluate` runs the deterministic evaluator:

```bash
curl -s -X POST https://api.muleai.io/api/v1/policies/evaluate \
  -H "Authorization: Bearer sk_mule_<hex>" \
  -d '{
    "agent_id": "agent-123",
    "tool": "bash",
    "input": { "command": "rm -rf /tmp/build" }
  }'
```

```json
{
  "verdict": "deny",
  "rule_id": "rm-guard",
  "reason": "rule \"rm-guard\" denies bash: rm -rf is blocked by operator policy",
  "memoized": false
}
```

The decision order is:

1. **Memo first** — any `policy_memo` row for `(agent_id, action_hash)`; the
   most-restrictive memoized verdict wins (`deny > ask > allow`) and the
   response carries `memoized: true`. The lookup ignores which rule was
   memoed, so memos survive rule churn.
2. **Active policies** — enabled policies owned by the caller (plus all
   `scope: "global"` policies; `scope: "agent"` policies only when their
   `agent_id` matches).
3. **Most-specific-wins** — `agent` > `org` > `global`. Within a scope every
   matching rule contributes and the most-restrictive disposition wins; full
   ties are broken by earliest rule id in the stored order.
4. **Default allow** — with no matching policy the verdict is `allow`
   (`rule_id: ""`, reason `"no matching policy"`) and **nothing is memoized**,
   so a policy created later takes effect immediately.

The action hash is `sha256(tool + "\n" + canonical-JSON(input))` — stable
under field order and whitespace, defined for empty input.

Winning verdicts are memoized automatically **except** the default allow and
`ask` verdicts (an ask is a pending question; an unapproved ask re-asks on
retry). Human decisions are recorded via the memo endpoint below.

### Reviewer rules

When the winning rule has `reviewer: true` and `review_mode: "agent"`, the
deterministic verdict is returned immediately as the **floor** and the
response adds `"review": "pending"`. The review-agent upgrade (a cheap agent
step that can only loosen the floor) is a documented follow-up; forge never
blocks on a review agent in v1.

## Scopes

`scope` is one of `global`, `org`, or `agent`. `agent` scope requires
`agent_id`. More specific scopes override broader ones; global policies
always apply.

## REST API

All CRUD endpoints follow the restricted-key class: a restricted (agent) key
may **read** but not write. `evaluate`, `memo`, and `proposals` are
explicitly open to restricted keys (see table notes).

| Method & path | Purpose |
|---------------|---------|
| `GET /api/v1/policies` | List policies visible to the caller's owner (+ global) |
| `POST /api/v1/policies` | Create a policy (`{scope, agent_id?, rules[], enabled}`) |
| `GET /api/v1/policies/{id}` | Fetch one policy |
| `PATCH /api/v1/policies/{id}` | Update `scope`, `agent_id`, `rules`, and/or `enabled` (bumps `version`) |
| `DELETE /api/v1/policies/{id}` | Delete a policy |
| `POST /api/v1/policies/evaluate` | Synchronous verdict (open to restricted keys — it's the forge hook's query surface) |
| `POST /api/v1/policies/memo` | Record a decided `allow`/`deny` for an action (open to restricted keys) |
| `POST /api/v1/policies/proposals` | Agent drafts a policy: `{draft:{scope, agent_id?, rules[]}}` → `{proposal_id}` (open to restricted keys) |
| `POST /api/v1/policies/proposals/{id}/approve` | Human approves a draft; creates the policy (version 1) + audit row, one transaction (full key only) |

### The ask round-trip

1. Agent calls a tool; forge's `before_tool` hook calls `/evaluate` and gets
   `ask`. The hook blocks the call and surfaces the question to a human
   (ranch is the approval UI).
2. On approval, the decision is recorded:

```bash
curl -s -X POST https://api.muleai.io/api/v1/policies/memo \
  -H "Authorization: Bearer sk_mule_<hex>" \
  -d '{
    "agent_id": "agent-123",
    "tool": "bash",
    "input": { "command": "rm -rf /tmp/build" },
    "verdict": "allow",
    "rule_id": "deploy-cleanup",
    "reason": "human approved cleanup of /tmp/build"
  }'
```

3. The agent retries the exact same action; the memo lookup short-circuits
   evaluation with `memoized: true`. A denied action can be memoed the same
   way (`verdict: "deny"`). Only `allow`/`deny` are accepted — an `ask` is
   not a decision.

### Agent proposes, human approves

Agents can *draft* rules but never activate them:

```bash
# agent (restricted key) drafts
curl -s -X POST https://api.muleai.io/api/v1/policies/proposals \
  -H "Authorization: Bearer sk_mule_<restricted>" \
  -d '{"draft": {"scope": "agent", "agent_id": "agent-123",
                  "rules": [{"id":"no-force-push","action":{"tool":"bash","match":"push --force"},
                             "sensitivity":"sensitive","disposition":"deny",
                             "reason":"force-push requires human sign-off"}]}}'
# → {"proposal_id": "…"}

# human (full key) approves — creates the policy owned by the approver
curl -s -X POST https://api.muleai.io/api/v1/policies/proposals/<id>/approve \
  -H "Authorization: Bearer sk_mule_<hex>"
```

Approving an unknown or already-approved proposal returns `404`.

## Audit trail

Every policy mutation and approval writes to the `policy_audit` table
(indexed by `policy_id, at DESC`). The evaluator itself never blocks: v1 is
deterministic-only with a p99 < 50 ms target.

## Storage

Migration `0015_policies.sql` creates `policies` (owner-scoped, versioned),
`policy_memo` (keyed by `agent_id + action_hash`), and `policy_audit`.
