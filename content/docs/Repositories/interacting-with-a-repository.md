---
weight: 200
title: "Interacting With a Repository"
description: "Repository interaction in Mule via WASM modules"
icon: "article"
date: "2025-02-20T21:04:46-05:00"
lastmod: "2026-03-21T18:00:00-05:00"
toc: true
---

Mule provides GitHub integration through WASM modules that can be used in workflows. These modules enable automated interaction with GitHub repositories including fetching issues, posting comments, creating branches, and opening pull requests.

## Available WASM Modules

Mule includes the following WASM modules for repository interaction:

| Module | Description | Location |
|--------|-------------|----------|
| **GitHub Issues** | Fetch issues from GitHub repositories | `examples/wasm/github-issues/` |
| **GitHub Comment** | Post comments on GitHub issues | `examples/wasm/github-comment/` |
| **Git Branch Push** | Push git branches to remote origin | `examples/wasm/git-branch-push/` |
| **Create Pull Request** | Create pull requests on GitHub | `examples/wasm/create-pull-request/` |

## Git Worktree

Create isolated git worktrees for parallel development on multiple issues or features simultaneously.

### Usage

```json
{
  "prompt": "{\"worktree_name\": \"mule/issue-42-feature\"}",
  "repository": "/path/to/repository"
}
```

### Configuration Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string/object | Yes | JSON containing `worktree_name` |
| `repository` | string | No | Base repository path (defaults to working directory) |

### Output

```json
{
  "success": true,
  "issue": {"worktree_name": "mule/issue-42-feature"},
  "path": "/path/to/worktree"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| 0xFFFFFFF0 | Failed to read worktree name from memory |
| 0xFFFFFFF1 | Failed to read base path from memory |
| 0xFFFFFFF2 | Failed to get current working directory |
| 0xFFFFFFF3 | Base path is not a git repository |
| 0xFFFFFFF4 | Failed to create git worktree |

### Best Practices

- Use prefixes like `mule/` or `feature/` to organize worktrees
- Keep worktree names short and descriptive
- Remove worktrees when done to avoid clutter

### Workflow Example: Parallel Bug Fixes

```json
{
  "name": "Parallel Bug Fixes",
  "steps": [
    {
      "type": "WASM",
      "name": "Create Worktree for Bug 42",
      "wasm_module_id": "{git-worktree-module-id}",
      "config": {
        "prompt": "{\"worktree_name\": \"mule/fix-bug-42\"}"
      }
    },
    {
      "type": "Agent",
      "name": "Fix Bug 42",
      "agent_id": "{coding-agent-id}",
      "input": "Fix the bug described in issue #42"
    },
    {
      "type": "WASM",
      "name": "Create Worktree for Bug 43",
      "wasm_module_id": "{git-worktree-module-id}",
      "config": {
        "prompt": "{\"worktree_name\": \"mule/fix-bug-43\"}"
      }
    },
    {
      "type": "Agent",
      "name": "Fix Bug 43",
      "agent_id": "{coding-agent-id}",
      "input": "Fix the bug described in issue #43"
    }
  ]
}
```

---

## GitHub Issues Fetcher

The GitHub Issues module fetches issues from GitHub repositories with flexible filtering options.

### Usage

```json
{
  "repo_url": "https://github.com/owner/repo",
  "token": "your-github-token",
  "filters": {
    "state": "open",
    "assignee": "@me",
    "labels": "bug,help-wanted",
    "per_page": 30,
    "fetch_comments": true
  }
}
```

### Filter Options

| Filter | Options | Description |
|--------|---------|-------------|
| `state` | `open`, `closed`, `all` | Filter by issue state |
| `assignee` | username, `@me`, `none`, `*` | Filter by assignee |
| `labels` | comma-separated names | Filter by labels |
| `sort` | `created`, `updated`, `comments` | Sort order |
| `direction` | `asc`, `desc` | Sort direction |
| `per_page` | 1-100 | Results per page |
| `fetch_comments` | boolean | Include comments in results |

### Output Format

```json
{
  "issues": [
    {
      "id": 123456,
      "number": 1,
      "title": "Issue title",
      "state": "open",
      "url": "https://github.com/owner/repo/issues/1",
      "body": "Issue description",
      "labels": [{"name": "bug", "color": "e11d21"}],
      "comments": 5,
      "assignee": {"login": "username"},
      "comments_data": [...]
    }
  ],
  "count": 1
}
```

### Workflow Example

```json
{
  "type": "WASM",
  "wasm_module_id": "{module-id}",
  "config": {
    "token": "{{GITHUB_TOKEN}}",
    "repo_url": "https://github.com/mule-ai/mule"
  }
}
```

## GitHub Comment

Post comments on GitHub issues to provide feedback or request changes.

### Usage

```json
{
  "prompt": "{\"issue\": \"https://api.github.com/repos/owner/repo/issues/123\", \"comment\": \"This is my comment\"}",
  "token": "your-github-token"
}
```

### Output

```json
{
  "success": true,
  "message": "Comment posted successfully",
  "url": "https://github.com/owner/repo/issues/123#issuecomment-..."
}
```

### Comment-Based Iteration

You can guide the AI using PR comments:

- **Request Changes**: Ask for specific modifications
- **Ask Questions**: Clarify requirements
- **Review Feedback**: Point out issues for the AI to fix

## Git Branch Push

Push the current worktree as a git branch to the remote origin.

### Usage

```json
{
  "token": "your-git-token",
  "repository": "/path/to/repo",
  "user_name": "Your Name",
  "user_email": "you@example.com"
}
```

The module automatically:
1. Stages all changes in the repository
2. Commits with a default message
3. Uses the worktree name as the branch name
4. Pushes to the remote origin

## Create Pull Request

Create pull requests on GitHub programmatically.

### Usage

```json
{
  "token": "your-github-token",
  "owner": "repository-owner",
  "repo": "repository-name",
  "title": "Pull request title",
  "base": "main",
  "body": "Description of changes",
  "draft": false
}
```

If `head` is not provided, the module automatically detects the current branch.

### Error Codes

| Code | Description |
|------|-------------|
| 201 | Pull request created successfully |
| 400 | Bad request (invalid parameters) |
| 401 | Unauthorized (invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Repository or branch not found |
| 422 | Validation errors |

---

## Issue State Tracker

Update GitHub issue labels to track workflow progress through different states.

### Usage

```json
{
  "prompt": "{\"issue\": \"https://api.github.com/repos/owner/repo/issues/123\", \"label\": \"in-progress\", \"comment\": \"Working on this now\"}",
  "token": "your-github-token",
  "states": ["triage", "in-progress", "review", "done"]
}
```

### Configuration Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | JSON with `issue` (GitHub API URL), `label`, and optional `comment` |
| `token` | string | Yes | GitHub Personal Access Token |
| `states` | array | No | Allowed label names (validates against this list) |

### Prompt Object Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issue` | string | Yes | GitHub API URL (e.g., `https://api.github.com/repos/owner/repo/issues/123`) |
| `label` | string | Yes | Label to apply to the issue |
| `comment` | string | No | Comment to add when transitioning |
| `title` | string | No | PR title for linked PRs |
| `body` | string | No | PR body for linked PRs |

### Output

```json
{
  "success": true,
  "issue": "https://api.github.com/repos/owner/repo/issues/123",
  "label": "in-progress",
  "comment": "Working on this now",
  "title": "",
  "body": ""
}
```

### Workflow Example: State-Based Automation

```json
{
  "name": "Issue Triage and Work",
  "steps": [
    {
      "type": "Agent",
      "name": "Triage Issue",
      "agent_id": "{triage-agent-id}",
      "input": "Analyze this issue and determine if it's a bug or feature request"
    },
    {
      "type": "WASM",
      "name": "Label as Bug",
      "wasm_module_id": "{issue-state-tracker-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}",
        "states": ["bug", "feature", "triage", "in-progress", "done"],
        "prompt": "{\"issue\": \"{{issue_url}}\", \"label\": \"bug\"}"
      }
    },
    {
      "type": "Agent",
      "name": "Implement Fix",
      "agent_id": "{coding-agent-id}",
      "input": "Implement a fix for this bug"
    },
    {
      "type": "WASM",
      "name": "Move to Review",
      "wasm_module_id": "{issue-state-tracker-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}",
        "states": ["bug", "feature", "triage", "in-progress", "review", "done"],
        "prompt": "{\"issue\": \"{{issue_url}}\", \"label\": \"review\", \"comment\": \"Fix implemented, ready for review\"}"
      }
    }
  ]
}
```

### GitHub API URL Format

The issue URL must follow the GitHub API format:
```
https://api.github.com/repos/{owner}/{repo}/issues/{number}
```

Example: `https://api.github.com/repos/mule-ai/mule/issues/42`

### Error Codes

| Code | Description |
|------|-------------|
| 403 | Forbidden - check token has `issues:read` and `issues:write` permissions |
| 404 | Issue not found - check the URL is correct and token has repository access |

---

## Issues to Markdown

Convert GitHub issues from JSON format into readable markdown documents.

### Usage

This module receives the output from the GitHub Issues fetcher and transforms it into markdown.

### Input Format

```json
{
  "result": [
    {
      "body": "Issue description text",
      "due_date": "2026-04-01",
      "filter": "all",
      "state": "open",
      "status": "in-progress",
      "title": "Issue Title",
      "url": "https://api.github.com/repos/owner/repo/issues/1"
    }
  ]
}
```

### Output Format

```markdown
# Issue Title

* Link: https://github.com/owner/repo/issues/1
* State: In-progress
* Due Date: 4/1/26

* Description: Issue description text

-----

# Another Issue

* Link: https://github.com/owner/repo/issues/2
* State: Open
* Due Date: No Due Date

* Description: Another issue description
```

### Workflow Example: Generate Issue Report

```json
{
  "name": "Weekly Issue Digest",
  "steps": [
    {
      "type": "WASM",
      "name": "Fetch Issues",
      "wasm_module_id": "{github-issues-module-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}",
        "repo_url": "https://github.com/owner/repo",
        "filters": {
          "state": "open",
          "per_page": 50
        }
      }
    },
    {
      "type": "WASM",
      "name": "Convert to Markdown",
      "wasm_module_id": "{issues-to-markdown-id}",
      "input": "{{steps.0.output}}"
    },
    {
      "type": "Agent",
      "name": "Summarize",
      "agent_id": "{summary-agent-id}",
      "input": "Summarize these issues and identify priority items:\n\n{{steps.1.output}}"
    }
  ]
}
```

### Transformation Rules

| Input Field | Output Format |
|-------------|---------------|
| `title` | Markdown heading (`# Title`) |
| `url` | Converted to human-readable GitHub URL |
| `state` / `status` | Capitalized (`Open` → `Open`, `in-progress` → `In-progress`) |
| `due_date` | Formatted as `M/D/YY` or "No Due Date" |
| `body` | Indented for readability with nested lists preserved |

---

## Complete Workflow Example

Here's a complete workflow demonstrating repository interaction:

```json
{
  "name": "GitHub Issue Automation",
  "steps": [
    {
      "type": "WASM",
      "name": "Fetch Open Issues",
      "wasm_module_id": "{github-issues-module-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}",
        "repo_url": "https://github.com/owner/repo",
        "filters": {
          "state": "open",
          "labels": "mule"
        }
      }
    },
    {
      "type": "Agent",
      "name": "Analyze Issues",
      "agent_id": "{{ANALYSIS_AGENT}}",
      "input": "{{steps.0.output}}"
    },
    {
      "type": "WASM",
      "name": "Post Comment",
      "wasm_module_id": "{github-comment-module-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}"
      }
    }
  ]
}
```

## Authentication

All GitHub modules require a GitHub Personal Access Token with appropriate permissions:

| Scope | Permission |
|-------|------------|
| `public_repo` | Public repositories only |
| `repo` | Private repositories |

Generate tokens at: https://github.com/settings/tokens

## Best Practices

### Workflow Design

- **Filter Early**: Use filters in WASM modules to reduce data processing
- **Chain Operations**: Use workflow steps to chain GitHub operations
- **Error Handling**: Check for success/failure in each step output

### Token Security

- **Environment Variables**: Store tokens in environment variables, not in workflow configs
- **Least Privilege**: Use `public_repo` scope when possible
- **Rotation**: Rotate tokens regularly

### API Rate Limits

GitHub API has rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour

Plan workflow execution to avoid hitting rate limits.

## Building Custom WASM Modules

The examples in `examples/wasm/` can be extended or used as templates for custom GitHub automation. Each module demonstrates:

- **Input/Output handling**: JSON parsing and serialization
- **Host functions**: Using Mule's WASM host functions
- **Error handling**: Returning meaningful error codes
- **GitHub API integration**: Making authenticated requests

## Current Mule Features

Beyond GitHub integration, Mule provides these interaction patterns:

### Job Execution

Run workflows and agents through the Jobs interface:

1. Navigate to **Dashboard** or **Jobs** page
2. Select a workflow or agent to execute
3. Provide input parameters
4. Monitor streaming output in real-time
5. Review results and artifacts

### Streaming Responses

Receive real-time updates via WebSocket:

- **Text Output**: See the AI's response as it's generated
- **Thinking Process**: View the agent's reasoning (if enabled)
- **Tool Execution**: Watch tools being called and their results
- **Progress Updates**: Track workflow step completion

### Artifact Management

Workflows can produce artifacts:

- **Code Files**: Generated source code stored as artifacts
- **Data Exports**: JSON, CSV, or other data formats
- **Images**: Generated images or visualizations
- **Reports**: Summary documents of job execution

### Error Handling

When jobs fail:

1. Check the **error message** in the job details
2. Review **job logs** for detailed stack traces
3. **Retry** failed jobs after fixing issues
4. **Cancel** stuck jobs to free resources

## Workflow Execution Flow

Mule workflow execution:

```
User Request → API Handler → Workflow Engine
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
              Step 1 (Agent)              Step 2 (WASM Module)
                    │                              │
                    ▼                              ▼
              PI Agent Runtime            WASM Execution
                    │                              │
                    └──────────────┬──────────────┘
                                   ▼
                            Job Complete
                                   │
                                   ▼
                          Artifacts Stored
```

## Getting Help

For Mule features:

- [Getting Started](/docs/getting-started) - Quick start guide
- [Agents](/docs/Settings/agents) - Create AI agents
- [Workflows](/docs/Settings/workflows) - Build automation
- [Settings](/docs/Settings/general) - Configure Mule

For WASM module development:

- [WASM Examples](https://github.com/mule-ai/mule/tree/main/examples/wasm) - Example modules on GitHub
- [GitHub Issues](https://github.com/mule-ai/mule/issues) - Report bugs or request features
