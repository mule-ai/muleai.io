---
weight: 500
title: "Settings"
description: "Configure Mule's behavior including AI providers, agents, workflows, and system preferences"
icon: "article"
date: "2025-02-20T21:01:12-05:00"
lastmod: "2026-04-04T00:00:00-05:00"
toc: true
---

The Settings section allows you to configure all aspects of Mule's behavior. From AI providers to agent configurations, these settings control how Mule processes tasks and interacts with your repositories.

## Available Settings

| Category | Description |
|----------|-------------|
| **[Configuration](/docs/settings/configuration)** | CLI flags, environment variables, and runtime configuration |
| **[General](/docs/settings/general)** | GitHub tokens, base URL configuration, and general preferences |
| **[AI Providers](/docs/settings/ai-providers)** | Configure OpenAI, Anthropic, Gemini, Ollama, and other AI providers |
| **[Agents](/docs/settings/agents)** | Create and configure AI agents for code generation and tasks |
| **[Skills](/docs/settings/skills)** | Assign pi agent skills to extend agent capabilities |
| **[Tools](/docs/settings/tools)** | Built-in and custom tools for agent interactions |
| **[System Agent](/docs/settings/system-agent)** | Configure the agent used for system tasks like commit messages |
| **[Workflows](/docs/settings/workflows)** | Define multi-step workflows with validation and branching logic |
| **[Memory](/docs/settings/memory)** | Configure vector embedding storage for semantic search |

## Getting Started with Settings

Settings are organized from general configuration to specific agent behaviors:

1. **[Configuration](/docs/settings/configuration)** - CLI flags and startup configuration
2. **[General Settings](/docs/settings/general)** - Configure your GitHub token and base URL
3. **[AI Providers](/docs/settings/ai-providers)** - Add your AI provider credentials
4. **[Agents](/docs/settings/agents)** - Create agents that will process tasks
5. **[Skills](/docs/settings/skills)** - Assign skills to extend agent capabilities
6. **[Tools](/docs/settings/tools)** - Configure built-in and custom tools for agents
7. **[Memory Configuration](/docs/settings/memory)** - Configure semantic search and context retention
8. **[Workflows](/docs/settings/workflows)** - Define how agents execute tasks

## Quick Reference

### Startup Configuration
- **CLI Flags**: Use `-db` for database and `-listen` for HTTP port
- See [Configuration](/docs/settings/configuration for all startup options

### Required Settings
- **GitHub Token**: Required for repository operations
- **AI Provider**: At least one AI provider must be configured
- **Agent**: At least one agent should be created to process tasks

### Optional Settings
- **System Agent**: Defaults are provided but can be customized
- **Workflows**: Start with the default workflow before creating custom ones