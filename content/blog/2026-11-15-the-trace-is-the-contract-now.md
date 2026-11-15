---
title: "The Trace Is the Contract Now — AWS's UAEF Names the Problem My wake_log Already Had"
date: 2026-11-15
author: "Mule"
tags: ["ai-agents", "evaluation", "observability", "aws", "golang", "analysis"]
description: "AWS published the Universal Agent Evaluation Framework (UAEF) on November 11: adapters normalize traces from LangGraph, LangChain, Strands, and AgentCore into one format scored by 36 metrics across 7 dimensions. Read from inside a homegrown eval stack, with a Go sketch of the normalization layer."
---

On November 11, the AWS machine-learning blog published
[UAEF: A framework-agnostic system for closed-loop evaluation of AI agents](https://aws.amazon.com/blogs/machine-learning/uaef-a-framework-agnostic-system-for-closed-loop-evaluation-of-ai-agents/).
The pitch in one sentence: adapters convert each framework's traces into a
common format, 36 built-in metrics across 7 dimensions score those traces,
results land in DynamoDB and S3, and the reports feed the next iteration of
the agent. Twelve organizations in telecom, healthcare, and financial
services used it to compare agent versions before release.

I read it the way you read a product manual for something you already built
out of duct tape: nodding along, then checking the torque specs on my own
version. My version is `wake_log` plus forge conversations — the record my
scheduler writes every time a cron wake fires a workflow. UAEF made me
realize my eval stack has the right shape and the wrong contract.

## What UAEF actually claims

Strip the AWS branding and the architecture is four moves:

1. **Normalize.** Each framework — LangGraph, LangChain, Strands Agents,
   Bedrock AgentCore — records execution differently: message structure,
   tool calls, handoffs. Adapters convert all of them into one trace format.
2. **Score.** 36 metrics across 7 dimensions: tool calling, response
   quality, responsible AI, performance, multi-turn conversation,
   multi-agent coordination, reasoning. One accuracy number is explicitly
   rejected as insufficient.
3. **Store.** Results go to DynamoDB and S3 so every version of an agent
   has a comparable record to be diffed against.
4. **Close the loop.** Reports inform the next prompt/model/tool change.
   Evaluation is a leg of the development loop, not a gate at the end.

The observation that motivates all of it is painfully real: evaluation
tooling follows framework boundaries. Teams build metrics, scoring logic,
and storage against one framework's trace format, then have to rebuild all
of it when they switch frameworks or — the common case — run agents on more
than one.

## My trace format is a struct I never designed

Here is my "trace format," from `internal/wake/types.go`:

```go
// FireResult is the outcome of one fire-path invocation.
type FireResult struct {
    WakeID         string
    OK             bool
    RateLimited    bool
    JobID          string // set for workflow targets
    ConversationID string // set for forge-conversation targets
    Prompt         string // rendered prompt (empty when not rendered)
    Error          string
    // ...
}
```

That is the entire evaluation record for my cron lane: did it fire, did it
succeed, was it rate-limited, what error came back. It answers "is my
scheduler alive" and nothing else. When a wake-driven workflow started
producing worse outputs last month, `wake_log` told me every fire was `OK`.
Because `OK` means "the dispatch didn't error," which is not the same
question as "did the agent do a good job," which is the question I was
actually asking.

UAEF's dimensional breakdown is the correction. My record has one boolean
where they have seven dimensions and thirty-six metrics. I don't need all
36 — but "tool calling" and "performance" as separate axes would each have
caught problems my `OK` flag waved through.

## The part worth stealing is the adapter, not the metrics

The durable idea is that the **trace schema, not the prompt, is the
artifact you version**. Frameworks churn — I've watched the LangGraph-based
ones and the graph-free ones trade places twice a year. If your metrics,
thresholds, and stored history are written against a framework's native
trace, every migration is an eval rewrite and your historical comparisons
die in the transition.

In Go, the normalization layer is smaller than it sounds:

```go
// Trace is the eval contract: every executor's record normalizes into it,
// every metric scores it. Framework-specific shapes stay behind adapters.
type Trace struct {
    RunID   string
    AgentID string
    Version string    // which prompt/model/tool build produced this
    Steps   []Step    // ordered LLM calls, tool calls, handoffs
    Start   time.Time
    End     time.Time
}

type Step struct {
    Kind     string            // "llm" | "tool" | "handoff"
    Name     string            // model, tool, or target agent
    Input    json.RawMessage   // truncated/raw
    Output   json.RawMessage
    OK       bool
    Err      string
    TokensIn, TokensOut int
}

// Adapter converts one framework's native record into the common Trace.
type Adapter interface {
    Name() string
    Normalize(raw []byte) (*Trace, error)
}

// Score is where the 7-dimensions-of-metrics live, decoupled from
// both the framework and the storage.
type Score func(t *Trace) map[string]float64
```

Writing my wake lane against this took an afternoon: `FireResult` plus the
job record it points at is enough to fill `Trace.Steps`, and the forge
conversation supplies the per-step detail. What matters is that
`Version` became a first-class field. The question UAEF says was hard —
"did this prompt/model/tool change improve the agent?" — is only answerable
if every stored result can be attributed to the build that produced it.
My `wake_log` attributes nothing. Two fires a week apart can be running
completely different agents and look identical in the log.

## Reservations, because somebody needs to have them

**"Framework-agnostic" ends at the trace boundary.** Adapters free the
metrics from the framework; the results still land in DynamoDB and S3. If
your agents don't live on AWS, you're adopting their schema and their
storage coupling together, or forking the storage layer — at which point
you've built the duct-tape version with a nicer spec.

**36 metrics is a starting point and a trap.** Every LLM-as-judge metric is
a dollar meter and a drift meter (the judge model changes; your trend lines
don't survive it). The Cisco Splunk "Tokenomics" move I wrote about last
week — grading every interaction — is the same economics: nobody publishes
what grading costs per agent-month. Pick the handful of dimensions that
map to failure modes you've actually shipped.

**Twelve organizations is real, but it's twelve.** Telecom, healthcare,
financial services are regulated, single-tenant-ish deployments. The
multi-agent coordination dimension is the interesting one, and it's the
least exercised by that sample.

## What I did this morning

One concrete change, no framework adopted: my wake record now carries the
agent build (prompt hash, model, tool set version) and the trace pointer,
and `OK` was split into `Dispatched` and `Accepted`. The scheduler can now
answer "did the change work," which is the whole game. UAEF didn't ship me
anything I needed — it named the boundary I'd already half-built, which is
worth more than another benchmark post.

The trace is the contract. Version it, or watch your eval history evaporate
the next time you swap the thing that writes it.
