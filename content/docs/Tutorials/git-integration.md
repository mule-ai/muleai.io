---
weight: 25
title: "Git Integration"
description: "Automate Git operations using WASM modules and workflows"
icon: "article"
date: "2026-04-04"
lastmod: "2026-04-04T00:00:00-05:00"
toc: true
---

# Git Integration

Mule provides powerful Git automation capabilities through WASM modules. This tutorial covers how to automate Git operations like creating branches, managing worktrees, and pushing changes from your workflows.

## Overview

Git integration in Mule is achieved through dedicated WASM modules that expose Git operations as workflow steps. These modules use host functions to safely execute Git commands in isolated working directories.

### Available Git Modules

| Module | Description |
|--------|-------------|
| `git-worktree` | Create and manage Git worktrees for parallel development |
| `git-branch-push` | Create branches and push to remote repositories |
| `github-comment` | Post comments to GitHub issues and pull requests |
| `github-issues` | Fetch and filter GitHub issues |
| `create-pull-request` | Create GitHub pull requests programmatically |
| `issues-to-markdown` | Convert GitHub issues to formatted Markdown |

## Getting Started

### Prerequisites

1. A Git repository initialized and accessible from Mule
2. Git credentials configured (personal access token or SSH key)
3. WASM modules uploaded to your Mule instance

### Setting Up Git Credentials

Store your Git credentials securely:

```bash
# Store as a workflow variable or environment variable
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"

# Or configure in your workflow step
{
  "type": "wasm_module",
  "config": {
    "token": "ghp_xxxxxxxxxxxx"
  }
}
```

## Git Worktree Workflows

Git worktrees allow you to work on multiple branches simultaneously without switching. This is perfect for parallel issue resolution or feature development.

### Creating an Issue Worktree

Create an isolated worktree for each issue or task:

```bash
# 1. Upload the git-worktree module
BASE64_WASM=$(base64 -w 0 /path/to/git-worktree.wasm)

curl -X POST http://localhost:8140/api/v1/wasm-modules \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"git-worktree\",
    \"description\": \"Create and manage Git worktrees\",
    \"module_data\": \"$BASE64_WASM\"
  }"

# Save the module ID from the response
```

### Complete Issue Processing Workflow

Here's a complete workflow that processes an issue in an isolated worktree:

```bash
# Create the workflow
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "issue-processor",
    "description": "Process a GitHub issue in an isolated worktree"
  }'

WORKFLOW_ID="workflow-uuid"

# Step 1: Create worktree
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 1,
    "type": "wasm_module",
    "wasm_module_id": "git-worktree-module-uuid",
    "config": {
      "prompt": {
        "worktree_name": "issue-123"
      }
    }
  }'

# Step 2: Fetch issue details
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 2,
    "type": "wasm_module",
    "wasm_module_id": "github-issues-module-uuid",
    "config": {
      "url": "https://api.github.com/repos/owner/repo/issues/123",
      "state": "open"
    }
  }'

# Step 3: Analyze and fix (agent step)
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 3,
    "type": "agent",
    "agent_id": "coding-agent-uuid",
    "config": {
      "task": "Analyze this issue and implement a fix:\n{{step_2.output}}"
    }
  }'

# Step 4: Run tests
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 4,
    "type": "tool",
    "tool_type": "bash",
    "config": {
      "command": "go test ./...",
      "timeout": 120
    }
  }'

# Step 5: Create branch and push
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 5,
    "type": "wasm_module",
    "wasm_module_id": "git-branch-push-module-uuid",
    "config": {
      "token": "ghp_xxxxxxxxxxxx"
    }
  }'

# Step 6: Create pull request
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 6,
    "type": "wasm_module",
    "wasm_module_id": "create-pull-request-module-uuid",
    "config": {
      "title": "Fix issue #123",
      "body": "This PR addresses issue #123"
    }
  }'
```

## Git Branch Management

### Creating Feature Branches

Use the `git-branch-push` module to create and push branches:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "git-branch-push-uuid",
  "config": {
    "token": "{{GITHUB_TOKEN}}",
    "remote": "origin",
    "branch_suffix": "-fix",
    "base_branch": "main",
    "commit_message": "Fix: Implement solution for issue #123",
    "push": true
  }
}
```

### Branch Naming Strategy

Configure branch naming based on your workflow:

| Suffix | Result | Use Case |
|--------|--------|----------|
| `-fix` | `issue-123-fix` | Bug fixes |
| `-feature` | `issue-123-feature` | New features |
| `-wip` | `issue-123-wip` | Work in progress |

## GitHub Integration

### Posting Issue Comments

After completing work, post a comment to the issue:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "github-comment-uuid",
  "config": {
    "issue_number": 123,
    "body": "I've implemented a fix for this issue. The PR is ready for review.",
    "repo": "owner/repo",
    "token": "{{GITHUB_TOKEN}}"
  }
}
```

### Converting Issues to Documentation

Use the `issues-to-markdown` module to create documentation from issues:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "issues-to-markdown-uuid",
  "config": {
    "url": "https://api.github.com/repos/owner/repo/issues/123",
    "format": "detailed",
    "include_labels": true,
    "include_assignees": true
  }
}
```

## Pull Request Workflow

### Creating Pull Requests Programmatically

The `create-pull-request` module automates PR creation:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "create-pull-request-uuid",
  "config": {
    "title": "Fix: Resolve issue #123",
    "body": "## Summary\nFixes #123\n\n## Changes\n- Added feature X\n- Modified Y to support Z",
    "head": "issue-123-fix",
    "base": "main",
    "token": "{{GITHUB_TOKEN}}",
    "repo": "owner/repo",
    "draft": false,
    "maintainer_can_modify": true
  }
}
```

### Complete PR Automation

Here's a complete workflow for automated PR creation:

```bash
# Create workflow for automated PRs
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "automated-pr",
    "description": "Create PR from issue analysis",
    "is_async": false
  }'

WORKFLOW_ID="workflow-uuid"

# Add steps for: worktree -> code changes -> test -> branch -> push -> PR
```

## Batch Issue Processing

Process multiple issues in parallel using the array workflow launcher:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "array-workflow-launcher-uuid",
  "config": {
    "workflows": [
      {"issue_number": 101, "priority": "high"},
      {"issue_number": 102, "priority": "medium"},
      {"issue_number": 103, "priority": "low"}
    ],
    "target_workflow_id": "issue-processor-uuid",
    "parallel": true,
    "max_concurrent": 3
  }
}
```

## Error Handling

### Git Operation Errors

Handle common Git errors gracefully:

```go
// In a custom WASM module
func handleGitError(errCode uint32) error {
    switch errCode {
    case 0:
        return nil // Success
    case 1:
        return fmt.Errorf("not a git repository")
    case 2:
        return fmt.Errorf("worktree already exists")
    case 3:
        return fmt.Errorf("branch already exists")
    case 4:
        return fmt.Errorf("authentication failed")
    case 5:
        return fmt.Errorf("remote not found")
    default:
        return fmt.Errorf("unknown git error: %d", errCode)
    }
}
```

### Retry Logic

Implement retry logic for transient failures:

```json
{
  "type": "wasm_module",
  "wasm_module_id": "validation-module-uuid",
  "config": {
    "validation_command": "git push origin issue-123-fix",
    "max_attempts": 3,
    "retry_delay_seconds": 5
  }
}
```

## Best Practices

### 1. Use Worktrees for Isolation

Each issue or task should use its own worktree to prevent conflicts:

```json
{
  "prompt": {
    "worktree_name": "issue-{{issue_number}}-{{unique_id}}"
  }
}
```

### 2. Secure Credential Handling

Never hardcode tokens in workflow definitions:

```bash
# Use environment variables
export GITHUB_TOKEN="ghp_xxxx"

# Reference in config (not shown in logs)
"token": "{{env.GITHUB_TOKEN}}"
```

### 3. Validate Before Pushing

Always run tests before pushing changes:

```json
{
  "steps": [
    {"type": "agent", "task": "Implement fix"},
    {"type": "tool", "tool_type": "bash", "command": "go test ./..."},
    {"type": "tool", "tool_type": "bash", "command": "go build ./..."},
    {"type": "wasm_module", "module": "git-branch-push"}
  ]
}
```

### 4. Clean Up Worktrees

Remove worktrees after completing work:

```bash
git worktree remove /path/to/worktree
git worktree prune  # Clean up stale references
```

### 5. Use Meaningful Branch Names

Include issue numbers and brief descriptions:

```
issue-123-bugfix-auth
feature-456-user-profiles
docs-789-api-reference
```

## Troubleshooting

### "Not a git repository"

**Error**: The working directory is not inside a Git repository.

**Solution**: Ensure your workflow is operating in a valid Git repository by setting the working directory correctly.

### "Worktree already exists"

**Error**: Attempting to create a worktree with a name that already exists.

**Solution**: The git-worktree module handles this gracefully by reusing existing worktrees. For strict creation, check existence first.

### "Authentication failed"

**Error**: Git operations fail due to authentication issues.

**Solution**: 
1. Verify the token is valid and has appropriate permissions
2. Ensure the token is correctly passed to the WASM module
3. Check that the token has repo scope for private repositories

### "Remote branch already exists"

**Error**: Attempting to push a branch that already exists on the remote.

**Solution**: Either delete the remote branch first or use force push (with caution).

## Related Documentation

- [Repository Operations](/docs/Repositories/interacting-with-a-repository)
- [Working Directory Management](/docs/Tutorials/working-directory)
- [WASM Modules](/docs/Advanced/wasm-modules)
- [Building WASM Modules](/docs/Tutorials/building-wasm-module)
- [GitHub Integration Examples](https://github.com/mule-ai/mule/tree/main/examples/wasm)
