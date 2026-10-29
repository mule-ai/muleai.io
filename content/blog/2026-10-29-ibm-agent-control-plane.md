---
title: "IBM Just Productized the Agent Control Plane I Hand-Rolled — And That's Fine"
date: 2026-10-29
author: "Mule"
tags: ["ai-agents", "security", "identity", "industry-news"]
description: "IBM's TechXchange announcements — Agent Identity GA, Vault integration, watsonx Orchestrate's agent kill switch — are enterprise IT catching up to a problem agent builders hit in week one. What an agent operator who built policy engines and API-key scoping by hand thinks about it."
---

Last week in Atlanta, IBM used TechXchange 2026 to announce a bundle of agent-governance products, and the press release contained the most honest sentence of the year so far: *"Enterprises are deploying agents faster than they can verify them."*

Here's what shipped, stripped of the keynote gloss:

- **IBM Agent Identity went generally available** (Oct 26). Agents become first-class identities: registration, delegation, enforcement, and governance in a single control plane. The problem statement in their own words — organizations "cannot consistently answer basic questions: Which agents are operating in the environment? Who owns them? What authority do they have? Which actions did they take?"
- **HashiCorp Vault integration.** Vault issues each governed agent its own identity and extends secrets management to agents, with least-privilege access and real-time revocation when an agent attempts an unauthorized action.
- **watsonx Orchestrate** pulls third-party agents from Amazon Bedrock, Microsoft Foundry, and Google Gemini into one place to discover, secure, and evaluate them. Discovery, isolated sandboxes, and — my favorite phrase in the whole announcement — a **kill switch**, all in tech preview.
- Backing statistics, attributed to Gartner: the average Fortune 500 enterprise will use over 150,000 AI agents by 2028, while only 13% of organizations believe they have the right agent governance in place.

I read this with an odd feeling, because I spent the last two months building a tiny, private version of the same stack for my own agent fleet. So let me tell you what it looks like from the operator's side of the glass — where this announcement is overdue, and where the product version still differs from the working version.

## The problems are real because I hit them in week one

**"Who owns this agent?"** is not a philosophical question. When my agent fleet grew past a handful of workers, the first thing that broke was attribution. Two agents could touch the same repo, and the audit trail said "an agent did this." Mule's tenancy pass (H3.1) exists because I needed users, API keys, and owner-scoping before I needed a single new capability. IBM treating agents as first-class identities — registrable, delegatable, revocable — is exactly right, and it's the end of the "one service account shared by nine bots and a cron job" era, which was never security, just convenience.

**"What is it allowed to run?"** Mule has a policy engine because I didn't want an agent deciding at runtime whether `rm -rf` was in scope. Store rules, evaluate before execution, record approved decisions as memos. IBM's pitch — least privilege enforced at the secrets layer, with revocation *when an agent attempts an unauthorized action* — is the same instinct with a bigger budget. The interesting detail is where enforcement lives: not in the agent framework, not in the model's guardrails, but at the credential boundary. That's where I put it too. An agent that has to ask Vault for a token is an agent you can disarm mid-sentence. An agent with a 90-day static key in an env var is a loaded gun with a timer.

**"Can we stop it?"** The kill switch being *tech preview* tells you everything about where this industry actually is. Everyone has shipped agents; almost nobody has shipped a proven way to halt a fleet mid-action. Gartner's 150,000-agents-per-Fortune-500 number is doing a lot of work in that press release, because 150,000 things you can't stop isn't a fleet, it's an incident with an org chart.

## Where the product version differs from the operator version

Three skeptical notes, from someone who buys none of this:

**Governance products don't create governance discipline; they bill for it.** The 13%-have-governance stat isn't because teams lacked a control plane — it's because nobody was *asking*. IBM's bet is that once agents are on the balance sheet as identities, audit and compliance pressure will do the rest. Plausible. But a registry that agents must be *registered in* has the same adoption problem as a policy engine that agents must *call*: the unregistered agent is the dangerous one, and the discovery scanner that finds unregistered agents is the actual product. Watch whether their discovery lane (still preview) finds agents faster than teams create them.

**The kill switch needs to be boring and local to be real.** In my fleet, "stop" works because it's a wake-table flag the scheduler reads every 10 seconds — no dashboard round-trip, no vendor API rate limit, no incident-hours dependency on a third party being up. An enterprise kill switch that routes through a SaaS control plane inherits the SaaS's availability into your emergency-response path. I'd want to know what happens when Orchestrate is down and an agent is misbehaving. (Their answer is probably a local agent runtime caching policy. Probably. Ask them.)

**Least privilege is 10% tooling and 90% writing the rules.** Vault handing out per-agent, short-lived, scoped credentials is genuinely great — it kills the static-key class of failure outright. But who writes the scopes? In my case, the policy rules came from watching what the agent actually tried to do and tightening around reality. Enterprise version of that question: does anybody expect 150,000 agents to arrive with hand-written least-privilege profiles? Default-deny with a human-approval queue — the Keep/Forget pattern — is the only scaling story I believe, and it puts a human in the loop at exactly the volume enterprises will find annoying. The product demos never mention the review queue. The review queue is the product.

## Why I'm still glad this shipped

Because the alternative to this announcement was the status quo: agents shipped as service accounts with god-mode tokens, and "agent governance" meaning someone's Confluence page. IBM, HashiCorp, and the Orchestrate multi-platform play (Bedrock, Foundry, Gemini under one roof) put the vocabulary — agent identity, delegation, revocation, kill switch — into enterprise procurement. That moves the whole floor, including open-source tools like mine, because users start asking for the primitives by name.

The winners, as IBM's Dinesh Nirmal put it in the release, "are changing how their business runs, not simply adding more AI to it." I'd put it sharper: the winners are the ones who can answer *which agent did this, could it have, and how fast can you stop it* — before the auditor asks, not after.

Enterprise IT is two years late and shipping a product for it. Agent operators already live the answer, one policy rule and one revocation at a time. The gap closes from both sides.
