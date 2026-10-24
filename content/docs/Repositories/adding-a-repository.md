---
weight: 2
title: "GitHub Integration"
description: "Using WASM modules for GitHub automation in Mule workflows"
icon: "article"
date: "2025-02-20T21:04:16-05:00"
lastmod: "2026-04-02T00:00:00-05:00"
toc: true
---


> **Note:** Mule uses WASM modules for GitHub integration rather than a built-in repository management system. This provides flexible, customizable GitHub automation that you can incorporate into your workflows.

## GitHub Integration via WASM Modules

Mule provides pre-built WASM modules for GitHub operations that can be integrated into your workflows:

### Available GitHub WASM Modules

| Module | Description |
|--------|-------------|
| **create-pull-request** | Create GitHub pull requests from workflow outputs |
| **github-comment** | Post comments on issues and pull requests |
| **github-issues** | Query and process GitHub issues |
| **git-branch-push** | Create branches and push commits |
| **git-worktree** | Manage git worktrees for parallel development |
| **issue-state-tracker** | Track and update issue states |
| **issues-to-markdown** | Convert GitHub issues to markdown format |

See the [examples/wasm](https://github.com/mule-ai/mule/tree/main/examples/wasm) directory for implementation details.

## Using GitHub Integration in Workflows

### Creating a Pull Request

To create a GitHub pull request from a workflow:

```bash
# Example WASM module input for creating a PR
{
  "token": "your-github-token",
  "owner": "your-username",
  "repo": "your-repository",
  "title": "AI-generated PR Title",
  "base": "main",
  "body": "This PR was created automatically by Mule AI agent"
}
```

### Posting Comments

Post comments on GitHub issues or pull requests:

```json
{
  "token": "your-github-token",
  "owner": "username",
  "repo": "repository",
  "issue_number": 42,
  "comment": "This issue is being worked on by Mule AI agent"
}
```

### Creating Git Worktrees

Create isolated git worktrees for working on multiple issues simultaneously:

```json
{
  "token": "your-github-token",
  "owner": "username",
  "repo": "repository",
  "base_branch": "main",
  "worktree_branch": "mule/issue-42-fix-bug"
}
```

## Workflow Example: Issue to PR Pipeline

Here's how to build an automated GitHub workflow:

```json
{
  "name": "github-automation",
  "description": "Automatically process GitHub issues and create PRs",
  "steps": [
    {
      "step_order": 1,
      "type": "agent",
      "agent_id": "analysis-agent-uuid",
      "config": {
        "system_prompt": "Analyze the GitHub issue and propose code changes"
      }
    },
    {
      "step_order": 2,
      "type": "wasm_module",
      "wasm_module_id": "git-branch-push-uuid",
      "config": {
        "token": "${GITHUB_TOKEN}",
        "owner": "your-org",
        "repo": "your-repo"
      }
    },
    {
      "step_order": 3,
      "type": "wasm_module",
      "wasm_module_id": "create-pull-request-uuid",
      "config": {
        "token": "${GITHUB_TOKEN}",
        "owner": "your-org",
        "repo": "your-repo",
        "base": "main"
      }
    }
  ]
}
```

## Getting Your GitHub Token

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) or fine-grained token
3. Grant the `repo` scope for full repository access
4. Store the token securely and pass it to your WASM modules

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      Mule v2                             │
├─────────────────────────────────────────────────────────┤
│  REST API  │  WebSocket  │  Workflow Engine             │
├─────────────────────────────────────────────────────────┤
│  Agents  │  Skills  │  Providers  │  WASM Modules      │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                    │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  PI Coding Agent        │  ← AI execution
└─────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  GitHub WASM Modules                                     │
│  create-pull-request, github-comment, git-worktree, etc. │
└─────────────────────────────────────────────────────────┘
```

## Building Custom GitHub Automation

Create custom GitHub automation workflows by combining:

1. **Agent Step**: Use an AI agent to analyze issues or generate code
2. **WASM Module Step**: Execute GitHub operations (create PR, comment, etc.)
3. **Validation**: Add WASM modules for code validation or testing

This enables automation like:
- Autonomous bug fixing from issue descriptions
- Automated code review responses
- Continuous integration with AI assistance

## Related Documentation

- [Workflows](/docs/settings/workflows - Building multi-step automation
- [WASM Modules](/docs/advanced/wasm-modules - Custom WebAssembly integration
- [Agents](/docs/settings/agents - AI agent configuration
