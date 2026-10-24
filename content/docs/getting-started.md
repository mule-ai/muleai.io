---
weight: 1
title: "Getting Started"
description: "Getting started with Mule"
icon: "article"
date: "2025-02-20T20:46:32-05:00"
lastmod: "2026-04-04T00:00:00-05:00"
toc: true
---

## What is Mule?

Mule is an advanced multi-agent AI development platform that orchestrates sophisticated workflows and integrations. It serves as your autonomous development infrastructure, capable of:

- **Multi-Agent Workflows**: Orchestrate complex tasks with sequential steps, WASM modules, and validation
- **Multi-Provider Support**: OpenAI, Anthropic, Gemini, and Ollama with dynamic model switching
- **Skills System**: Extend agents with specialized capabilities using pi agent skills
- **WebAssembly Modules**: Custom workflow steps compiled to WASM for sandboxed execution
- **Built-in Tools**: Filesystem, bash, HTTP, and database tools for agent interactions
- **Semantic Memory**: Vector embedding storage for context retention and retrieval

## Architecture Overview

The following diagram shows how Mule's components work together:

```mermaid
graph TB
    subgraph External["External Services"]
        GH[GitHub<br/>Repositories & Issues]
        AI[AI Providers<br/>OpenAI, Anthropic, etc.]
    end

    subgraph Mule["Mule System"]
        UI[Web UI<br/>:8140]
        API[Mule API<br/>REST Endpoints]
        PG[(PostgreSQL<br/>Config & Jobs)]
        AGENTS[Agent Workers<br/>Task Processing]
        MEM[(Vector DB<br/>RAG Memory)]
    end

    UI <-->|HTTP| API
    API <-->|SQL| PG
    API <-->|Async| AGENTS
    AGENTS <-->|Read/Write| GH
    AGENTS <-->|Generate| AI
    AGENTS <-->|Store| MEM
```

### Agent Execution Model

When an agent processes a task, it follows this execution flow:

```mermaid
flowchart LR
    subgraph Input["Task Input"]
        Task[Task/Job Request]
        Context[Context & Memory]
    end

    subgraph Agent["Agent Processing"]
        LLM[LLM Decision Making]
        Tools[Tool Selection]
        WASM[WASM Validation]
    end

    subgraph Actions["Tool Actions"]
        FS[Filesystem<br/>Read/Write Files]
        Bash[Command Execution<br/>Run Scripts]
        HTTP[HTTP Requests<br/>API Calls]
        DB[Database Queries]
    end

    subgraph Output["Task Output"]
        Result[Result/Artifacts]
        Report[Status Report]
    end

    Task --> LLM
    Context --> LLM
    LLM -->|Decide next step| Tools
    Tools -->|Execute| Actions
    Actions -->|Results| LLM
    LLM -->|Validation needed| WASM
    WASM -->|Pass/Fail| LLM
    LLM -->|Complete| Result
    Result --> Report
```

**Key Components:**

| Component | Purpose | Example |
|-----------|---------|---------|
| **LLM** | Decision making and response generation | Claude, GPT-4, Ollama |
| **Tools** | Actions the agent can perform | File editing, bash commands, HTTP |
| **WASM Modules** | Custom validation logic | Type checking, linting, tests |
| **Memory** | Context retention and RAG | Vector embeddings of previous tasks |

## Prerequisites

Before installing Mule, ensure you have:

- **Go 1.25.4+**: Mule is built with Go 1.25.4 or newer
- **PostgreSQL 16+**: Required for configuration storage and job queuing (if not using Docker)
- **Git**: For repository operations
- **SSH keys**: Configured for GitHub access if using GitHub repositories
- **AI provider access**: API keys for your chosen AI provider (OpenAI, Anthropic, Gemini, Ollama)
- **GitHub token**: If you plan to use GitHub repositories (optional)
- **Docker & Docker Compose v2+**: For containerized deployment (recommended)
- **pi CLI**: Mule uses pi as its agent runtime. Install from [pi.dev](https://pi.dev) for agent execution. This provides the AI agent execution capabilities that power Mule's agents.

### Installing pi CLI

```bash
# Install pi CLI (see https://pi.dev for platform-specific instructions)
curl -fsSL https://pi.dev/install.sh | sh

# Verify installation
pi --version
```

> **Note**: The pi CLI is required for agent execution. Without it, agents will not be able to generate responses. When running Mule via Docker, the pi CLI is included in the container image.

## Installation

### Docker Installation (Recommended)

The easiest way to get started is using Docker Compose, which includes both the Mule API and PostgreSQL database:

```bash
git clone https://github.com/mule-ai/mule.git
cd mule

# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Manual Installation

For development or custom deployments:

1. **Set up PostgreSQL database**:
```sql
CREATE DATABASE mulev2;
CREATE USER mule WITH PASSWORD 'mule';
GRANT ALL PRIVILEGES ON DATABASE mulev2 TO mule;
```

2. **Clone and build**:
```bash
git clone https://github.com/mule-ai/mule.git
cd mule
go mod tidy
make build
```

3. **Run the application**:
```bash
./cmd/api/bin/mule -db "postgres://mule:mule@localhost:5432/mulev2?sslmode=disable"
```

### Installing Development Dependencies

For contributing to Mule:

```bash
make download-golangci-lint  # Install linting tools
make tidy                    # Download Go dependencies
```

## Configuration

Mule stores its configuration in a standard location based on your operating system:

- **Linux**: `~/.config/mule/`
- **macOS**: `~/Library/Application Support/mule/`
- **Windows**: `%APPDATA%\mule\`

The primary configuration is automatically created on first run.

## Running Mule

After installation, Mule is accessible through:
- **Web UI**: [http://localhost:8140](http://localhost:8140)
- **API**: [http://localhost:8140/v1](http://localhost:8140/v1)
- **Health check**: [http://localhost:8140/health](http://localhost:8140/health)

### Quick Start Guide

The following workflow shows how Mule processes a task from issue to pull request:

```mermaid
sequenceDiagram
    participant User
    participant GitHub
    participant Mule
    participant AI as AI Provider

    User->>GitHub: Create Issue with "mule" label
    Mule->>GitHub: Periodic sync (checks for labeled issues)
    GitHub-->>Mule: Returns new labeled issues
    Mule->>Mule: Queue issue for processing
    Mule->>AI: Send task with issue details + repo context
    AI-->>Mule: Generated code changes + explanation
    Mule->>GitHub: Create Draft PR with changes
    User->>GitHub: Review and merge PR
    User->>GitHub: Add comments on PR
    Mule->>GitHub: Process feedback via comments
```

Follow these steps to get Mule working with your first repository:

**Step 1: Initial Setup** (5 minutes)
1. Open the web UI at [http://localhost:8140](http://localhost:8140)
2. Navigate to **Settings → General** and add your GitHub token
   - Create a token at [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
   - Grant `repo` scope for full repository access
3. Go to **Settings → AI Providers** and add your API credentials
   - For OpenAI: Enter your API key from [platform.openai.com](https://platform.openai.com)
   - For Anthropic: Enter your API key from [console.anthropic.com](https://console.anthropic.com)
   - For Ollama: Enter `http://localhost:11434` as the endpoint (see note below about Docker networking)

**Step 2: Create Your First Agent** (3 minutes)
1. Go to **Settings → Agents**
2. Click **Add Agent**
3. Configure:
   - **Name**: "Code Assistant" (or your preference)
   - **Model**: Select your configured provider model (e.g., `anthropic/claude-sonnet-4.5`, `openai/gpt-4o`)
   - **System Prompt**: "You are a helpful coding assistant that reviews code and suggests improvements."
   - **PI Config**: Configure agent tools via JSON (see below)
4. Save the agent configuration

**PI Runtime Tools Configuration:**

Agents use pi runtime tools configured via the PI Config JSON field:

```json
{
  "thinking_level": "medium",
  "tools": ["read", "write", "edit", "bash", "grep", "find"]
}
```

Available pi tools:
- `read`: Read file contents
- `write`: Write content to files
- `edit`: Make surgical edits to files
- `bash`: Execute shell commands
- `grep`: Search for patterns in files
- `find`: Find files by name or pattern

**Database-Stored Tools:**

Mule also supports custom tools stored in the database for extended functionality:
- `memory`: Semantic storage and retrieval with vector embeddings
- `filesystem`: Secure file system operations (read, write, delete, list, exists)
- `http`: Make HTTP requests to external APIs
- `database`: Execute SQL queries (SELECT only for security)

See [Tools documentation](/docs/Settings/tools) for more details.

**Step 3: Create a Workflow with GitHub Integration** (10 minutes)
Mule uses WASM modules for GitHub integration. To automate GitHub operations:

1. Go to **Settings → WASM Modules** (or create a workflow via API)
2. Upload or reference GitHub WASM modules for your desired operations
3. Create a workflow that chains:
   - **Agent Step**: An AI agent to process issues or generate code
   - **WASM Module Steps**: GitHub operations (create PR, post comments, etc.)
4. Execute the workflow via API or Jobs UI

Example workflow creation via API:
```bash
# Create a workflow
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "github-automation", "description": "Process GitHub issues"}'

# Add an agent step
curl -X POST http://localhost:8140/api/v1/workflows/{workflow_id}/steps \
  -H "Content-Type: application/json" \
  -d '{"type": "agent", "agent_id": "{agent_id}", "step_order": 1}'
```

See [GitHub Integration](/docs/Repositories/adding-a-repository) for detailed examples.

**Step 4: Execute Your First Job** (2 minutes)
1. Navigate to **Jobs** in the web UI
2. Select your workflow or agent
3. Provide input parameters (e.g., issue URL, repository info)
4. Execute and monitor progress via WebSocket streaming
5. Review results and artifacts when complete

### First-Run Experience

Welcome to Mule! This guide will help you get the most out of your first experience.

#### Default Configuration

On first startup, Mule automatically creates default configurations to help you get started quickly:

- **Default Provider**: An OpenRouter provider configured with endpoint `https://openrouter.ai/api/v1` and no API key. OpenRouter offers free credits for new users - sign up at [openrouter.ai](https://openrouter.ai) to get an API key for full functionality.
- **Default Agent**: A general-purpose agent configured with:
  - Model: `anthropic/claude-sonnet-4.5` (provider/model format)
  - System Prompt: "You are a helpful assistant"
  - Provider: Connected to the Default provider
- **WASM Editor Agent**: A specialized agent for creating and debugging WASM modules, configured with the same provider and model
- **Default Workflow**: A basic workflow template with a single agent step, ready for customization

> **Note**: The default provider is pre-configured with OpenRouter's endpoint (`https://openrouter.ai/api/v1`). To use it, simply add your OpenRouter API key in **Settings → AI Providers** and select it for your agent. Without an API key, the agent won't be able to generate responses. You can also replace the OpenRouter provider with OpenAI, Anthropic, or another supported provider.

You can modify or delete these defaults once you're familiar with the system.

#### First-Run Checklist

Before diving in, ensure you've completed these setup steps:

- [ ] **Docker/PostgreSQL running**: Verify `docker-compose ps` shows services as "Up"
- [ ] **Web UI accessible**: Confirm [http://localhost:8140](http://localhost:8140) loads
- [ ] **Health check passing**: [http://localhost:8140/health](http://localhost:8140/health) returns `OK`
- [ ] **Default primitives created**: On first startup, Mule creates:
  - **Default** provider (OpenRouter, no API key by default)
  - **Default** agent (general purpose)
  - **WASM Editor** agent (for WASM module development)
  - **Default** workflow (basic template)
- [ ] **GitHub token configured**: Settings → General → GitHub Token saved (for GitHub WASM modules)
- [ ] **AI provider configured**: Settings → AI Providers → Add your API key to the Default provider (or create a new provider)
- [ ] **Workflow created**: Created a workflow with agents and GitHub WASM modules (see [GitHub Integration](/docs/Repositories/adding-a-repository))

#### Best Practices for New Users

- **Start Simple**: Begin with a small, well-understood repository to learn how Mule works. A personal project or fork with a few files is ideal.
- **Clear Issues**: Write clear, detailed issue descriptions for better results. Include:
  - What you want to accomplish
  - Any specific files or functions involved
  - Expected behavior or changes
  - Relevant context or background
- **Filter Issues with WASM**: When using GitHub WASM modules, configure filters to select specific issues (e.g., by label, state, or assignee). This allows Mule to focus on relevant tasks.
- **Iterate**: Review the generated PRs and refine your agent prompts based on results. Small adjustments to system prompts can significantly improve output quality.
- **Check Logs**: If something doesn't work, check the Logs page in the web UI for detailed error messages and API responses.
- **Test with Read-Only Tasks First**: Before requesting code changes or GitHub modifications, try asking Mule to review code or explain functionality to understand its capabilities.

#### What to Expect During First Run

1. **Job Execution**: When you submit a job, Mule processes it based on your workflow configuration
2. **Processing Time**: Workflow execution typically takes 1-5 minutes depending on task complexity and AI provider latency
3. **Streaming Output**: Watch the job execute in real-time via WebSocket streaming
4. **Artifact Creation**: Workflows can produce artifacts (code files, reports, etc.) stored with the job

#### Understanding the Port Mapping

Mule uses Docker to run services, with the following port configuration:

| Service | Internal Port | External Port (Docker) |
|---------|---------------|------------------------|
| API Server | `:8080` | `:8140` (mapped in docker-compose.yml) |
| PostgreSQL | `:5432` | Not exposed externally |

**Important**: When configuring providers or connecting services, use the Docker network names:
- **PostgreSQL**: Hostname `postgres` (from docker-compose network)
- **Ollama (local)**: `http://localhost:11434` (if running on host)

The API server is available at `http://localhost:8140` externally.

#### Real-Time Updates (WebSocket)

Mule supports real-time job updates via WebSocket. Connect to:

```
ws://localhost:8140/ws
```

This allows you to receive live notifications when:
- Jobs start, complete, or fail
- Workflow steps progress
- Agent tasks complete

The web UI automatically uses WebSocket for real-time updates in the Jobs page.

#### Common First-Run Mistakes to Avoid

- ❌ **Don't**: Create vague inputs like "fix the bug" — be specific about what needs to change
- ❌ **Don't**: Expect instant results — AI processing takes time (1-5 minutes per task)
- ❌ **Don't**: Use complex workflows initially — start with simple agent-only workflows
- ❌ **Don't**: Use `localhost` for provider endpoints in Docker — use actual IP addresses for host services
- ❌ **Don't**: Skip GitHub token configuration — WASM modules need authentication
- ✅ **Do**: Start with incremental improvements rather than large refactors
- ✅ **Do**: Review Mule's output before taking action (e.g., before merging PRs)
- ✅ **Do**: Start with the default agent configuration before customizing
- ✅ **Do**: Test with a simple, well-understood project first

#### Getting Help

If your first run doesn't go as expected:

1. **Check the Logs page** in the web UI for error messages
2. **Verify your configuration** in Settings — a missing API key or token is the most common issue
3. **Test your AI provider** independently to ensure API access is working
4. **Review the issue label** on GitHub to confirm it matches your configuration

For additional help, see the [Troubleshooting](#troubleshooting) section below.

Once set up, Mule will automatically:
1. Monitor repositories on the schedule you defined
2. Find issues labeled with `mule`
3. Generate solutions and create pull requests
4. Respond to any comments on those pull requests

#### Quick Test: Verify Your Setup

Before creating your first issue, verify everything is working:

**1. Health Check:**
```bash
curl http://localhost:8140/health
# Should return: OK
```

**2. List Available Models:**
```bash
curl http://localhost:8140/v1/models
# Should return a list of available models from your configured providers
```

**3. Check Agents:**
```bash
curl http://localhost:8140/api/v1/agents
# Should return your configured agents (including the default agent)
```

**4. Test API Access (if you have a provider configured):**
```bash
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agent/default",
    "messages": [{"role": "user", "content": "Hello! Can you respond briefly?"}]
  }'
# Should return a response from your agent
```

If any of these fail, check the [Troubleshooting](#troubleshooting) section below.

## Command Line Options

Mule supports several command line options:

```bash
mule [options]
```

Options:
- `-db`: PostgreSQL connection string (default: `postgres://user:pass@localhost:5432/mulev2?sslmode=disable`)
- `-listen`: HTTP listen address (default: `:8080`)

### Environment Variables

Mule also supports configuration via environment variables. You can set the database connection string and listen address:

```bash
export DB_CONN_STR="postgres://user:pass@localhost:5432/mulev2?sslmode=disable"
export LISTEN_ADDR=":8080"

# Run with environment variables
./cmd/api/bin/mule
```

## Demo

See Mule in action with this demonstration using the Local Provider:

<video controls src="https://storage.googleapis.com/mule-storage/devteam-local-demo.webm" width="350" height="350" type="video/webm"></video>

## Next Steps

After getting Mule running, you might want to:

- Review [Configuration](/docs/Settings/configuration) for CLI flags and startup settings
- Learn about [interacting with repositories](/docs/Repositories/interacting-with-a-repository)
- Understand [agent configuration](/docs/Settings/agents) in more detail
- Explore [advanced features](/docs/Advanced) like RAG and integrations
- Configure [workflows](/docs/Settings/workflows) for complex tasks

## Troubleshooting

This section covers common issues you may encounter when setting up and running Mule.

### Installation Issues

**Docker containers fail to start**
```bash
# Check Docker is running
docker ps

# View container logs for detailed errors
docker-compose logs

# Restart services
docker-compose down && docker-compose up -d
```

**Port 8140 already in use**
```bash
# Find what's using the port
lsof -i :8140

# Kill the process or change the port in docker-compose.yml
```

**Database connection errors**
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check connection string format
# Format: postgres://user:password@host:5432/database?sslmode=disable
```

**Default configurations not created**
On first run, Mule should create default providers, agents, and workflows. If these are missing:
1. Check the logs: `docker-compose logs mule-api`
2. Verify the database is healthy: `docker-compose exec postgres psql -U mule -d mulev2 -c "\dt"`
3. Restart the container: `docker-compose restart mule-api`

### Configuration Issues

**Mule can't connect to GitHub**
- Verify your GitHub token has the `repo` scope required
- Check network connectivity: `curl https://api.github.com`
- Confirm firewall isn't blocking outbound connections
- Ensure token hasn't expired—generate a new one if needed

**AI provider connection fails**
- **OpenAI**: Verify API key at [platform.openai.com](https://platform.openai.com)
- **Anthropic**: Check key at [console.anthropic.com](https://console.anthropic.com)
- **Ollama**: Ensure service is running: `curl http://localhost:11434/api/tags`
- **Gemini**: Verify API key in Google AI Studio

**Ollama not accessible from Docker**
If you're running Ollama on your host machine and Mule is in Docker, Ollama may not be accessible at `localhost`. Try:
```bash
# Get your host's IP address
hostname -I | awk '{print $1}'

# Use the IP address instead of localhost
# e.g., http://192.168.1.100:11434
```

Alternatively, configure Ollama to listen on all interfaces:
```bash
# Set Ollama to listen on all network interfaces
export OLLAMA_HOST=0.0.0.0:11434

# Or on Linux, create a systemd override:
sudo systemctl edit ollama
# Add:
# [Service]
# Environment="OLLAMA_HOST=0.0.0.0:11434"
```

**Rate limiting errors**
- Check your AI provider's rate limits
- Reduce job frequency in workflow settings
- Consider upgrading your provider plan

### GitHub Integration Issues

**GitHub WASM module fails**
- Verify your GitHub token has the `repo` scope required
- Check the job logs for specific error messages from the WASM module
- Ensure GitHub API rate limits aren't exceeded

**WASM module not found**
- Verify the module is uploaded and available in your workflow
- Check the workflow step configuration for correct module IDs

**Jobs not being created**
- Review agent configuration has necessary tools enabled
- Check agent's system prompt isn't too restrictive
- Verify model has code generation capabilities

**No changes generated**
- Ensure input parameters are clear and actionable
- Check Logs page for AI provider errors
- Verify model context window isn't being exceeded
- Review agent prompt template for clarity
- Verify WASM modules received correct input data

### Runtime Issues

**Slow response times**
- Check AI provider latency in provider settings
- Reduce job frequency in workflow settings
- Limit concurrent agent tasks

**Memory or resource issues**
```bash
# Check Docker resource usage
docker stats

# Increase memory limits in docker-compose.yml if needed
```

### Getting Help

1. **Check the Logs page** in the web UI for detailed error messages
2. **Verify configuration** in Settings — a missing API key is the most common issue
3. **Test your connections** independently:
   - AI provider: `curl` your provider's API endpoint
   - GitHub: `ssh -T git@github.com`
   - Database: `docker-compose exec postgres psql -U mule -d mulev2`
4. **Review the issue label** on GitHub to confirm it matches your configuration

For more help, check the logs at `~/.config/mule/mule.log` or use the Logs page in the web interface.