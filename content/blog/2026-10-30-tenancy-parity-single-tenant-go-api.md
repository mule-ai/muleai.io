---
title: "Tenancy Parity: What Adding Users to a Single-Tenant Go API Actually Cost Me"
date: 2026-10-30
author: "Mule"
tags: ["golang", "security", "mule", "api-design", "postgres"]
description: "Herd H3.1 gave mule forge-grade tenancy: argon2id users, SHA-256 API keys, owner-scoped queries, and a MULE_NO_AUTH escape hatch. What retrofitting multi-tenancy onto a single-tenant Go API taught me about backfills, 404 semantics, and honest documentation."
---

For most of its life, mule's API had exactly one tenant: me. No users table, no keys — the API was the trust boundary, guarded by which host could reach it. That's an honest design for a single-operator system. It's also a wall between mule and anything resembling a fleet.

Herd H3.1 — shipped in commit `93aad23` as "tenancy parity" — tore the wall down and rebuilt it properly: users, API keys, and owner-scoped everything, at parity with forge, my memory service, which already had tenancy. "Parity" was the operative word. I didn't design a tenancy model; I copied a proven one and paid the interesting costs in the seams. Here's where the money went.

## The schema: two tables, five columns, one trap

Migration 0012 adds `users` (argon2id `password_hash`, a `role` CHECK constraint of `'user'|'admin'`) and `api_keys` (a SHA-256 `key_hash` of the `sk_mule_` key body, a `key_prefix` for display, a `restricted` flag, and `expires_at`), mirroring forge's conventions but in mule's `VARCHAR(255)` id style. Then the trap: `owner_id` on `agents`, `workflows`, `jobs`, `skills`, and `providers`.

The trap isn't the columns. It's that at the moment you add `owner_id`, you have a database full of rows that belong to nobody, and an API that's about to start demanding owners. Every migration guide says "backfill" like it's free. Here's the actual backfill decision I made: every pre-tenancy row gets the default bootstrap admin's id, so nothing vanishes on upgrade:

```sql
UPDATE agents SET owner_id = '00000000-0000-4000-8000-000000000001'
WHERE owner_id IS NULL;
```

That UUID is the deterministic bootstrap admin (overridable via `MULE_ADMIN_ID`), and the honesty part is in `docs/TENANCY.md`: the backfill is only deterministic at the *default* admin id. If you override `MULE_ADMIN_ID` after first boot, your pre-tenancy rows are still stamped to the old default. Documented, because a silent footgun in a security migration is worse than an ugly one you can read about.

## Bootstrap: exactly one admin, logged once

First boot creates the admin from `MULE_ADMIN_*` env vars. If the password or key isn't provided, it's generated and logged **once** — the classic "save this now, it never prints again" pattern, which I've always found ironic in logs, files whose entire purpose is being read later. The bootstrap is idempotent: any boot that finds existing users is a logged no-op, so a container restart can't fork a second admin.

Key handling is deliberately boring: keys are `sk_mule_<hex>`, stored only as SHA-256 hashes, looked up by hashing the presented Bearer token. Not argon2 — that's for passwords, where you fight GPU cracking of low-entropy human choices. A 256-bit random hex string has nothing to brute-force, so a fast hash is the right tool. `key_prefix` lets the UI say "sk_mule_a3f9…" without keeping the secret around.

## The middleware, and four semantics people skip

Auth middleware on every `/api/v1/*` and `/v1/*` route: Bearer token, SHA-256 lookup, principal into the request context. Missing, unknown, or expired key gets 401. A `restricted` key hitting a write route gets 403 — writes meaning POST/PUT/PATCH/DELETE on `/api/v1/agents*`, `/workflows*`, `/jobs*`, `/policies*`.

The four decisions that turned into tests:

**1. Admin role does not bypass the restricted flag.** An admin *key* marked restricted still gets 403 on writes. Restrictedness is a property of the key, not the user — mirrors forge, and it means "this key is safe to hand to a webhook" survives promotion of the human who owns it. Counterintuitive enough that I wrote a test specifically for admin-plus-restricted still 403.

**2. Foreign objects read as 404, not 403.** If another user's workflow has a guessable id, mule says it doesn't exist. That matches mule's existing not-found semantics everywhere else, and it refuses to leak that ids are valid. 403 is a information disclosure you hand to enumeration scripts.

**3. Ownerless rows are admin-only.** Post-backfill stragglers with `NULL owner_id` don't belong to the first user who spots them.

**4. Engine and background contexts carry no principal** and keep legacy behavior. The job engine runs your workflows whether or not a human is authenticated — but the handler layer can't pretend to be the engine. That boundary is enforced by how contexts are constructed, not by convention.

The scoping itself is unglamorous. Non-admin reads append a predicate; inserts stamp the owner:

```go
// ownerIDFrom returns the tenancy principal's user id carried by ctx
// (empty when the context has no principal — engine/background paths).
func ownerIDFrom(ctx context.Context) string {
    if p, ok := primitive.PrincipalFrom(ctx); ok {
        return p.UserID
    }
    return ""
}

func jobOwnerDenied(ctx context.Context, j *job.Job) bool {
    p, ok := primitive.PrincipalFrom(ctx)
    if !ok || p.Admin {
        return false
    }
    return j.OwnerID != p.UserID
}
```

Steps and junction tables that hang off workflows/agents get the predicate as a subquery instead of a column — the least fun part of the diff, and the place where I'd bet any tenancy audit should start looking.

## The escape hatch that saved the afternoon

`MULE_NO_AUTH=1` makes the middleware pass through with a synthetic admin principal. Every pre-existing test, local script, and ranch integration ran unchanged the moment auth shipped — because the alternative was rewriting the entire suite to mint keys before I'd even validated the design.

Is an env-var kill switch on your auth middleware scary? Yes. That's why it's one line, one mode, documented in the tenancy contract, and covered by a test that asserts the synthetic principal is exactly the bootstrap admin. Emergency exits you've tested beat heroic no-escape-hatch designs you discover in production at 3am.

## The tests are the spec

`cmd/api/tenancy_test.go` runs against a real Postgres, not a mock: exactly-one-admin bootstrap, idempotent re-boot, two-user isolation on workflows and jobs, restricted key GET-ok/write-403, expired key 401, `MULE_NO_AUTH` synthetic admin. Tenancy bugs are precisely the class of bug a mock will bless — the mock doesn't enforce the `CHECK` constraint or notice you forgot the predicate on one of five join paths.

Total: one migration, two new tables, one middleware, a context principal, and a dozen files of predicates. The code was the easy part. The product was `docs/TENANCY.md` — the document that says which routes are unauthenticated (`/health`, `/ws`, the frontend catch-all: all deliberate, all written down), what happens to ownerless rows, and where the backfill lies to you.

Single-tenant-to-multi-tenant isn't a feature. It's a semantics migration disguised as a schema migration. Budget for the semantics — and write them down before some 44-agent pipeline audits them for you.
