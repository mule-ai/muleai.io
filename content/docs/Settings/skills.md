---
weight: 3
title: "Skills"
description: "Configure and manage pi agent skills to extend agent capabilities"
icon: "article"
date: "2026-03-28T00:00:00-05:00"
lastmod: "2026-03-28T00:00:00-05:00"
toc: true
---

![skills](https://storage.googleapis.com/mule-storage/skills.png)

Skills extend Mule agents with specialized capabilities using the pi agent framework. Skills can provide custom tools, prompts, and execution context that agents can use to accomplish specific tasks.

## Overview

Skills in Mule are pi agent skills that can be assigned to agents. Each skill provides specific functionality that the agent can leverage when processing tasks. Skills are loaded from skill directories containing a `SKILL.md` file that defines the skill's capabilities.

## Available Skills

Mule includes several built-in skills that can be assigned to agents:

### Search CLI Skill

Enables web search capabilities for agents. Useful for research tasks and fact-checking.

**Location:** `/root/.pi/agent/skills/search-cli/`

This skill allows agents to:
- Perform web searches using the search CLI tool
- Fetch webpage content and retrieve AI-powered summaries
- Look up information and research topics

### Actual Budget Skill

Provides integration with Actual Budget for financial queries. Enables balance checks, transaction history, and budget management.

**Location:** `/root/.pi/agent/skills/actual-budget/`

### Spec Plan Generator Skill

Generates comprehensive product specifications and development plans. Useful for planning new features or projects.

**Location:** `/root/.pi/agent/skills/spec-plan-generator/`

## Skill Management API

### List All Skills

```bash
curl http://localhost:8140/api/v1/skills
```

**Response:**
```json
{
  "data": [
    {
      "id": "skill-uuid",
      "name": "search-cli",
      "description": "Search the web using CLI tools",
      "path": "/root/.pi/agent/skills/search-cli",
      "enabled": true,
      "created_at": "2026-03-28T10:00:00Z",
      "updated_at": "2026-03-28T10:00:00Z"
    }
  ]
}
```

### Create a Skill

```bash
curl -X POST http://localhost:8140/api/v1/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom-skill",
    "description": "A custom skill for my agent",
    "path": "/path/to/skill/directory",
    "enabled": true
  }'
```

### Get a Skill by ID

```bash
curl http://localhost:8140/api/v1/skills/{id}
```

### Update a Skill

```bash
curl -X PUT http://localhost:8140/api/v1/skills/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "updated-skill",
    "description": "Updated description",
    "enabled": false
  }'
```

### Delete a Skill

```bash
curl -X DELETE http://localhost:8140/api/v1/skills/{id}
```

## Assigning Skills to Agents

### Get Skills Assigned to an Agent

```bash
curl http://localhost:8140/api/v1/agents/{agent_id}/skills
```

**Response:**
```json
{
  "data": [
    {
      "id": "skill-uuid",
      "name": "search-cli",
      "description": "Search the web using CLI tools"
    }
  ]
}
```

### Assign Skills to an Agent

```bash
curl -X PUT http://localhost:8140/api/v1/agents/{agent_id}/skills \
  -H "Content-Type: application/json" \
  -d '{
    "skill_ids": ["skill-uuid-1", "skill-uuid-2"]
  }'
```

### Remove a Skill from an Agent

```bash
curl -X DELETE http://localhost:8140/api/v1/agents/{agent_id}/skills/{skill_id}
```

## Creating Custom Skills

To create a custom skill for Mule:

### 1. Create Skill Directory

Create a directory for your skill with a descriptive name:

```bash
mkdir -p /root/.pi/agent/skills/my-custom-skill
```

### 2. Create SKILL.md

The `SKILL.md` file defines the skill's configuration and capabilities:

```markdown
# My Custom Skill

This skill provides custom functionality for Mule agents.

## Capabilities

- Feature 1: Description of what it does
- Feature 2: Another capability

## Usage

Describe how agents should use this skill.
```

### 3. Register the Skill

After creating your skill, you can register it via the API:

```bash
curl -X POST http://localhost:8140/api/v1/skills \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-skill",
    "description": "Custom functionality for agents",
    "path": "/root/.pi/agent/skills/my-custom-skill",
    "enabled": true
  }'
```

## Using Skills in Agents

When creating or updating an agent, you can assign skills directly:

```bash
curl -X POST http://localhost:8140/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "research-agent",
    "description": "Agent for researching topics",
    "provider_id": "provider-uuid",
    "model_id": "claude-sonnet-4-20250514",
    "system_prompt": "You are a research assistant. Use available tools to gather information.",
    "skill_ids": ["search-skill-uuid", "web-skill-uuid"]
  }'
```

## Best Practices

- **Select skills based on task requirements**: Only assign skills that the agent will actually use
- **Keep skills focused**: Each skill should have a clear, single purpose
- **Enable/Disable as needed**: Use the enabled flag to temporarily disable skills without removing them
- **Test skill combinations**: Some skills may have overlapping functionality - test combinations to find the best setup
- **Monitor performance**: Skills can affect agent response time - monitor and optimize as needed
