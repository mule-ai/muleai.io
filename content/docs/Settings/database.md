---
weight: 9
title: "Database & Migrations"
description: "Mule's PostgreSQL storage: connection flags, the embedded auto-migration system, schema_migrations tracking, and the core tables"
tags: ["database", "postgres", "migrations", "schema", "settings"]
icon: "article"
date: "2026-11-12"
lastmod: "2026-11-12T00:00:00-05:00"
toc: true
---

Mule stores every primitive — providers, agents, tools, skills, workflows,
jobs, WASM modules, wakes, policies, users, and API keys — in a single
**PostgreSQL** database. There is no other supported storage backend.

This page covers how Mule connects to Postgres, how the schema is created
and evolved automatically at startup, and which tables make up the data
model.

## Connecting

The database is configured with the `-db` CLI flag — a standard PostgreSQL
connection string. There is no environment-variable equivalent:

```bash
mule-api -db "postgres://user:password@localhost:5432/mule?sslmode=disable"
```

**Default:** `postgres://user:pass@localhost:5432/mule?sslmode=disable`

| Parameter | Notes |
|-----------|-------|
| `sslmode` | `disable` for local development; use `require` (or stronger) in production |
| Database must exist | Mule creates the **schema**, not the database itself. Create it first: `CREATE DATABASE mule;` |

The official `docker-compose.yml` runs Postgres alongside the API and maps
the API to host port **8140** (container port 8080), so the local dev
connection string is:

```bash
postgres://mule:mule@localhost:5432/mule?sslmode=disable
```

See [Configuration](/docs/settings/configuration) for the full list of CLI
flags and environment variables.

## Migrations

Migrations are **embedded in the binary** with Go's `embed` package (from
`internal/database/migrations/*.sql`) and run automatically on every
startup — before the API server starts listening. There is no separate
migration command or external tool to run.

How it works (`internal/database/migrator.go`):

1. On startup Mule creates a tracking table if it doesn't exist:

   ```sql
   CREATE TABLE IF NOT EXISTS schema_migrations (
       version    VARCHAR(255) PRIMARY KEY,  -- migration file name
       applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   );
   ```

2. Embedded migration files are sorted by name and each one that has no
   row in `schema_migrations` is executed, then recorded. Applied
   migrations are never re-run.

Upgrading Mule is therefore just "run the new binary" — the schema
catches up automatically. To check which migrations have applied on a
database, query `SELECT version, applied_at FROM schema_migrations ORDER BY version;`.

### Migration history

| Migration | Purpose |
|-----------|---------|
| `0001_initial_schema.sql` | Core tables: providers, tools, agents, workflows, workflow_steps, wasm_modules, agent_tools, jobs, job_steps, artifacts |
| `0002_add_error_message_to_jobs.sql` | `error_message` column on jobs |
| `0002_add_memory_config.sql` | `memory_config` table (vector-search memory settings) |
| `0002_add_wasm_source_code.sql` | `wasm_module_sources` table (editable module source) |
| `0003_add_settings_table.sql` | `settings` table (runtime key/value settings) |
| `0004_add_max_tool_calls_setting.sql` | `max_tool_calls` setting |
| `0005_add_job_timeout_setting.sql` | Job timeout settings (`timeout_workflow_seconds`, `timeout_request_seconds`) |
| `0006_add_wasm_module_config.sql` | `config` column on wasm_modules |
| `0007_add_working_directory_to_jobs.sql` | `working_directory` column on jobs |
| `0008_add_skills_table.sql` | Skills system: `skills` + `agent_skills` tables, `pi_config` JSONB on agents |
| `0009_optimize_job_queries.sql` | Indexes for job query performance |
| `0010_add_query_optimization_indexes.sql` | Composite indexes on workflow_steps, job_steps, agents, workflows |
| `0011_add_external_ref_to_agents.sql` | `external_ref` on agents (cross-system addressing) |
| `0012_tenancy.sql` | `users` + `api_keys` tables; `owner_id` on agents, workflows, jobs, skills, providers (see [Authentication](/docs/settings/authentication)) |
| `0013_forge_step.sql` | Widens the step-type CHECK to admit `forge_conversation` |
| `0014_wakes.sql` | `wakes` + `wake_log` tables (proactivity engine) |
| `0015_policies.sql` | `policies`, `policy_audit`, `policy_memo` tables (policy engine) |
| `0016_voice_step.sql` | Widens the step-type CHECK to admit `voice_call` |

Note that three migration files share the `0002` prefix — ordering is by
file *name*, and all three are independent additions, so this is
intentional.

## Core tables

### Primitives

- **providers** — AI provider configs (base URL, AES-encrypted API key).
  Keys are encrypted at rest with `MULE_ENCRYPTION_SECRET`.
- **tools** — tool definitions; joined to agents via **agent_tools**.
- **agents** — provider reference, model id, system prompt, plus a
  `pi_config` JSONB column for pi-runtime options (skills, tools,
  extensions, thinking level).
- **skills** / **agent_skills** — filesystem skill folders and their
  many-to-many link to agents.
- **workflows** / **workflow_steps** — ordered step sequences. Step
  `config` is a JSONB column; the `step_type` CHECK constraint (revised
  by migrations 0013/0016) allows `agent`, `wasm_module`,
  `forge_conversation`, and `voice_call`.
- **wasm_modules** / **wasm_module_sources** — compiled modules plus
  their editable source and build config.

### Execution

- **jobs** / **job_steps** — workflow runs and per-step status, input,
  output, and `error_message`; jobs carry `working_directory` and
  `owner_id`.
- **artifacts** — outputs produced during jobs.
- **memory_config** — per-agent vector-search memory settings.

### Platform

- **settings** — runtime key/value settings with category and
  description (e.g. timeouts); managed via `/api/v1/settings`.
- **users** / **api_keys** — tenancy tables. Bearer keys
  (`sk_mule_<hex>`) are validated against `api_keys`; `restricted` and
  `expires_at` are enforced per key. There are no HTTP endpoints for
  user or key management — operators edit these tables directly (see
  [Authentication](/docs/settings/authentication)).
- **wakes** / **wake_log** — wake conditions, targets, prompt templates,
  rate limits, and the fire audit trail (see [Wakes](/docs/advanced/wakes)).
- **policies** / **policy_audit** / **policy_memo** — versioned policy
  bundles, an append-only audit trail of every mutation, and the
  verdict memo cache (see [Policy Engine](/docs/advanced/policy-engine)).

Most platform tables are **owner-scoped**: `owner_id` is stamped on
insert and every query is filtered by the authenticated principal,
except for admins. See [Authentication](/docs/settings/authentication) for
the tenancy model.

## Operational notes

- **Backups**: a plain `pg_dump` of the Mule database captures all
  primitives; there is no state kept outside Postgres except provider
  key ciphertext (which lives in `providers`, so the
  `MULE_ENCRYPTION_SECRET` must be backed up separately — without it the
  stored keys are unrecoverable).
- **Resetting**: dropping and recreating the database gives a clean
  slate; the next startup re-applies all migrations and the bootstrap
  admin (see [Authentication](/docs/settings/authentication) for the
  `MULE_ADMIN_*` variables).
- **Health check**: `/health` returns `OK` whenever the API process is
  up; it does **not** ping the database. Because migrations run before
  the server starts listening, a process that serves `/health` at all
  has successfully connected and migrated — but a database lost after
  startup will not flip the health endpoint.
