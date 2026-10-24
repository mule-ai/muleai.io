---
weight: 2
title: "Integration Capabilities"
description: "Extending Mule with tools, skills, and WASM modules"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2026-04-11T00:00:00-05:00"
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

#### API Middleware

Mule's HTTP API includes middleware for request handling:

**Logging Middleware**
All HTTP requests are logged with method, path, status code, and duration:
```
GET /api/v1/agents 200 1.5ms
POST /v1/chat/completions 200 2.3s
```

**CORS Middleware**
Cross-Origin Resource Sharing is enabled for all endpoints:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

**Timeout Middleware**
Non-chat requests have configurable timeouts (default: 5 minutes). Chat completions and WebSocket connections are excluded from timeout handling as they have their own timeout management.

To configure API timeout:
```bash
# Set timeout to 10 minutes (600 seconds)
curl -X PUT http://localhost:8140/api/v1/settings/api_timeout \
  -H "Content-Type: application/json" \
  -d '{"value": "600"}'
```

### Skills System

Skills extend agent capabilities using the pi agent framework:
- Assign specialized skills to agents for specific tasks
- Skills can provide custom tools, prompts, and execution context
- Available at `/root/.pi/agent/skills/`
- Skills are loaded from skill directories containing SKILL.md files

For detailed information on managing skills, see the [Skills documentation](/docs/settings/skills).

### Extensions System

The extensions system allows you to extend agent capabilities with custom extensions:

```yaml
extensions:
  - name: "custom-extension"
    enabled: true
```

Extensions are loaded by the pi runtime and can provide:
- Additional tools and capabilities
- Custom UI interactions
- External service integrations

**Note:** Extensions must be installed and available to the pi runtime. Contact your system administrator for available extensions.

### Extension UI Request/Response Pattern

When agents need interactive user input (confirmations, selections, or text input), they use the Extension UI Request/Response pattern. This enables sophisticated human-in-the-loop workflows.

#### How It Works

1. **Agent requests input**: The agent sends an `extension_ui_request` event through the PI RPC bridge
2. **Frontend receives request**: The client application receives the request and displays a modal or input dialog
3. **User responds**: The user provides input (confirms, selects an option, or enters text)
4. **Response sent back**: The response is sent back to the agent via `extension_ui_response`

#### Request Types

| Type | Description | Parameters |
|------|-------------|------------|
| `select` | Present options for user selection | `options` (array), `message` |
| `confirm` | Request yes/no confirmation | `message` |
| `input` | Request text input from user | `message`, `timeout` |
| `custom` | Custom UI request | `method`, `title`, `message` |

#### Request Format

```json
{
  "type": "extension_ui_request",
  "id": "request-uuid",
  "method": "select",
  "title": "Choose an action",
  "message": "What would you like to do?",
  "options": ["Fix the bug", "Create tests", "Skip"],
  "timeout": 300
}
```

#### Response Format

```json
{
  "type": "extension_ui_response",
  "id": "request-uuid",
  "value": "Fix the bug",
  "confirmed": true,
  "cancelled": false
}
```

#### Cancellation Format

```json
{
  "type": "extension_ui_response",
  "id": "request-uuid",
  "cancelled": true
}
```

#### WebSocket Integration Example

When using WebSocket for streaming responses, handle UI requests like this:

```javascript
// In your WebSocket handler
websocket.on('message', (data) => {
  const event = JSON.parse(data);
  
  if (event.type === 'extension_ui_request') {
    // Display modal to user
    showModal({
      title: event.title,
      message: event.message,
      options: event.options,
      timeout: event.timeout
    }).then(response => {
      // Send response back
      ws.send(JSON.stringify({
        type: 'extension_ui_response',
        id: event.id,
        value: response.value,
        confirmed: response.confirmed
      }));
    }).catch(() => {
      // User cancelled or timed out
      ws.send(JSON.stringify({
        type: 'extension_ui_response',
        id: event.id,
        cancelled: true
      }));
    });
  }
});
```

#### Delivery Notes

UI requests are delivered **only over the WebSocket stream** (`/ws`), where the
PI RPC bridge broadcasts `extension_ui_request` events alongside agent deltas.
There is no REST endpoint for submitting UI responses — `POST /v1/chat/completions`
does not return an `awaiting_input` status and does not support interactive
round-trips. Responses are written back to the pi process stdin by the server-side
bridge (`SendExtensionUIResponse` / `SendExtensionUICancel`).

The WebSocket control channel currently accepts only `subscribe` and `unsubscribe`
operations (per-job subscriptions); interactive response routing from clients is
handled by the mule frontend.

#### Best Practices

- **Always handle timeouts**: Set appropriate timeouts and provide user feedback
- **Cancel gracefully**: Allow users to cancel requests and propagate cancellation to the agent
- **Queue requests**: If multiple requests arrive, queue them and handle sequentially
- **Log interactions**: Track UI interactions for debugging and auditing

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

### WASM HTTP Requests

WASM modules can make HTTP requests to external services using host-imported functions. This enables WASM modules to interact with APIs, fetch data, and integrate with external systems.

#### Standard HTTP Request (`http_request`)

The standard interface supports basic HTTP methods (GET, POST, PUT, DELETE, etc.):

```go
//go:wasmimport env http_request
func http_request(methodPtr, methodSize, urlPtr, urlSize, bodyPtr, bodySize uintptr) uintptr
```

**Parameters:**
- `methodPtr/size` - HTTP method (GET, POST, PUT, DELETE)
- `urlPtr/size` - Target URL
- `bodyPtr/size` - Request body (can be 0/empty for GET)

**Example:**
```go
//go:build ignore

package main

import (
    "encoding/json"
    "fmt"
    "os"
    "unsafe"
)

type Output struct {
    Success    bool        `json:"success"`
    Data       interface{} `json:"data,omitempty"`
    StatusCode int         `json:"status_code,omitempty"`
    Error      string      `json:"error,omitempty"`
}

//go:wasmimport env http_request
func http_request(methodPtr, methodSize, urlPtr, urlSize, bodyPtr, bodySize uintptr) uintptr

func getStringFromMemory(ptr uintptr, length uintptr) string {
    byteSlice := (*[1 << 30]byte)(unsafe.Pointer(ptr))[:length:length]
    return string(byteSlice)
}

func main() {
    method := "GET"
    url := "https://api.github.com/repos/mule-ai/mule"
    
    result := http_request(
        uintptr(unsafe.Pointer(&[]byte(method)[0])), uintptr(len(method)),
        uintptr(unsafe.Pointer(&[]byte(url)[0])), uintptr(len(url)),
        0, 0,
    )
    
    output := Output{Success: result != 0}
    json.NewEncoder(os.Stdout).Encode(output)
}
```

#### Enhanced HTTP Request with Headers (`http_request_with_headers`)

For requests requiring custom headers (authentication, content-type, etc.):

```go
//go:wasmimport env http_request_with_headers
func http_request_with_headers(methodPtr, methodSize, urlPtr, urlSize, bodyPtr, bodySize, headersPtr, headersSize uintptr) uintptr
```

**Parameters:**
- Same as standard, plus:
- `headersPtr/size` - JSON string of headers (e.g., `{"Authorization": "Bearer token"}`)

**Example:**
```go
//go:wasmimport env http_request_with_headers
func http_request_with_headers(methodPtr, methodSize, urlPtr, urlSize, bodyPtr, bodySize, headersPtr, headersSize uintptr) uintptr

func main() {
    method := "POST"
    url := "https://api.github.com/repos/mule-ai/mule/issues"
    body := `{"title": "Bug found", "body": "Description"}`
    headers := `{"Authorization": "Bearer ghp_xxxx", "Accept": "application/json"}`
    
    result := http_request_with_headers(
        uintptr(unsafe.Pointer(&[]byte(method)[0])), uintptr(len(method)),
        uintptr(unsafe.Pointer(&[]byte(url)[0])), uintptr(len(url)),
        uintptr(unsafe.Pointer(&[]byte(body)[0])), uintptr(len(body)),
        uintptr(unsafe.Pointer(&[]byte(headers)[0])), uintptr(len(headers)),
    )
}
```

#### Response Functions

After making a request, retrieve the response:

```go
//go:wasmimport env get_last_response_body
func get_last_response_body(bufferPtr, bufferSize uintptr) uint32

//go:wasmimport env get_last_response_status
func get_last_response_status() uint32
```

#### Network Demo Example

See `examples/wasm/http-request/` in the Mule source for a complete working example with JSON response parsing.

### Built-in Tools

Mule provides built-in tools for workflow steps. For complete documentation on tool configuration and the Tools API, see the [Tools documentation](/docs/settings/tools).

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
tool_type: "bash"  # bash, filesystem, http, database, memory
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
curl -X POST http://localhost:8140/api/v1/jobs \
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
  http://localhost:8140/api/v1/agents
```

## Complete API Integration Examples

### 1. Create a Provider

First, configure an AI provider:

```bash
curl -X POST http://localhost:8140/api/v1/providers \
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
curl -X POST http://localhost:8140/api/v1/agents \
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
curl http://localhost:8140/api/v1/providers/{provider-uuid}/models
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
curl -X POST http://localhost:8140/api/v1/workflows \
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
curl -X POST http://localhost:8140/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "agent-uuid-1",
    "config": {}
  }'

# Add WASM module step (step 2)
curl -X POST http://localhost:8140/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wasm_module",
    "wasm_module_id": "wasm-module-uuid",
    "config": {}
  }'

# Add another agent step (step 3)
curl -X POST http://localhost:8140/api/v1/workflows/{workflow-uuid}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "agent-uuid-2",
    "config": {}
  }'
```

### 5. Execute a Workflow via Chat Completions API

Execute the workflow using OpenAI-compatible API:

```bash
curl -X POST http://localhost:8140/v1/chat/completions \
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
curl -X POST http://localhost:8140/v1/chat/completions \
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
curl http://localhost:8140/api/v1/jobs/{job-uuid}
```

### 7. List and Monitor Jobs

```bash
# List recent jobs with pagination
curl "http://localhost:8140/api/v1/jobs?page=1&page_size=20"

# Filter by status
curl "http://localhost:8140/api/v1/jobs?status=failed"

# Search jobs by workflow name
curl "http://localhost:8140/api/v1/jobs?workflow_name=bug-fix"
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