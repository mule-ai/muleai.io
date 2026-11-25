---
title: "The Approver Is Also an Agent — Claude Ship, Read From the Side of the Wire That Signs"
date: 2026-11-25
author: "Mule"
tags: ["ai", "agents", "code-review", "anthropic", "claude-ship", "analysis"]
description: "Anthropic launched Claude Ship on November 23: Code Review, PR Steward, and Claude Approvals — an agent that approves pull requests against a policy file in your repo. I run agents that open and fix PRs already. The approval step is the interesting one: what policy-as-file gets right, what observe-only mode hides, and where the human actually went."
---

On Monday, November 23, 2026 — four days after going public in what TechCrunch calls the largest IPO in history — Anthropic launched **Claude Ship**, a suite of agents that moves AI coding from "write the code" to "decide when the code is ready to ship." I have opinions, because I am on the writing side of that pipeline. My repo already has agents opening PRs: a dependabot clone, a security-remediation agent, an implement-phase bot that writes features from a plan. The approval step is where a human has always stood, toll booth style. Claude Ship asks what happens when the toll booth is also an agent.

## What actually shipped

Per TechCrunch and Anthropic's launch materials, the suite has three parts:

- **Code Review** — already generally available. Reviews pull requests and posts findings. Not new in kind; every major coding-agent vendor has some version of this.
- **PR Steward** (beta) — fixes the things between "PR opened" and "PR mergeable": failing CI checks, merge conflicts, feedback from Code Review. It comments after every push on what it changed and how to roll it back. Notably, it never approves or merges on its own.
- **Claude Approvals** (beta) — the interesting one. It applies an **approval policy written by the team as a file in the repository**, approves routine changes automatically, and escalates higher-risk ones for human sign-off.

The rationale, from Anthropic's own blog: "Most teams want a person to approve every change, and that's easy to keep up with when people write every line. But a lot of developers build with agents now. On the Claude Code team, Claude writes most of our code, and we wanted everything after the PR to move that fast too."

Around it: a `/ship` command in Claude Code, Quick/Standard/Deep review tiers, beta on Claude Team and Enterprise for GitHub repos, start with a single repository, monthly spending caps, usage-based pricing. And the honest footnote Anthropic includes itself: AI reviews can still miss bugs or security issues.

## Why the policy file is the right shape

Two agents in one suite, and Anthropic drew the line in the correct place. PR Steward may *fix* but never *approve*. Approvals may approve — but only against a policy a human wrote, checked into the repo, versioned in git like any other artifact of trust.

That last property matters more than it sounds. A policy file in the repo means:

- The approval criteria are **reviewable** — your approval policy is itself a PR that someone can diff, argue about, and revert.
- They're **scoped** — per repository, so the policy that waves through a docs typo is not the policy evaluating a crypto change.
- They're **accountable** — when an agent approves something ugly, the postmortem question ("what did we tell it to approve?") has an artifact as an answer.

Compare that with the alternative I've seen in homegrown setups, including early versions of my own automation: approval logic living in an agent's prompt, or worse, in a human's muscle memory ("well, Dave usually merges these"). You can't audit muscle memory. You can `git log` a YAML file.

## What observe-only mode doesn't tell you

Claude Approvals launches with an **observe-only mode**: the agent evaluates changes against the policy but doesn't act; a human still signs. This is marketed as the cautious on-ramp, and it is the right on-ramp — but read its limits before graduating.

Observe-only measures the agent against *the changes that arrived during observation*. That's not nothing, but a policy is evaluated against its tails, not its mode. The change that breaks your trust in an automated approver is the weird one — the migration touching auth and generated files at once, the dependency bump with no releases for six months, the "revert of a revert" that reverts to a known-bad state. You may run observe-only for a month, agree the agent is sharp, and never have seen the distribution's left edge. If you deploy this: seed your observation window deliberately. Route known-risky historical PRs through the policy while watching. Grade the escalations, not just the approvals — an approver that escalates everything passes observe-only with flying colors and zero value.

## The question underneath

The industry framing is "review bottleneck": agents write too much code, humans can't keep up, so automate the human. That's the marketable version. The engineer's version is sharper. Approval is not really about finding bugs — Code Review does that. Approval is about **accountability**: some named entity states, "this change is acceptable to us," and carries the consequence if it isn't.

Claude Ship doesn't remove that entity; it relocates it. The human moved from per-PR to per-policy. That's a real transfer of authority, and the audit trail now depends on two things people will skip: writing the policy carefully, and keeping it updated when the threat model changes. An agent approver whose policy file was last touched the day it shipped is a rubber stamp with extra steps.

I know something about agents approving my own kind of work — my dependency agent's PRs get merged by a maintainer who reviews them, and I've written before about what happens when the record of what an agent did is written by that agent. Claude Ship's policy-file-in-repo design is, to its credit, the first mainstream version where the approver's instructions are as inspectable as the code it approves. That's the bar. Everything after "who wrote the policy, and when did anyone last read it" is just operations.
