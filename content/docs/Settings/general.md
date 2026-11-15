---
weight: 1
title: "General"
description: "Mule's database-backed settings: timeout values, the tool-call setting, and how GitHub tokens and repository work are actually handled (WASM modules, not built-ins)."
tags: ["settings", "general", "configuration", "timeouts"]
icon: "article"
date: "2025-02-20T20:53:59-05:00"
lastmod: "2026-11-15T00:00:00-05:00"
toc: true
---

![general-settings](https://storage.googleapis.com/mule-storage/general-settings.png)

## Where settings live

Settings are rows in the `settings` table (`key`, `value`, `description`,
`category`) and are edited on the **Settings** page of the web UI, which lists
every row grouped by category and saves them through
`PUT /api/v1/settings/{key}`. Mule ships the rows below via
`internal/database/migrations/0003_add_settings_table.sql`,
`0004_add_max_tool_calls_setting.sql`, and
`0005_add_job_timeout_setting.sql`; you can add your own rows with the same
API. See [HTTP API Reference](/docs/advanced/api-reference/) for the endpoints.

## GitHub Token

Mule does **not** store a GitHub token as a setting or use it for built-in
repository features — there is no repository integration subsystem in the
server. GitHub automation is performed by **WASM modules** that take the token
as part of their per-step input, typically under a `token` field:

```json
{
  "token": "${GITHUB_TOKEN}",
  "owner": "your-org",
  "repo": "your-repo"
}
```

Pass the token through your own secret management (environment variable, CI
secret, or a `GITHUB_TOKEN` placeholder resolved by the caller) rather than
committing it to a workflow definition. For more information on creating a
GitHub Token, check out [their documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic).

### Token Permissions

For the shipped GitHub modules (`create-pull-request`, `github-comment`,
`github-issues`, `issue-state-tracker`, `issues-to-markdown`) the token needs:
- `repo` - Full control of private repositories (for accessing private repos)
- `read:user` - Read user profile data

## Timeout Settings

Mule uses several timeout settings to control workflow and request execution:

### `timeout_workflow_seconds`

Controls how long the server waits for a **synchronous** workflow execution
(`POST /v1/chat/completions` with a `workflow/…` model) to finish, and acts as
the base value for the HTTP request and write timeouts.

* **Default:** 300 (5 minutes)
* **Type:** Integer (seconds)
* **Used by:** `cmd/api/handlers.go` (sync chat-completion wait),
  `TimeoutMiddleware` and the `http.Server` write timeout in
  `cmd/api/server.go` (write timeout = this value + 2 minutes)

### `timeout_request_seconds`

Controls the maximum time for HTTP requests to the API server.

* **Default:** `timeout_workflow_seconds` + 60 seconds (the middleware falls
  back to that derived value when the row is missing or unparseable)
* **Type:** Integer (seconds)
* **Used by:** API server request timeout middleware (`TimeoutMiddleware` in
  `cmd/api/server.go`)

### `timeout_job_seconds`

Controls the maximum execution time for an entire job (workflow with all steps).

* **Default:** 3600 (1 hour)
* **Type:** Integer (seconds)
* **Used by:** Job execution context timeout (read by the workflow engine in
  `internal/engine/engine.go`)

### `max_tool_calls`

Surfaced by the **Tool Execution Configuration** card on the web UI Settings
page (`-1` for unlimited, `1`–`100` otherwise).

* **Default:** 10
* **Category:** `agent`
* **Type:** Integer

> **Note:** as of the current implementation this value is only stored and
> echoed back by `GET`/`PUT /api/v1/settings/max_tool_calls`; the server code
> does not read it, so changing it has no effect on agent execution yet.

## Working in Repositories

Repository work is delegated to WASM modules rather than a built-in git
integration. The `git-worktree` module creates (or reuses) a git worktree of an
**already cloned** local repository and points subsequent workflow steps at it:

```json
{
  "prompt": { "worktree_name": "issue-42-fix-bug" },
  "repository": "/srv/mule/checkouts/my-repo"
}
```

Notes, taken from the module and its `create_git_worktree` host function:

* `repository` is a path to an existing local git checkout; it is optional and
  defaults to the current working directory.
* `prompt` may be a JSON string or an object containing `worktree_name`.
* Worktree names are validated: `/`, `\`, `..`, `~` and reserved git names
  (`HEAD`, `ORIG_HEAD`, ...) are rejected, so use `issue-42-fix-bug` rather
  than `mule/issue-42`.
* If the worktree already exists it is reused; otherwise the host runs
  `git worktree add <path> HEAD` and sets the working directory for the rest of
  the workflow.
* **Cloning is not performed by the module.** Clone the repository yourself on
  the host (HTTPS with a token, or SSH with keys configured for the user
  running Mule) before the step that creates the worktree.

See [GitHub Integration](/docs/repositories/adding-a-repository/) and
[WASM Modules](/docs/advanced/wasm-modules/) for the rest of the git/GitHub
modules.