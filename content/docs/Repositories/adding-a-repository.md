---
weight: 2
title: "Adding a Repository"
description: "Learn how to add repositories to Mule for AI-powered issue processing"
icon: "article"
date: "2025-02-20T21:04:16-05:00"
lastmod: "2026-03-20T00:00:00-05:00"
toc: true
---

![add-repository](https://storage.googleapis.com/mule-storage/add-repository.png)

Adding a repository is the action that allows mule to monitor issues and create new pull requests.

## Supported Repository Types

Mule supports two types of repositories:

| Type | Description |
|------|-------------|
| **GitHub** | Remote repositories hosted on GitHub. Mule monitors issues, creates branches, commits, and pull requests. |
| **Local** | Local-only repositories for offline testing or development without network access. |

### GitHub Repositories

For GitHub repositories:
- The repository must exist on GitHub
- You need a GitHub personal access token with `repo` scope
- SSH access is recommended for private repositories

### Local Repositories

For local repositories:
- No external dependencies required
- Clone a repository manually to your local filesystem
- Use the "Switch Provider" option to select Local mode
- All operations happen locally without pushing to remote

## Adding a GitHub Repository

### Authentication

Before adding a GitHub repository, ensure you have:

1. **GitHub Personal Access Token**: Create one at [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. **Required Scopes**: Select `repo` scope for full repository access (or `public_repo` for public repositories only)

Configure your token in [General Settings](/docs/Settings/general) under the GitHub section.

### SSH Configuration (Recommended)

For private repositories, configure SSH access:

1. **Generate an SSH key** (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "mule@muleai.io"
```

2. **Add the public key to GitHub**:
- Copy your public key: `cat ~/.ssh/id_ed25519.pub`
- Add it at [GitHub Settings → SSH and GPG keys](https://github.com/settings/keys)

3. **Configure SSH** (if needed):
```bash
# ~/.ssh/config
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

### Repository URL

When adding a repository, you can use either:

- **HTTPS URL**: `https://github.com/owner/repository.git`
- **SSH URL**: `git@github.com:owner/repository.git` (recommended for private repos)

### Remote Repository

Enter the GitHub repository URL or browse available repositories if you have access.

### Base Path

The Base Path is the location where you wish to locally clone the repository. When the repository is cloned, the owner and the repository name will be appended to the base path.

**Example:** If you set Base Path to `/home/user/mule-repos` and add `github.com/owner/my-project`, Mule will clone it to `/home/user/mule-repos/owner/my-project`.

### Schedule

The schedule is specified as a cron string. For example if you wish for mule to check GitHub for new issues every 5 minutes, you would use `*/5 * * * *`

Common schedule examples:

| Schedule | Description |
|----------|-------------|
| `*/5 * * * *` | Every 5 minutes |
| `*/15 * * * *` | Every 15 minutes |
| `*/30 * * * *` | Every 30 minutes |
| `0 * * * *` | Every hour |
| `0 */6 * * *` | Every 6 hours |

### Add Repository

Once you click "Add Repository" the remote repository will be cloned to the local path and a scheduler will be started based on your specified cron schedule. After cloning is complete, you will see the repository available below. See [interacting with a repository](/docs/Repositories/interacting-with-a-repository) for more information.

## Adding a Local Repository

To work with a local repository:

1. Clone the repository manually to your desired location:
```bash
git clone https://github.com/owner/repository.git /path/to/local/repos
cd /path/to/local/repos
```

2. In Mule's UI, navigate to the repository dashboard

3. Click "Switch Provider" and select **Local Provider**

4. The repository will be available for local-only operations

**Note:** Local repositories do not require GitHub tokens or SSH configuration.

## Troubleshooting

- **Clone Failed**: Check that the base path exists and is writable. For SSH-based cloning, ensure SSH keys are configured correctly.
- **Permission Denied**: Verify your GitHub token has the required scopes or SSH keys have access to the repository.
- **Repository Not Found**: Ensure the repository exists on GitHub and your token/SSH key has access to it.