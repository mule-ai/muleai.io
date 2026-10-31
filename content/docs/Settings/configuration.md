---
weight: 1
title: "Configuration"
description: "Configuration options for Mule including CLI flags, environment variables, and runtime settings"
icon: "article"
date: "2026-04-10"
lastmod: "2026-10-31T00:00:00-05:00"
toc: true
---

This page documents all configuration options for Mule, including CLI flags, environment variables, and runtime settings.

## CLI Flags

Mule's API server supports the following command-line flags:

### `-db`

PostgreSQL connection string for the database.

```bash
mule-api -db "postgres://user:password@localhost:5432/mulev2?sslmode=disable"
```

**Default:** `postgres://user:pass@localhost:5432/mulev2?sslmode=disable`

**Format:** `postgres://user:password@host:port/database?options`

**Options:**
| Option | Description | Default |
|--------|-------------|---------|
| `sslmode` | SSL connection mode | `disable` |
| `connect_timeout` | Connection timeout in seconds | `10` |

**Example with SSL:**
```bash
mule-api -db "postgres://user:pass@localhost:5432/mulev2?sslmode=require"
```

### `-listen`

HTTP listen address for the API server.

```bash
mule-api -listen ":8080"
```

**Default:** `:8080`

**Examples:**
```bash
# Listen on port 8080, all interfaces
-listen ":8080"

# Listen on specific interface
-listen "127.0.0.1:8080"

# Listen on port 8140 (recommended for development)
-listen ":8140"
```

## Docker Compose Configuration

When using Docker Compose, configure Mule via the `command` directive:

```yaml
services:
  mule:
    build: .
    ports:
      - "8140:8080"
    command: ["-db", "postgres://mule:mule@postgres:5432/mulev2?sslmode=disable", "-listen", ":8080"]
    depends_on:
      postgres:
        condition: service_healthy
```

## Environment Variables

While Mule primarily uses CLI flags and database-stored settings, the following environment variables are commonly used:

### Provider API Keys

Set your AI provider API keys as environment variables:

```bash
# Anthropic (Claude)
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenAI (GPT-4, GPT-4o)
export OPENAI_API_KEY="sk-..."

# Google (Gemini)
export GOOGLE_API_KEY="..."

# Ollama (Local models)
# No API key needed, but Ollama must be running locally
export OLLAMA_HOST="http://localhost:11434"
```

### Authentication & Tenancy

Mule's API is protected by API-key authentication. These environment variables control it:

| Variable | Purpose |
|---|---|
| `MULE_ADMIN_EMAIL` | Bootstrap admin email (default `admin@localhost`) |
| `MULE_ADMIN_PASSWORD` | Bootstrap admin password (generated and logged once if unset) |
| `MULE_ADMIN_API_KEY` | Bootstrap admin key, `sk_mule_<hex>` (generated and logged once if unset) |
| `MULE_ADMIN_ID` | Bootstrap admin user id (fixed default UUID) |
| `MULE_ENCRYPTION_SECRET` | 16/24/32-byte AES key encrypting provider API keys at rest — **required in production** |
| `MULE_NO_AUTH` | Set to `1` to disable auth for local development (synthetic admin principal) |

See [Authentication & Tenancy](/docs/settings/authentication) for full details on keys, restricted keys, and owner scoping.

### pi CLI Configuration

Mule uses the pi CLI for agent execution. The pi configuration directory should be accessible:

```bash
# Default location is ~/.pi/agent
# Mount it in Docker:
volumes:
  - /root/.pi/agent:/home/mule/.pi/agent:ro
```

## Database Settings

Database-related settings are configured through the API after startup:

### Database Connection

The database connection string is configured at startup via the `-db` flag. For security, avoid hardcoding passwords in scripts:

```bash
# Use environment variable
DB_PASSWORD="your-secure-password"
mule-api -db "postgres://mule:${DB_PASSWORD}@localhost:5432/mulev2?sslmode=disable"
```

### Database Health Check

Verify database connectivity:

```bash
curl http://localhost:8140/health
```

## Application Settings

Application settings are stored in the database and managed through the Settings API. Settings are seeded by database migrations; the API can read and update them (there is no create endpoint — see [Available Settings](#available-settings) for the seeded keys).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/settings` | List all settings |
| `GET` | `/api/v1/settings/{key}` | Get one setting (404 if the key does not exist) |
| `PUT` | `/api/v1/settings/{key}` | Update a setting's `value`, `description`, and `category` |

A setting object looks like:

```json
{
  "id": "max_tool_calls",
  "key": "max_tool_calls",
  "value": "10",
  "description": "Maximum number of tool calls allowed per agent execution",
  "category": "agent"
}
```

### Reading Settings

```bash
# List all settings
curl http://localhost:8140/api/v1/settings

# Get a single setting
curl http://localhost:8140/api/v1/settings/max_tool_calls
```

### Updating Settings

`PUT /api/v1/settings/{key}` requires the `key` field in the JSON body to match the URL key (a mismatch returns `400`), and the setting must already exist (unknown keys return `404`). `description` and `category` are overwritten from the body, so include them when updating:

```bash
# Set job timeout to 1 hour
curl -X PUT http://localhost:8140/api/v1/settings/timeout_job_seconds \
  -H "Content-Type: application/json" \
  -d '{
    "key": "timeout_job_seconds",
    "value": "3600",
    "description": "Maximum execution time for an entire job",
    "category": "engine"
  }'

# Raise the per-execution tool call limit
curl -X PUT http://localhost:8140/api/v1/settings/max_tool_calls \
  -H "Content-Type: application/json" \
  -d '{
    "key": "max_tool_calls",
    "value": "100",
    "description": "Maximum number of tool calls allowed per agent execution",
    "category": "agent"
  }'
```

### Available Settings

Seeded by migrations:

| Key | Default | Category | Description |
|-----|---------|----------|-------------|
| `timeout_workflow_seconds` | `300` | `engine` | Maximum execution time for a single workflow step |
| `timeout_request_seconds` | `360` | `api` | Maximum time for HTTP requests to the API server |
| `timeout_job_seconds` | `3600` | `engine` | Maximum execution time for an entire job |
| `max_tool_calls` | `10` | `agent` | Maximum number of tool calls per agent execution |

Values are always strings. See [General Settings](../general/) for details on the timeout keys.

> **Note:** The GitHub token is **not** a database setting — repository features read it from the `GITHUB_TOKEN` environment variable. AI provider credentials are managed via the [Providers API](../ai-providers/), not settings.

## Configuration Checklist

Before running Mule in production, verify the following:

### Required Configuration

- [ ] PostgreSQL database running and accessible
- [ ] Database connection string configured with `-db` flag
- [ ] Listen address configured with `-listen` flag
- [ ] At least one AI provider configured via API

### Recommended Configuration

- [ ] GitHub token set for repository operations
- [ ] Job timeout appropriate for your workflows (default: 3600 seconds)
- [ ] Max tool calls appropriate for your agents (default: 100)
- [ ] Memory/vector database configured for RAG features

### Optional Configuration

- [ ] Custom agents with specific capabilities
- [ ] WASM modules for custom validation
- [ ] Skills assigned to agents
- [ ] Webhook endpoints for integrations

## Troubleshooting

### Database Connection Issues

If Mule fails to connect to the database:

1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check the connection string format: `postgres://user:pass@host:port/db?sslmode=disable`
3. Test connectivity: `psql "postgres://mule:mule@localhost:5432/mulev2"`
4. Check logs: `docker-compose logs mule`

### Port Already in Use

If the listen port is already in use:

```bash
# Find what's using the port
lsof -i :8080

# Use a different port
mule-api -listen ":8140"
```

### pi CLI Not Found

If agent execution fails:

1. Verify pi CLI is installed: `pi --version`
2. Check the pi agent directory exists: `ls ~/.pi/agent`
3. Mount the pi directory in Docker:

```yaml
volumes:
  - /root/.pi/agent:/home/mule/.pi/agent:ro
```

## Related Documentation

- [Getting Started](/docs/getting-started) - Initial setup guide
- [Agents](/docs/settings/agents) - Agent configuration
- [AI Providers](/docs/settings/ai-providers) - Provider setup
- [Workflows](/docs/settings/workflows) - Workflow configuration
