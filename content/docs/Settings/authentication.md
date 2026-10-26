---
weight: 2
title: "Authentication & Tenancy"
description: "API keys, admin bootstrap, MULE_NO_AUTH dev mode, restricted keys, and per-user data isolation in Mule"
icon: "article"
date: "2026-10-26T00:00:00-05:00"
lastmod: "2026-10-26T00:00:00-05:00"
toc: true
---

Every `/api/v1/*` and `/v1/*` endpoint in Mule requires authentication with an API key. This page covers how keys work, how the first admin is bootstrapped, development shortcuts, and how Mule isolates each user's data in multi-user (fleet) deployments.

## Overview

Mule implements multi-user tenancy (migration `0012_tenancy.sql`):

- Each user's **agents, workflows, jobs, skills, and providers** are invisible and inoperable to every other user.
- An **admin** role is available for fleet operators and sees all owners' data.
- **Tools, WASM modules, settings, and memory config are shared/global** by design.

Authentication is enforced by middleware on the API server (`internal/api/auth.go`):

| Route group | Auth required? | Notes |
|---|---|---|
| `/api/v1/*` | **Yes** | All management APIs (providers, agents, tools, skills, workflows, jobs, wakes, policies, WASM modules, settings, memory config) |
| `/v1/*` | **Yes** | OpenAI-compatible surface (`/v1/models`, `/v1/chat/completions`) |
| `/health` | No | Health probes must be reachable |
| `/ws` | No | WebSocket upgrades cannot carry a Bearer header |
| `/voice/{job_id}/*` | No | Per-call audio sockets; the 128-bit job id itself is the capability |
| Frontend (catch-all) | No | The web UI shell must be reachable |

## Using an API Key

Keys look like `sk_mule_<hex>`. Pass your key on every API request:

```bash
curl http://localhost:8140/api/v1/agents \
  -H "Authorization: Bearer sk_mule_<hex>"
```

The database stores only the SHA-256 hash of the key **body** (the hex after the `sk_mule_` prefix), never the key itself. For convenience, sending just the bare body (without the prefix) verifies against the same row.

Authentication failures use the standard JSON error shape:

| Condition | Status |
|---|---|
| Missing or malformed `Authorization` header | `401` |
| Unknown or expired key | `401` |
| Restricted key used on a write route | `403` |
| Key lookup error (database) | `500` |

## Bootstrapping the Admin

On first boot, Mule creates an operator admin user and API key automatically (`internal/api/bootstrap.go`). Any later boot with existing users is a no-op. Configuration is via environment variables:

| Env var | Default | Notes |
|---|---|---|
| `MULE_ADMIN_ID` | `00000000-0000-4000-8000-000000000001` | Fixed UUID so migration 0012's backfill and the bootstrap agree. If you override it, pre-tenancy rows keep the placeholder owner — migrate them explicitly. |
| `MULE_ADMIN_EMAIL` | `admin@localhost` | |
| `MULE_ADMIN_PASSWORD` | 24 random bytes, hex | **Logged once** at boot in a banner when generated |
| `MULE_ENCRYPTION_SECRET` | — | See below |
| `MULE_ADMIN_API_KEY` | `sk_mule_` + 32 random bytes, hex | **Logged once** at boot when generated. When you set it yourself, the value is used verbatim and never re-logged. |

Recommended flows:

- **Local dev**: set `MULE_ADMIN_EMAIL`, `MULE_ADMIN_PASSWORD`, and `MULE_ADMIN_API_KEY` in your environment so the key never appears in logs.
- **Fleet deployments**: set the same variables from your secrets store. Rotate keys by inserting a new `api_keys` row and deleting the old one — the bootstrap never touches a populated `users` table.

### Encrypting Provider API Keys

Provider API keys are encrypted at rest with AES using `MULE_ENCRYPTION_SECRET`, which must be **16, 24, or 32 bytes**:

```bash
export MULE_ENCRYPTION_SECRET="$(head -c 32 /dev/urandom | xxd -p)"
```

If unset, Mule falls back to a well-known built-in default (and logs a warning) so local development works — but that provides **no real secrecy**. Always set it in any real deployment; the server refuses to start if the value is not a valid AES key size.

## Development Mode: MULE_NO_AUTH

Setting `MULE_NO_AUTH=1` turns the auth middleware into a pass-through that attaches a **synthetic admin** principal (the default admin id) to every protected request:

```bash
export MULE_NO_AUTH=1
```

Consequences:

- Existing local integrations can call the API without keys.
- Rows created in this mode are owned by the default admin id, so enabling auth later does not strand the data — the default admin key can still reach it.
- The env var is read per request, so it can be toggled without a restart, and it does not change bootstrap behavior.

Only the exact value `1` enables the mode. **Never use this in production.**

## Restricted Keys

Each API key can be marked `restricted` (a column on the `api_keys` table). A restricted key — typically handed to an agent — may **read** everything but may not **write** these route classes with `POST`/`PUT`/`PATCH`/`DELETE`:

- `/api/v1/agents`
- `/api/v1/workflows`
- `/api/v1/jobs`
- `/api/v1/policies`

Three policy routes stay open to restricted keys, because they are agent decision surfaces rather than policy mutations:

- `POST /api/v1/policies/evaluate` — the before-tool-call policy query
- `POST /api/v1/policies/memo` — recording a decided verdict
- `POST /api/v1/policies/proposals` — agents *draft* rules here (a policy only exists after a non-restricted key approves the proposal)

A restricted key can still write providers, tools, skills, and WASM modules, and can still **execute** work via the OpenAI-compatible `/v1/chat/completions` surface.

> **Note:** The admin role does *not* bypass the restricted flag. `restricted` is a property of the **key**, not the user — admin + restricted still gets `403` on those routes. This is a deliberate design choice.

## Owner Scoping

The auth middleware attaches the caller's identity (and a principal with `UserID` + `Admin` flag) to the request context. Enforcement rules:

- **Non-admin users**: every list/get/update/delete on agents, workflows, jobs, skills, and providers is filtered by `owner_id`. Inserts stamp `owner_id` automatically. Workflow steps are scoped through their parent workflow; agent tool/skill assignments through their agent.
- **Admins**: see all owners' data; writes stamp the admin's own id.
- **Jobs**: `owner_id` is set at submission from the caller. Jobs with no owner are admin-only.
- **Foreign objects return `404`, not `403`** — existence of another user's data is never leaked.
- Background engine workers run without a principal and are deliberately not filtered: a submitted job is trusted to run the workflow it was created against.

## Managing Users and Keys

There are currently **no HTTP endpoints for user registration, login, or key minting**. Operators manage the `users` and `api_keys` tables directly in PostgreSQL:

```bash
# 1. Generate a key and compute the hash of its body (hex after the sk_mule_ prefix)
BODY=$(head -c 32 /dev/urandom | xxd -p)
HASH=$(printf '%s' "$BODY" | sha256sum | cut -d' ' -f1)

# 2. Insert the key for an existing user (key_prefix = first 12 chars of the body)
psql "$MULE_DB" -c "INSERT INTO api_keys (user_id, key_hash, key_prefix, restricted)
VALUES ('<user-id>', '$HASH', '${BODY:0:12}', FALSE);"

# 3. The operator uses the key as: Authorization: Bearer sk_mule_$BODY
```

Not covered yet: per-user isolation of tools, WASM modules, settings, memory config, artifacts, the `/ws` job stream, and an audit log.

## Troubleshooting

### `401 Unauthorized` on every API call

1. Confirm the header is exactly `Authorization: Bearer sk_mule_<hex>`.
2. Confirm the key exists: `SELECT key_prefix, expires_at FROM api_keys;` (only prefixes are stored, so match by prefix).
3. Check the key hasn't expired (`expires_at`).
4. For local development, `MULE_NO_AUTH=1` restores keyless access.

### `403` with a valid key

Your key is `restricted` and you're attempting a write on agents, workflows, jobs, or policies. Use a non-restricted key, or route execution through `/v1/chat/completions`.

### "MULE_ENCRYPTION_SECRET must be 16, 24 or 32 bytes"

The secret must be exactly 16, 24, or 32 **bytes** (AES key sizes). Note that a hex string is twice as long as the byte count it encodes.

## Related Documentation

- [Configuration](/docs/settings/configuration) — CLI flags and environment variables
- [AI Providers](/docs/settings/ai-providers) — provider keys encrypted at rest
- [Policy Engine](/docs/advanced/policy-engine) — the `/api/v1/policies` surface
- [Wakes](/docs/advanced/wakes) — wake endpoints and their auth requirements
