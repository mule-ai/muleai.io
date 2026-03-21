---
weight: 2
title: "Integration Capabilities"
description: "Extending Mule with tools, skills, and WASM modules"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

Mule provides multiple integration points to extend its capabilities through tools, skills, and WebAssembly modules. These integrations allow you to customize how Mule executes workflows and interacts with external systems.

## Supported Integration Types

Mule supports several types of integrations:

### HTTP API Integration

REST API endpoints for:
- External system communication
- Webhook reception
- Status queries
- Workflow triggers
- Agent management
- Job creation and monitoring

The HTTP API is the primary integration mechanism for external applications. See the [API documentation](/docs/getting-started) for details on available endpoints.

### Skills System

Skills extend agent capabilities using the pi agent framework:
- Assign specialized skills to agents for specific tasks
- Skills can provide custom tools, prompts, and execution context
- Available at `/root/.pi/agent/skills/`
- Skills are loaded from skill directories containing SKILL.md files

Example skill configuration:
```yaml
skills:
  - path: "/root/.pi/agent/skills/search-cli"
    enabled: true
  - path: "/root/.pi/agent/skills/code"
    enabled: true
```

### WebAssembly Modules

WASM modules provide sandboxed imperative code execution:
- Compile Go or other languages to WASM for workflow steps
- Execute custom logic with wazero runtime
- Input/output via JSON through stdin/stdout
- Useful for data transformation, validation, and custom processing

Example WASM module structure:
```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type Input struct {
    Prompt string                 `json:"prompt"`
    Data   map[string]interface{} `json:"data"`
}

type Output struct {
    Result  string                 `json:"result"`
    Data    map[string]interface{} `json:"data"`
    Success bool                   `json:"success"`
}

func main() {
    var input Input
    decoder := json.NewDecoder(os.Stdin)
    if err := decoder.Decode(&input); err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }
    
    // Process input and generate output
    output := Output{
        Result:  "processed: " + input.Prompt,
        Data:    input.Data,
        Success: true,
    }
    
    encoder := json.NewEncoder(os.Stdout)
    encoder.Encode(output)
}
```

### Built-in Tools

Mule provides built-in tools for workflow steps:

#### Bash Tool
Execute shell commands:
```yaml
tool_type: bash
command: "ls -la"
timeout: 30
```

#### Filesystem Tool
File system operations:
```yaml
tool_type: filesystem
operation: "read"  # read, write, delete, list, exists
path: "/tmp/data.json"
```

#### HTTP Tool
Make HTTP requests:
```yaml
tool_type: http
url: "https://api.example.com/data"
method: "GET"
headers:
  Authorization: "Bearer token"
```

#### Database Tool
Database operations (PostgreSQL):
```yaml
tool_type: database
operation: "query"  # query, execute
sql: "SELECT * FROM users WHERE active = true"
```

## Workflow Step Integration

Integrations are used within workflows as steps. Each step can use one of the following types:

### Agent Step
Execute an AI agent with optional skills:
```yaml
step_type: agent
agent_id: "agent-uuid"
skills:
  - "skill-id-1"
  - "skill-id-2"
```

### WASM Module Step
Execute a compiled WASM module:
```yaml
step_type: wasm_module
wasm_module_id: "wasm-module-uuid"
```

### Tool Step
Execute a built-in tool:
```yaml
step_type: tool
tool_type: "bash"  # bash, filesystem, http, database
config:
  command: "ls -la"
  timeout: 30
```

## Creating Custom Tools

Mule's tool system is extensible. To create a custom tool:

1. Implement the `Tool` interface in a Go file:
   ```go
   type Tool interface {
       Name() string
       Execute(ctx context.Context, config map[string]interface{}) (map[string]interface{}, error)
   }
   ```

2. Register the tool in the tool registry (`internal/tools/registry.go`)

3. Add the tool to the API handlers if needed

## External API Integration

Integrate Mule with external systems using the HTTP API:

### Webhook Integration

Receive external events by configuring webhooks:
```bash
# Configure a workflow to trigger on external events
curl -X POST http://localhost:8080/api/v1/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "workflow-uuid",
    "input_data": {
      "trigger": "webhook",
      "payload": {}
    }
  }'
```

### API Authentication

All API requests require authentication:
```bash
# Using API key in header
curl -H "X-API-Key: your-api-key" \
  http://localhost:8080/api/v1/agents
```

## Complete API Integration Examples

### 1. Create a Provider

First, configure an AI provider:

```bash
curl -X POST http://localhost:8080/api/v1/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "anthropic",
    "api_base_url": "https://api.anthropic.com",
    "api_key_encrypted": "sk-ant-..."
  }'
```

Response:
```json
{
  "id": "provider-uuid",
  "name": "anthropic",
  "api_base_url": "https://api.anthropic.com",
  "api_key_encrypted": "sk-ant-...",
  "created_at": "2026-03-21T10:00:00Z",
  "updated_at": "2026-03-21T10:00:00Z"
}
```

### 2. Create an Agent with Skills

Create an agent and assign skills to it:

```bash
# Create agent with skills
curl -X POST http://localhost:8080/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "code-reviewer",
    "description": "Reviews code for best practices and bugs",
    "provider_id": "provider-uuid",
    "model_id": "claude-sonnet-4-20250514",
    "system_prompt": "You are a code reviewer. Analyze code changes and provide constructive feedback.",
    "pi_config": {
      "thinking_level": "medium"
    },
    "skill_ids": ["skill-uuid-1", "skill-uuid-2"]
  }'
```

### 3. List Available Models for a Provider

Query available models from a provider:

```bash
curl http://localhost:8080/api/v1/providers/{provider-uuid}/models
```

Response:
```json
{
  "data": [
    {"id": "claude-sonnet-4-20250514", "name": "claude-sonnet-4-20250514"},
    {"id": "claude-opus-4-20250514", "name": "claude-opus-4-20250514"},
    {"id": "claude-haiku-4-20250514", "name": "claude-haiku-4-20250514"}
  ]
}
```

### 4. Create a Workflow with Steps

Create a multi-step workflow:

```bash
# First create the workflow
curl -X POST http://localhost:8080/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bug-fix-workflow",
    "description": "Automated bug fix pipeline",
    "is_async": false
  }'
```

Then add steps to the workflow:

```bash
# Add agent step (step 1)
curl -X POST http://localhost:8080/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "agent-uuid-1",
    "config": {
      "input_mapping": {
        "bug_description": "previous_step.output"
      }
    }
  }'

# Add WASM module step (step 2)
curl -X POST http://localhost:8080/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wasm_module",
    "wasm_module_id": "wasm-module-uuid"
  }'

# Add another agent step (step 3)
curl -X POST http://localhost:8080/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "agent-uuid-2",
    "config": {
      "input_mapping": {
        "analysis": "step_2.output"
      }
    }
  }'
```

### 5. Execute a Workflow via Chat Completions API

Execute the workflow using OpenAI-compatible API:

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "workflow/bug-fix-workflow",
    "messages": [
      {"role": "user", "content": "Fix the login bug where users get logged out unexpectedly"}
    ],
    "working_directory": "/repositories/my-app"
  }'
```

Response:
```json
{
  "id": "chatcmpl-job-uuid",
  "object": "chat.completion",
  "created": 1742553600,
  "model": "workflow/bug-fix-workflow",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Bug analysis complete. Found issue in session handling. Fixed and tests passing."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1500,
    "completion_tokens": 200,
    "total_tokens": 1700
  }
}
```

### 6. Execute a Workflow Asynchronously

For long-running workflows, use async execution:

```bash
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "async/workflow/long-build-workflow",
    "messages": [
      {"role": "user", "content": "Build and deploy the production release"}
    ]
  }'
```

Response (immediately returns job info):
```json
{
  "id": "job-uuid",
  "object": "async.job",
  "status": "queued",
  "message": "The workflow has been started"
}
```

Then poll for job status:

```bash
curl http://localhost:8080/api/v1/jobs/{job-uuid}
```

### 7. List and Monitor Jobs

```bash
# List recent jobs with pagination
curl "http://localhost:8080/api/v1/jobs?page=1&page_size=20"

# Filter by status
curl "http://localhost:8080/api/v1/jobs?status=failed"

# Search jobs by workflow name
curl "http://localhost:8080/api/v1/jobs?workflow_name=bug-fix"
```

## Best Practices

When integrating with Mule:

- Use workflows for complex multi-step processes
- Leverage skills for specialized agent capabilities
- Use WASM modules for performance-critical transformations
- Store sensitive credentials in environment variables
- Implement proper error handling in custom tools
- Test integrations with small inputs first
- Monitor API rate limits when making external requests
- Use async workflows for operations that may exceed timeout limits
- Set appropriate timeouts in settings for your use case