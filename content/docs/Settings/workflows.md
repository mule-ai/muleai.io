---
weight: 6
title: "Workflows"
description: "Understanding and configuring Mule workflows"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2026-03-21T12:00:00-05:00"
toc: true
---

Workflows are at the heart of Mule's ability to coordinate complex AI tasks. A workflow defines a sequence of steps that Mule follows when processing issues and generating code.

## Workflow Architecture

Each workflow consists of:

- **Steps**: Individual tasks performed by agents or WASM modules
- **Input Mappings**: How data flows between steps
- **Output Fields**: What data is produced by each step
- **Job Management**: Tracking and execution of workflow runs

Workflows enable you to chain together multiple agents, each with specific responsibilities, to solve complex problems collaboratively.

## Default Workflow

Mule comes with a default workflow that follows this sequence:

1. **Starting Agent**: Analyzes the issue and generates initial code changes
2. **Commit Agent**: Generates appropriate commit messages for changes
3. **PR Title Agent**: Creates a descriptive pull request title
4. **PR Body Agent**: Writes a comprehensive pull request description

This default workflow is suitable for most use cases and requires minimal configuration.

## Workflow Steps

Each workflow consists of ordered steps. Steps can be of two types:

### Agent Steps

Execute an AI agent to process input and generate output.

```json
{
  "id": "unique-step-id",
  "workflow_id": "workflow-uuid",
  "step_order": 1,
  "type": "agent",
  "agent_id": "agent-uuid",
  "config": {
    "outputField": "generatedText",
    "agentName": "My Agent"
  }
}
```

### WASM Module Steps

Execute a WebAssembly module for custom processing, validation, or tooling.

```json
{
  "id": "unique-step-id",
  "workflow_id": "workflow-uuid",
  "step_order": 2,
  "type": "wasm_module",
  "wasm_module_id": "wasm-module-uuid",
  "config": {}
}
```

### Step Configuration (Config Field)

The `config` JSON object contains step-specific settings:

| Field | Type | Description |
|-------|------|-------------|
| `outputField` | string | How to extract output from the step result. Options: `generatedText` (final content only), `generatedTextWithReasoning` (includes reasoning), or leave empty for raw output |
| `agentName` | string | Optional human-readable name for logging and debugging |
| Any custom key | any | Additional configuration can be added as needed |

### Step Properties

- **id**: A unique identifier for the step
- **workflow_id**: The UUID of the parent workflow
- **step_order**: Execution order within the workflow (1, 2, 3...)
- **type**: Step type - either `agent` or `wasm_module`
- **agent_id**: UUID of the agent to execute (for agent steps)
- **wasm_module_id**: UUID of the WASM module to execute (for WASM steps)
- **config**: JSON object with step-specific configuration

## Output Fields

Output fields define how to process the raw output from a step:

- **generatedText**: Extracts only the final generated content (code, text, etc.)
- **generatedTextWithReasoning**: Includes the agent's reasoning along with the final output
- **(empty)**: Passes the raw output from the step to the next step

When a step completes its work, its output is processed according to the outputField setting and then passed to the next step in the workflow.

## Working Directory Management

Workflows support working directory management across steps:

1. **Initial Directory**: When submitting a job, you can specify an initial working directory
2. **Directory Passing**: The working directory is passed to each step during execution
3. **Directory Updates**: WASM modules can set a new working directory that will be used by subsequent steps

This enables workflows to:
- Clone repositories and work within them
- Create git worktrees for parallel processing
- Maintain context across multiple steps

## Job Management

When a workflow is executed, it creates a **Job** that tracks the entire execution:

### Job Statuses

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting to be processed |
| `running` | Job is currently being executed |
| `completed` | Job finished successfully |
| `failed` | Job encountered an error |
| `cancelled` | Job was manually cancelled |

### Job Steps

Each workflow step execution is tracked as a **JobStep** with its own status:

| Status | Description |
|--------|-------------|
| `queued` | Step is waiting to be executed |
| `running` | Step is currently being executed |
| `completed` | Step finished successfully |
| `failed` | Step encountered an error |

### Job Timeout

Jobs have a configurable timeout controlled by the `timeout_job_seconds` setting (default: 3600 seconds / 1 hour). If a job exceeds this timeout, it will be marked as failed.

### Submitting Jobs

Jobs can be submitted via the API with optional working directory:

```bash
# Submit a job with a specific working directory
POST /api/jobs
{
  "workflow_id": "workflow-uuid",
  "working_directory": "/path/to/repository",
  "input_data": {
    "prompt": "Your input data here"
  }
}
```

## WASM Modules in Workflows

WASM modules extend workflow capabilities with custom processing logic:

### Host Functions

WASM modules have access to host functions for:

- **Git Operations**: `get_current_branch`, `create_git_branch`, `push_git_branch`, `create_git_worktree`
- **Bash Execution**: `execute_bash_command` - run shell commands with output capture
- **HTTP Requests**: `http_request`, `http_request_with_headers` - make external API calls
- **Agent/Workflow Triggers**: `trigger_workflow_or_agent` - invoke other workflows or agents
- **Job Management**: `get_job_output`, `wait_for_job_and_get_output` - monitor job execution

### Validation Modules

Validation modules are WASM modules that check code quality:

- Check code formatting
- Run linters and formatters (e.g., gofmt, golangci-lint)
- Execute tests (e.g., go test)
- Validate dependencies
- Run custom build checks

Validation modules receive the generated code as input and return validation results. If validation fails, Mule can make additional attempts to fix the issues by asking the agent to revise its output.

See the [WASM validation module example](https://github.com/mule-ai/mule/tree/main/examples/wasm/validation-module) for guidance on creating custom validators.

## Advanced: Multi-Agent Workflows

More complex tasks can benefit from specialized multi-agent workflows:

```json
{
  "id": "code-analysis-workflow",
  "name": "Code Analysis",
  "description": "Analyzes code and provides improvement suggestions",
  "is_async": false,
  "steps": [
    {
      "type": "agent",
      "agent_id": "agent-uuid-1",
      "step_order": 1,
      "config": { "outputField": "generatedText" }
    },
    {
      "type": "agent",
      "agent_id": "agent-uuid-2",
      "step_order": 2,
      "config": { "outputField": "generatedText" }
    },
    {
      "type": "wasm_module",
      "wasm_module_id": "wasm-module-uuid",
      "step_order": 3,
      "config": {}
    }
  ]
}
```

In this example:
1. One agent analyzes the code
2. A second agent suggests improvements
3. A WASM module validates and processes the output

## Workflow Triggers

Workflows can be triggered by:

- **Repository synchronization** (automatic)
- **Manual sync** button on the repository page
- **External triggers** from integrations (Discord, Matrix, etc.)
- **Direct API submission** of jobs

When triggered, a workflow will process any eligible issues (those labeled with `mule` that don't already have pull requests or have unresolved PR comments).

## Customizing Workflows

Mule supports sophisticated multi-agent workflows with full production capabilities:

1. **Sequential Step Execution**: Chain multiple agents with context passing
2. **WASM Module Steps**: Execute custom logic via WebAssembly modules
3. **Working Directory Management**: Maintain and update working directory across steps
4. **Job Timeout Configuration**: Set time limits for workflow execution
5. **Job Step Tracking**: Monitor individual step execution status
6. **Dynamic Output Processing**: Choose between generatedText, generatedTextWithReasoning, or raw output modes

## Best Practices

For optimal workflow performance:

- Start with simple, well-defined tasks
- Ensure agent prompts are clear and specific
- Include relevant context in issue descriptions
- Test workflows with the local provider before using with GitHub
- Review output for common errors and iterate on prompts
- Set appropriate job timeouts for complex workflows
- Use WASM modules for deterministic operations (formatting, linting, testing)