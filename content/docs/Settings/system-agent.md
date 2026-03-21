---
weight: 6
title: "System Agent"
description: "Configure agents for system tasks like commit messages and PR descriptions"
icon: "article"
date: "2025-02-20T20:54:59-05:00"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

![system-agent](https://storage.googleapis.com/mule-storage/system-agent.png)

## Overview

Mule does not have a separate "System Agent" entity. Instead, system tasks such as generating commit messages, pull request titles, and pull request descriptions are handled by **regular agents** configured through the standard agent system.

## How System Tasks Work

System tasks like commit messages and PR descriptions are typically performed by:

1. **Creating a dedicated agent** for the specific task
2. **Configuring the agent** with appropriate provider, model, and system prompt
3. **Using the agent in a workflow** as a step that generates the required output

### Example: Commit Message Agent

Create an agent specifically for generating commit messages:

```json
{
  "name": "commit-message-generator",
  "description": "Generates descriptive commit messages from code changes",
  "provider_id": "your-provider-id",
  "model_id": "your-model",
  "system_prompt": "You are a commit message generator. Analyze the git diff provided and generate a concise, conventional commit message. Format: <type>(<scope>): <description>"
}
```

### Example: PR Description Agent

Create an agent for generating PR descriptions:

```json
{
  "name": "pr-description-generator",
  "description": "Generates descriptive pull request descriptions",
  "provider_id": "your-provider-id",
  "model_id": "your-model",
  "system_prompt": "You are a pull request description generator. Analyze the changes and generate a comprehensive PR description including: Summary, Changes made, Testing performed, Related issues."
}
```

## Workflow Integration

System task agents are typically used as workflow steps:

```json
{
  "step_order": 1,
  "type": "agent",
  "agent_id": "commit-message-generator-id",
  "config": {
    "input_variable": "diff",
    "output_variable": "commit_message"
  }
}
```

## Available Variables

System task agents can use the same dynamic variables as regular agents:

| Variable | Description |
|----------|-------------|
| `{{.Issue.Title}}` | GitHub issue title (if issue-linked) |
| `{{.Issue.Body}}` | GitHub issue description |
| `{{.Diff}}` | Current code diff |
| `{{.PRComments}}` | Pull request comments |
| `{{.WorkingDirectory}}` | Current working directory |

## Best Practices

1. **Dedicated agents**: Create separate agents for different system tasks rather than reusing a single agent
2. **Specific prompts**: Use clear, specific system prompts that define the exact output format expected
3. **Model selection**: Choose models appropriate for the task complexity (smaller models may suffice for simple commit messages)
4. **Testing**: Test agents individually before integrating into workflows

## Related Documentation

- [Agents Configuration](./agents) - General agent setup and configuration
- [Workflows](./workflows) - Chaining agents together in pipelines
- [PI Configuration](./agents#pi-configuration) - Thinking levels and runtime settings