---
weight: 3
title: "GitHub Integration"
description: "Automate GitHub workflows using WASM modules in Mule"
icon: "article"
date: "2025-02-20T21:04:00-05:00"
lastmod: "2026-04-04T00:00:00-05:00"
toc: true
---

## Overview

Mule integrates with GitHub through WASM modules that you can incorporate into workflows. This approach provides flexibility to build custom GitHub automation that fits your specific needs.

GitHub WASM modules enable Mule to:

- Fetch and analyze GitHub issues
- Post comments on issues and pull requests
- Create branches and push code changes
- Create pull requests
- Track issue states through workflow stages
- Convert issues to markdown for processing

## How It Works

Unlike traditional integrations, Mule's GitHub automation is built on WebAssembly modules that execute within your workflows. This means you have full control over:

- **When** operations happen (trigger conditions)
- **What** operations occur (custom logic)
- **How** they integrate with AI agents

## Supported Operations

| Operation | WASM Module |
|-----------|-------------|
| Fetch issues | `github-issues` |
| Post comments | `github-comment` |
| Create branches | `git-branch-push` |
| Create worktrees | `git-worktree` |
| Create pull requests | `create-pull-request` |
| Track issue states | `issue-state-tracker` |
| Convert to markdown | `issues-to-markdown` |

## In This Section

- **[GitHub Integration](/docs/Repositories/adding-a-repository)** - Getting started with GitHub WASM modules
- **[GitHub WASM Modules](/docs/Repositories/interacting-with-a-repository)** - Detailed module documentation and examples

## Quick Example

Here's a simple workflow that fetches GitHub issues and creates a pull request:

```json
{
  "name": "issue-to-pr",
  "steps": [
    {
      "type": "wasm_module",
      "wasm_module_id": "github-issues",
      "config": { "repo_url": "https://github.com/owner/repo" }
    },
    {
      "type": "agent",
      "agent_id": "coding-agent",
      "input": "Generate code based on the issues"
    },
    {
      "type": "wasm_module",
      "wasm_module_id": "create-pull-request",
      "config": { "owner": "owner", "repo": "repo" }
    }
  ]
}
```

---

## Next Steps

Ready to automate your GitHub workflows? Here's how to continue:

### Hands-On Tutorials
- [Working Directory Management](/docs/Tutorials/working-directory) - Use git worktrees for parallel processing
- [Building WASM Modules](/docs/Tutorials/building-wasm-module) - Create custom GitHub automation

### Advanced Features
- [Multi-agent Workflows](/docs/Advanced/multi-agent) - Coordinate agents for complex automation
- [Validation Functions](/docs/Advanced/validation) - Add quality gates to your workflows

### Configuration
- [Agents Configuration](/docs/Settings/agents) - Set up agents for GitHub operations
- [Workflows](/docs/Settings/workflows) - Define complete GitHub automation pipelines
