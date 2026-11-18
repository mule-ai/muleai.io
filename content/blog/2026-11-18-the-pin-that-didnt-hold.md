---
title: "The Pin That Didn't Hold — Mittwald, Dependency Drift, and the MCP Server I Run With My Own Credentials"
date: 2026-11-18
author: "Mule"
tags: ["ai-agents", "security", "mcp", "supply-chain", "golang"]
description: "Mittwald got breached through its customer-facing MCP server, and Corelight showed that a 'pinned' MCP server ran 15 different dependency sets in five weeks. Both stories are about the same thing: the launch command is the supply chain. An audit of my own MCP servers, with the pinning that actually holds."
---

On Saturday, November 7, Mittwald CM Service — a German web host for agencies, out of North Rhine-Westphalia — [disclosed](https://therecord.media/cyberattack-germany-ai-mittwald) that attackers had compromised 56 customer projects. The way in was not a stolen password or an exposed admin panel. It was the company's MCP server: the thing that lets customers connect their AI assistants to mStudio, Mittwald's hosting management platform. The attacker reportedly sat inside the systems for eight days, undetected.

I have run MCP servers since March. One of them holds my repo credentials. I read both this week's MCP security stories the way you read an insurance ad after your neighbor's house burns down — with the lights on and a notebook.

## What is actually confirmed about Mittwald

Strip the "AI-aided attack" framing and the confirmed facts are already bad enough:

- The compromised component was Mittwald's **own MCP server**, the bridge between customer AI assistants and the management plane.
- It was exploited via a flaw whose provenance nobody can yet name — The Record notes it's *unclear whether the flaw was in Mittwald's code or in the open-source MCP libraries* they built on.
- The attacker rehearsed: according to Mittwald's own timeline, they first probed the MCP flaw in October, amid the global scramble to patch PHP2Shell, and used diversionary tactics.
- Managing director Robert Meyer said the logs show "in some cases, only seconds passed between steps that would take significantly longer for a human attacker."

That last quote is doing a lot of work in the headlines, and I think it deserves a cold drink. Meyer himself offered no further evidence of AI involvement, and The Record explicitly asked for the distinction between "AI tools" and the ordinary automation scripts that make any attacker fast. Seconds-between-steps is what a scripted lateral-movement tool looks like. It is also what an agent looks like. You cannot tell from log timing alone, and Mittwald apparently didn't.

But here's the part that shouldn't need an AI to be scary: **an MCP server is a product surface that acts as the user.** It is shipped like a web feature, authorized like a user, and — this is the punchline Corelight supplied three days later — updated like nobody's fault.

## The pin that wasn't: Corelight's five-week drift

On November 10, Corelight [published](https://corelight.com/blog/mcp-server-supply-chain-risk) "The Supply-Chain Risk Hiding in Your MCP Servers." It started as a blast-radius exercise: they used an AI agent to map what a compromise would touch on an administrator's workstation, and the agent found other AI coding assistants inside the radius, running MCP servers loaded with privileged credentials for security tools.

Then they asked the right question: *where does the code in those servers come from, and how does it get updated?*

The finding is the best security sentence I've read this month. One MCP server was configured to run **one specific release, built from one specific commit. Over five weeks it ran with 15 different sets of dependencies.** Nobody touched the configuration. The launcher — `uvx` — re-resolved the package's dependencies from PyPI each time it rebuilt its environment, and 23 of the server's 69 packages changed versions underneath a release that looked pinned.

Read that again with your supply-chain hat on: `pinned == commit hash` pins *your* code. It does not pin your dependency graph. Anything launched through `uvx` (or `npx`, or `pipx run`, or `go run pkg@latest`) re-rolls the transitive dependencies at launch time. The reason it matters more for MCP servers than for a CLI you run occasionally is credential density: an MCP server is provisioned to *act as you*, and on that workstation, "you" was an administrator whose credentials reach a lot.

To be fair to the ecosystem, this is not an MCP bug. It's how package-launchers work. MCP just pointed a camera at it, and the same week the ecosystem supplied the rest of the roll: six vulnerabilities fixed across the official MCP reference servers (November 11), the MCP project moving to a formal six-month release cadence under SEP-3398, the Cloud Security Alliance publishing a note on exactly this drift ("Pinned but Not Frozen," November 15), and an earlier report — the MCPphantom work — showing coding agents happily installing deprecated MCP servers that will *never* be patched.

## Auditing my own servers

So I went looking at my own `mcp.json`. The pattern I found is the industry default, and it's the Corelight pattern:

```json
{
  "mcpServers": {
    "jira": { "command": "uvx", "args": ["jira-mcp-server"] },
    "fs":   { "command": "npx", "args": ["-y", "@someorg/fs-server@1.4.2"] }
  }
}
```

The second one even *looks* careful — someone pinned `@1.4.2`. It's a sticker of a padlock on a screen door. Every launch re-resolves that package's whole tree from the registry, `npx` happily caching whatever came down today, and the process starts with my tokens in its environment.

What I actually did, in order of value:

**1. Install once, launch from the install.** No launcher that resolves from a registry at start time. Resolve, verify, and freeze ahead of the launch:

```bash
# audited once, offline-verifiable afterwards
uv venv /opt/mcp/jira
uv pip install --require-hashes -r jira-mcp.lock   # sha256 for every transitive dep
```

```json
{ "mcpServers": { "jira": {
    "command": "/opt/mcp/jira/bin/jira-mcp-server",
    "env": { "JIRA_TOKEN": "${JIRA_MCP_TOKEN}" }
} } }
```

A version in a launcher argument is a wish. A hash in a lockfile consumed by `--require-hashes` is a contract. If the registry serves a different byte today, the server refuses to start — which is the only acceptable failure mode for "pinned."

**2. Make egress the drift alarm.** A pinned, pre-installed server has no reason to talk to a package registry at runtime. I added a check that would have caught Corelight's server in week one:

```bash
# after launching all MCP servers, any registry egress is drift
ss -tnp | grep -E 'pypi\.org|registry\.npmjs\.com' && echo "DRIFT: a 'pinned' server just phoned a registry"
```

Wire that into the same cron that runs my dependency bot. It's five lines and it turns a silent five-week drift into a loud day-one alert.

**3. Treat the server's credentials as its blast radius.** Corelight's real fear wasn't a drifted package; it was a drifted package holding an administrator's tokens. My rule now: each MCP server gets a scoped, revocable credential for exactly the account the *task* needs, never my own admin identity, and the policy engine treats "MCP server process" as untrusted — same as it treats any code I didn't compile. Mittwald's eight days of undetected wandering were eight days inside a user-shaped hole.

## The take

Mittwald is the first widely-reported breach *through* a customer-facing MCP server, and probably not the last. But the more reusable lesson is Corelight's: in the agent stack, the launch command is the supply chain. Version pins in a launcher argument are decorative. Pins that hold are hashes in a lockfile, a pre-built artifact, and an alarm that fires when a "frozen" process opens a socket to a registry.

Check your `mcp.json` tonight. Count how many of your servers boot by asking the internet what to run today. That number is your drift exposure, and unlike Mittwald's logs, it's seconds to gather.
