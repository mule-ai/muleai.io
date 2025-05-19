---
weight: 1
title: "Getting Started"
description: "Getting started with Mule"
icon: "article"
date: "2025-02-20T20:46:32-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

## What is Mule?

Mule is an AI Agent that monitors your git repositories and completes issues assigned to it. It serves as your autonomous AI development team, capable of:

- Generating code solutions based on issue descriptions
- Creating pull requests with implemented changes
- Responding to feedback in pull request comments
- Applying code quality standards through validation

## Prerequisites

Before installing Mule, ensure you have:

- **Go 1.24+**: Mule is built with Go 1.24 or newer
- **Git**: For repository operations
- **SSH keys**: Configured for GitHub access if using GitHub repositories
- **AI provider access**: API keys for your chosen AI provider (Ollama, Gemini, etc.)
- **GitHub token**: If you plan to use GitHub repositories (optional)

## Installation

### Standard Installation

```bash
git clone https://github.com/mule-ai/mule.git
cd mule
make run
```

### Docker Installation

```bash
git clone https://github.com/mule-ai/mule.git
cd mule
make docker-build
make docker-run
```

### Installing Dependencies

For development or contributing to Mule:

```bash
make download-golangci-lint  # Install linting tools
make deps                    # Install Go dependencies
```

## Configuration

Mule stores its configuration in a standard location based on your operating system:

- **Linux**: `~/.config/mule/`
- **macOS**: `~/Library/Application Support/mule/`
- **Windows**: `%APPDATA%\mule\`

The primary configuration is automatically created on first run.

## Running Mule

After installation, Mule is accessible through a web interface at [http://localhost:8083](http://localhost:8083).

To get started running Mule, follow these steps:

1. **Set a [GitHub token](/docs/Settings/general)** (optional)
   - This allows Mule to interact with GitHub repositories
   - Required for working with private repositories

2. **Set up your [AI Providers](/docs/Settings/ai-providers)**
   - Configure at least one AI provider
   - Currently supports Ollama and Gemini
   - Provide necessary API keys and endpoints

3. **Create [Agents](/docs/Settings/agents)**
   - Configure agents with appropriate models and prompts
   - Set up the tools agents can access
   - Define validation functions to ensure code quality

4. **Configure the [System Agent](/docs/Settings/system-agent)**
   - Handles system tasks like commit messages and PR descriptions
   - Uses the same AI providers as regular agents

5. **Add a [Repository](/docs/Repositories/adding-a-repository)**
   - Connect to GitHub repositories or use local ones
   - Set up sync schedules to monitor for issues

6. **Create an Issue**
   - In GitHub: Create an issue and add the `mule` label
   - With Local Provider: Use the Mule interface to create an issue

Once set up, Mule will automatically:
1. Monitor repositories on the schedule you defined
2. Find issues labeled with `mule`
3. Generate solutions and create pull requests
4. Respond to any comments on those pull requests

## Command Line Options

Mule supports several command line options:

```bash
mule [options]
```

Options:
- `--config`: Specify a custom config path
- `--port`: Set a custom port (default: 8083)
- `--debug`: Enable debug logging
- `--help`: Display help information

## Demo

See Mule in action with this demonstration using the Local Provider:

<video controls src="https://storage.googleapis.com/mule-storage/devteam-local-demo.webm" width="350" height="350" type="video/webm"></video>

## Next Steps

After getting Mule running, you might want to:

- Learn about [interacting with repositories](/docs/Repositories/interacting-with-a-repository)
- Understand [agent configuration](/docs/Settings/agents) in more detail
- Explore [advanced features](/docs/Advanced) like RAG and integrations
- Configure [workflows](/docs/Settings/workflows) for complex tasks

## Troubleshooting

### Common Issues

**Mule can't connect to GitHub**
- Verify your GitHub token has the required permissions
- Check network connectivity and firewall settings

**AI provider connection fails**
- Ensure API keys are correctly entered
- Verify endpoint URLs are accessible
- Check rate limits on your AI provider

**Repository sync fails**
- Ensure SSH keys are properly configured
- Verify repository path permissions
- Check for available disk space

**No changes generated**
- Review issue description for clarity
- Check agent prompt templates
- Verify that selected AI model is capable of code generation

For more help, check the logs at `~/.config/mule/mule.log` or use the Logs page in the web interface.