---
weight: 200
title: "Interacting With a Repository"
description: "Learn how to interact with repositories, manage issues, and collaborate with Mule's AI agents"
icon: "article"
date: "2025-02-20T21:04:46-05:00"
lastmod: "2026-03-20T00:00:00-05:00"
toc: true
---

Once you've added a repository to Mule, you can interact with it in several ways. This page explains how to work with repositories, manage issues, and collaborate with AI agents.

## Repository Dashboard

After adding a repository, it will appear in the dashboard with the following information:

- **Repository Name**: The name of the repository
- **Provider**: GitHub or Local
- **Status**: Current sync status
- **Last Sync**: When the repository was last synchronized
- **Actions**: Buttons to interact with the repository

### Status Indicators

The repository status shows the current state of synchronization:

| Status | Meaning |
|--------|---------|
| **Synced** | Repository is up-to-date, no pending operations |
| **Syncing** | Currently fetching issues and pull requests |
| **Processing** | Working on issues or updating pull requests |
| **Error** | An error occurred; check logs for details |
| **Locked** | Repository is busy with another operation |

### Removing a Repository

To remove a repository from Mule:

1. Navigate to the repository in the dashboard
2. Click the "Remove" or "Delete" button (trash icon)
3. Confirm the removal when prompted

This will:
- Stop the scheduled synchronization for that repository
- Remove the repository from the Mule dashboard
- **Note**: The local cloned copy of the repository will remain on your filesystem unless manually deleted

To manually clean up the local repository files:
```bash
rm -rf /path/to/base/path/repo-owner/repo-name
```

## Synchronizing a Repository

Mule will automatically synchronize repositories according to the schedule you specified when adding them. However, you can manually trigger a sync at any time:

1. Click the "Sync" button next to the repository
2. Mule will immediately fetch new issues and pull requests from the provider
3. The status indicator will update to show the synchronization progress

## Repository Providers

Mule supports two types of repository providers:

### GitHub Provider

With the GitHub provider, Mule interacts directly with GitHub repositories:

- Monitors issues with the `mule` label
- Creates branches, commits, and pull requests on GitHub
- Responds to comments on pull requests
- Updates pull requests based on feedback

### Local Provider

The Local provider offers an offline experience for testing or local development:

- Create issues directly in the Mule interface
- View AI-generated changes before they're pushed
- Add comments to pull requests
- Test workflows without pushing to a remote repository

You can switch between providers using the "Switch Provider" button next to the repository.

### Provider Requirements

**GitHub Provider:**
- A valid GitHub token must be configured in [General Settings](/docs/Settings/general)
- The token needs appropriate permissions to read/write repositories, issues, and pull requests

**Local Provider:**
- No external dependencies required
- All data is stored locally in the Mule database
- Changes must be manually pushed to remote repositories if needed

## Working with Issues

Issues are the primary way to interact with Mule. When an issue is labeled with `mule`, it becomes available for the AI to work on.

### The `mule` Label

Mule uses GitHub labels to identify issues for processing:

- **Label name**: `mule` (case-insensitive)
- **Behavior**: Any issue with this label will be picked up during the next sync
- **Prerequisites**: The issue must not already have an associated pull request
- **Scope**: The label is per-issue, not per-repository

### Branch Naming

When Mule starts working on an issue, it creates a new branch with the following naming convention:

```
mule/{issue-number}-{slugified-title}
```

For example, an issue titled "Fix login bug" with number 42 would create a branch named:
```
mule/42-fix-login-bug
```

Branch names are:
- Lowercased
- Limited to 100 characters
- Special characters replaced with hyphens
- Consecutive hyphens collapsed

### Creating Issues (Local Provider)

With the Local provider, you can create issues directly in Mule:

1. Navigate to the Local Provider page
2. Click "Create Issue"
3. Enter a title and description
4. Click "Save"

The issue will be automatically labeled with `mule` and will be processed during the next sync.

### Commenting on Pull Requests

When Mule creates a pull request, you can interact with it by adding comments:

1. Navigate to the pull request (on GitHub or in the Local Provider view)
2. Add a comment with specific feedback or requests
3. Mule will process your comment and update the pull request accordingly

Comment types that trigger responses:
- Code review comments on specific lines
- General comments asking for changes
- Questions about implementation details

### Closing or Merging Pull Requests

When you're satisfied with the changes:

1. For GitHub repositories, merge the pull request using GitHub's interface
2. For Local repositories, use the "Close" or "Merge" buttons in Mule's interface

After a pull request is closed or merged, Mule will consider the issue resolved and will not make further changes unless the issue is reopened.

## Behind the Scenes

When Mule processes a repository, it follows this workflow:

1. Clone or update the local copy of the repository
2. Scan for issues labeled with `mule`
3. For each issue without a pull request:
   - Create a new branch
   - Generate code changes using AI
   - Commit and push changes
   - Create a pull request
4. For each pull request with unresolved comments:
   - Process the comments
   - Make additional changes
   - Update the pull request

## Writing Effective Issues

To get the best results from Mule, write clear and detailed issues:

### Do's
- **Be specific**: Describe the exact problem or feature request
- **Include context**: Explain why this change is needed
- **Provide examples**: Show code samples or expected behavior
- **Reference files**: Mention specific files or functions when relevant
- **Add acceptance criteria**: Define what a successful solution looks like

### Example Issue

```markdown
## Problem
The login form doesn't validate email format before submission.

## Expected Behavior
When a user enters an invalid email (e.g., "user@"), the form should show an error message.

## Files Affected
- `src/components/LoginForm.tsx` - form validation logic
- `src/utils/validation.ts` - validation utility functions

## Acceptance Criteria
- [ ] Invalid email shows error: "Please enter a valid email address"
- [ ] Valid email passes validation
- [ ] Submit button is disabled until email is valid
```

## Best Practices

### Repository Management
- **Use descriptive schedules**: Set sync intervals based on your needs (more frequent for active projects)
- **Clean up old repos**: Remove unused repositories to keep your dashboard organized
- **Monitor sync status**: Check for errors regularly, especially after GitHub permissions changes

### Issue Workflow
- **One issue per PR**: Keep issues focused for cleaner pull requests
- **Label consistently**: Ensure the `mule` label is applied correctly to all issues you want processed
- **Review generated PRs**: Always review AI-generated code before merging
- **Iterate with comments**: Use PR comments to guide the AI toward your preferred solution

### Security Considerations
- **Review code changes**: Always examine generated code before merging
- **Protect main branch**: Require reviews and status checks on GitHub
- **Limit token permissions**: Use tokens with minimum required scopes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Repository Locked** | The repository is currently being processed. Wait for the operation to complete. |
| **Sync Failed** | Check network connectivity and GitHub token permissions. |
| **No Changes Generated** | The AI may not have enough context. Try adding more details to the issue description. |
| **Permission Errors** | Ensure your GitHub token has the required permissions to push to the repository. |
| **Repository Not Found** | Verify the repository exists on GitHub and your token has access to it. |
| **Clone Failed** | Check that the base path exists and is writable. For SSH-based cloning, ensure SSH keys are configured. |
| **Label Not Detected** | Ensure the issue has the `mule` label applied. Mule only processes labeled issues. |
| **Stale Data** | If data appears outdated, try manually triggering a sync using the "Sync" button. |
| **PR Not Created** | Check that no existing PR is linked to the issue. Mule won't create duplicate PRs. |
| **AI Not Responding to Comments** | Ensure the comment is on an open PR. Mule only processes comments on open pull requests. |