---
weight: 200
title: "Interacting With a Repository"
description: "Learn how to interact with repositories in Mule"
icon: "article"
date: "2025-02-20T21:04:46-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
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

## Working with Issues

Issues are the primary way to interact with Mule. When an issue is labeled with `mule`, it becomes available for the AI to work on.

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

## Troubleshooting

If you encounter issues with a repository:

- **Repository Locked**: The repository is currently being processed. Wait for the operation to complete.
- **Sync Failed**: Check network connectivity and GitHub token permissions.
- **No Changes Generated**: The AI may not have enough context. Try adding more details to the issue description.
- **Permission Errors**: Ensure your GitHub token has the required permissions to push to the repository.