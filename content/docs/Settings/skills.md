---
weight: 3
title: "Skills"
description: "Register pi agent skills in Mule and assign them to agents: the skills table, the /api/v1/skills API, and how skill paths reach the pi runtime"
tags: ["settings", "skills", "tools", "agents", "pi"]
icon: "article"
date: "2026-03-28T00:00:00-05:00"
lastmod: "2026-11-16T00:00:00-05:00"
toc: true
---

Skills extend Mule agents with specialized instructions using the
[pi agent framework](/docs/advanced/pi-rpc-bridge). A skill is a directory on
disk containing a `SKILL.md` file; Mule registers such directories as records
in its database and hands their paths to the pi subprocess when an agent
runs.

## Overview

Mule does **not** ship any built-in skills. Every skill is created by an
operator (or an owner-scoped API user) by registering a name, description,
and filesystem `path` via the skills API. At agent start, the runtime
collects the paths of all *assigned and enabled* skills and launches the pi
child process with one `--skill <path>` flag per skill (see
`internal/agent/runtime.go` and `internal/agent/pirc`). Pi then advertises
each skill's name and description in the system prompt and loads the full
`SKILL.md` instructions only when a task calls for them.

Because the pi process runs on the same host as `mule-api`, a skill's `path`
must exist on the machine running the API — Mule stores and validates the
registration, not the skill contents.

A skill record looks like:

```json
{
  "id": "skill-uuid",
  "name": "search-cli",
  "description": "Search the web using CLI tools",
  "path": "/opt/pi/skills/search-cli",
  "enabled": true,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:00:00Z"
}
```

Skills are **owner-scoped**: the authenticated key's user is stamped as
`owner_id` on create, and list/get/update/delete only see the caller's own
skills (admins see all). See
[Authentication](/docs/settings/authentication) for the tenancy model.

## Skill Management API

### List All Skills

Returns the caller's skills ordered by name:

```bash
curl -H "Authorization: Bearer $MULE_KEY" \
  http://localhost:8140/api/v1/skills
```

**Response:**

```json
{
  "data": [
    {
      "id": "skill-uuid",
      "name": "search-cli",
      "description": "Search the web using CLI tools",
      "path": "/opt/pi/skills/search-cli",
      "enabled": true,
      "created_at": "2026-03-28T10:00:00Z",
      "updated_at": "2026-03-28T10:00:00Z"
    }
  ]
}
```

### Create a Skill

`name` and `path` are required; the response is the created skill (`201 Created`):

```bash
curl -X POST http://localhost:8140/api/v1/skills \
  -H "Authorization: Bearer $MULE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom-skill",
    "description": "A custom skill for my agent",
    "path": "/opt/pi/skills/custom-skill",
    "enabled": true
  }'
```

### Get a Skill by ID

Returns the bare skill object (no `data` wrapper):

```bash
curl -H "Authorization: Bearer $MULE_KEY" \
  http://localhost:8140/api/v1/skills/{id}
```

### Update a Skill

Full update — `name` and `path` are **required** on every `PUT`:

```bash
curl -X PUT http://localhost:8140/api/v1/skills/{id} \
  -H "Authorization: Bearer $MULE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "updated-skill",
    "description": "Updated description",
    "path": "/opt/pi/skills/updated-skill",
    "enabled": false
  }'
```

### Delete a Skill

Returns `204 No Content`:

```bash
curl -X DELETE http://localhost:8140/api/v1/skills/{id} \
  -H "Authorization: Bearer $MULE_KEY"
```

## Assigning Skills to Agents

Skills are linked to agents through the `agent_skills` join table. Assignment
is a full replacement (`PUT`), and a disabled skill stays assigned but is not
passed to pi.

### Get Skills Assigned to an Agent

```bash
curl -H "Authorization: Bearer $MULE_KEY" \
  http://localhost:8140/api/v1/agents/{agent_id}/skills
```

**Response:**

```json
{
  "data": [
    {
      "id": "skill-uuid",
      "name": "search-cli",
      "description": "Search the web using CLI tools",
      "path": "/opt/pi/skills/search-cli",
      "enabled": true
    }
  ]
}
```

### Assign Skills to an Agent

```bash
curl -X PUT http://localhost:8140/api/v1/agents/{agent_id}/skills \
  -H "Authorization: Bearer $MULE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "skill_ids": ["skill-uuid-1", "skill-uuid-2"]
  }'
```

### Remove a Skill from an Agent

```bash
curl -X DELETE http://localhost:8140/api/v1/agents/{agent_id}/skills/{skill_id} \
  -H "Authorization: Bearer $MULE_KEY"
```

Skills can also be assigned at agent-creation or agent-update time by
including a `skill_ids` array in the agent payload:

```bash
curl -X POST http://localhost:8140/api/v1/agents \
  -H "Authorization: Bearer $MULE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "research-agent",
    "description": "Agent for researching topics",
    "provider_id": "provider-uuid",
    "model_id": "claude-sonnet-4-20250514",
    "system_prompt": "You are a research assistant. Use available tools to gather information.",
    "skill_ids": ["search-skill-uuid"]
  }'
```

## Creating Custom Skills

### 1. Create the Skill Directory

Create a directory on the **API host** and put a `SKILL.md` inside it. Mule
only stores the path; pi reads the directory when the agent starts.

```bash
mkdir -p /opt/pi/skills/my-custom-skill
```

### 2. Write SKILL.md

Pi implements the [Agent Skills specification](https://agentskills.io/specification).
Start the file with `name` and `description` frontmatter, then give direct
instructions. The description decides when the model loads the skill, so
state both what it does and when to use it.

```markdown
---
name: my-custom-skill
description: Summarize incident reports into the on-call handoff format. Use when asked to write or format a handoff.
---

# My Custom Skill

Follow these steps when writing a handoff...
```

You can bundle scripts, reference docs, and assets alongside `SKILL.md`;
refer to them with paths relative to the skill directory.

### 3. Register the Skill

```bash
curl -X POST http://localhost:8140/api/v1/skills \
  -H "Authorization: Bearer $MULE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-skill",
    "description": "Summarize incident reports into the on-call handoff format",
    "path": "/opt/pi/skills/my-custom-skill",
    "enabled": true
  }'
```

Then assign the returned skill id to the agents that should have it (see
above).

## Best Practices

- **Assign selectively**: only assign skills an agent will actually use;
  every assigned, enabled skill adds its name and description to the pi
  system prompt.
- **Keep skills focused**: each skill should have a clear, single purpose,
  with a description that says *what* it does and *when* to use it.
- **Use `enabled` to toggle**: disable a skill to stop passing it to pi
  without removing the assignment.
- **Watch for overlap**: skills with overlapping descriptions can compete
  for the same tasks — test combinations.

## Related

- [pi RPC Bridge](/docs/advanced/pi-rpc-bridge) — how Mule drives the pi
  subprocess that consumes skills
- [Agents](/docs/settings/agents) — agent configuration and `pi_config`
- [API Reference](/docs/advanced/api-reference) — full endpoint tables
