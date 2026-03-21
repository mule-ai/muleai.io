---
weight: 500
title: "Settings"
description: "Configure Mule's behavior including AI providers, agents, workflows, and system preferences"
icon: "article"
date: "2025-02-20T21:01:12-05:00"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

The Settings section allows you to configure all aspects of Mule's behavior. From AI providers to agent configurations, these settings control how Mule processes tasks and interacts with your repositories.

## Available Settings

| Category | Description |
|----------|-------------|
| **[General](/docs/Settings/general)** | GitHub tokens, base URL configuration, and general preferences |
| **[AI Providers](/docs/Settings/ai-providers)** | Configure OpenAI, Anthropic, Gemini, Ollama, and other AI providers |
| **[Agents](/docs/Settings/agents)** | Create and configure AI agents for code generation and tasks |
| **[System Agent](/docs/Settings/system-agent)** | Configure the agent used for system tasks like commit messages |
| **[Workflows](/docs/Settings/workflows)** | Define multi-step workflows with validation and branching logic |

## Getting Started with Settings

Settings are organized from general configuration to specific agent behaviors:

1. **[General Settings](/docs/Settings/general)** - Start here to configure your GitHub token
2. **[AI Providers](/docs/Settings/ai-providers)** - Add your AI provider credentials
3. **[Agents](/docs/Settings/agents)** - Create agents that will process tasks
4. **[Workflows](/docs/Settings/workflows)** - Define how agents execute tasks

## Quick Reference

### Required Settings
- **GitHub Token**: Required for repository operations
- **AI Provider**: At least one AI provider must be configured
- **Agent**: At least one agent should be created to process tasks

### Optional Settings
- **System Agent**: Defaults are provided but can be customized
- **Workflows**: Start with the default workflow before creating custom ones