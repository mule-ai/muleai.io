---
weight: 6
title: "WASM Modules"
description: "Extending Mule with WebAssembly modules for custom workflow steps"
icon: "article"
date: "2026-03-21"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

WebAssembly (WASM) modules extend Mule's capabilities by allowing you to write custom workflow steps in Go (or other languages that compile to WASM). WASM modules run in a sandboxed environment with access to host functions provided by Mule.

## Overview

WASM modules in Mule provide:

- **Sandboxed execution** - Run custom code safely within workflows
- **Host function access** - Communicate with the outside world through Mule's APIs
- **JSON I/O** - Simple input/output via stdin/stdout using JSON
- **Performance** - Near-native execution speed
- **Portability** - Compile once, run anywhere (WASM is platform-independent)

## How WASM Modules Work

### Input/Output Pattern

WASM modules receive configuration and data via stdin as JSON, process it, and output results to stdout as JSON:

```go
// Input structure
type Input struct {
    Prompt string                 `json:"prompt"`
    Data   map[string]interface{} `json:"data,omitempty"`
}

// Output structure
type Output struct {
    Result  string                 `json:"result"`
    Data    map[string]interface{} `json:"data,omitempty"`
    Success bool                   `json:"success"`
}

func main() {
    decoder := json.NewDecoder(os.Stdin)
    var input Input
    decoder.Decode(&input)
    
    // Process input...
    
    output := Output{
        Result:  "processed: " + input.Prompt,
        Success: true,
    }
    
    encoder := json.NewEncoder(os.Stdout)
    encoder.Encode(output)
}
```

### Host Functions

WASM modules access host capabilities through imported functions. Mule provides the following host functions:

#### HTTP Requests

```go
//go:wasmimport env http_request_with_headers
func http_request_with_headers(methodPtr, methodSize, urlPtr, urlSize, bodyPtr, bodySize, headersPtr, headersSize uint32) uint32

//go:wasmimport env get_last_response_body
func get_last_response_body(bufferPtr, bufferSize uint32) uint32

//go:wasmimport env get_last_response_status
func get_last_response_status() uint32
```

#### Workflow & Agent Execution

```go
//go:wasmimport env trigger_workflow_or_agent
func trigger_workflow_or_agent(operationTypePtr, operationTypeSize, idPtr, idSize, paramsPtr, paramsSize uint32) uint32

//go:wasmimport env execute_target
func execute_target(operationTypePtr, operationTypeSize, idPtr, idSize, paramsPtr, paramsSize uint32) uint32

//go:wasmimport env wait_for_job_and_get_output
func wait_for_job_and_get_output(jobIDPtr, jobIDSize, bufferPtr, bufferSize uint32) uint32
```

#### Bash Command Execution

```go
//go:wasmimport env execute_bash_command
func execute_bash_command(commandPtr, commandSize, workingDirPtr, workingDirSize uint32) uint32
```

#### Git Operations

```go
//go:wasmimport env create_git_branch
func create_git_branch(branchNamePtr, branchNameSize, baseBranchPtr, baseBranchSize uint32) uint32

//go:wasmimport env push_git_branch
func push_git_branch(remotePtr, remoteSize, branchNamePtr, branchNameSize, forcePtr uint32) uint32

//go:wasmimport env create_git_worktree
func create_git_worktree(pathPtr, pathSize, branchPtr, branchSize, commitPtr, commitSize uint32) uint32
```

#### Working Directory Management

```go
//go:wasmimport env get_working_directory
func get_working_directory(bufferPtr, bufferSize uint32) uint32

//go:wasmimport env set_working_directory
func set_working_directory(pathPtr, pathSize uint32) uint32

//go:wasmimport env get_current_branch
func get_current_branch(bufferPtr, bufferSize uint32) uint32
```

#### Result Retrieval

```go
//go:wasmimport env get_last_operation_result
func get_last_operation_result(bufferPtr, bufferSize uint32) uint32

//go:wasmimport env get_last_operation_status
func get_last_operation_status() uint32
```

## Building WASM Modules

### Prerequisites

- Go 1.25+ or TinyGo
- Basic understanding of Go programming

### Installing TinyGo (Optional)

For smaller WASM binaries, install TinyGo:

```bash
# macOS
brew install tinygo

# Linux (from binary release)
curl -sfL https://github.com/tinygo-org/tinygo/releases/download/v0.35.0/tinygo_0.35.0_amd64.deb -o /tmp/tinygo.deb
sudo dpkg -i /tmp/tinygo.deb

# Windows (from binary release)
# Download from https://github.com/tinygo-org/tinygo/releases
```

Verify installation:
```bash
tinygo version
```

### Using Standard Go

```bash
GOOS=wasip1 GOARCH=wasm go build -o module.wasm main.go
```

### Using TinyGo (for smaller binaries)

```bash
tinygo build -o module.wasm -target wasi main.go
```

### Example: Simple Text Processor

Create a module that transforms text:

```go
// main.go
package main

import (
    "encoding/json"
    "fmt"
    "os"
    "strings"
)

type Input struct {
    Text     string `json:"text"`
    Transform string `json:"transform"` // uppercase, lowercase, titlecase
}

type Output struct {
    Result  string `json:"result"`
    Success bool   `json:"success"`
}

func main() {
    var input Input
    json.NewDecoder(os.Stdin).Decode(&input)
    
    var result string
    switch input.Transform {
    case "uppercase":
        result = strings.ToUpper(input.Text)
    case "lowercase":
        result = strings.ToLower(input.Text)
    case "titlecase":
        result = strings.Title(input.Text)
    default:
        result = input.Text
    }
    
    json.NewEncoder(os.Stdout).Encode(Output{
        Result:  result,
        Success: true,
    })
}
```

Build and test locally:

```bash
GOOS=wasip1 GOARCH=wasm go build -o text-transform.wasm main.go
wasmtime text-transform.wasm
```

## Available Example Modules

Mule includes several example WASM modules in `examples/wasm/`:

### Text Processing

| Module | Description |
|--------|-------------|
| `text-processor` | Simple text transformation (uppercase, etc.) |
| `advanced-processor` | Configurable text operations |
| `pirate-transform` | Transform text to pirate speak |
| `jq-filter` | Apply jq filters to JSON data |

### HTTP Operations

| Module | Description |
|--------|-------------|
| `http-request` | Make basic HTTP GET/POST requests |
| `http-request-with-headers` | HTTP requests with custom headers |
| `templated-http-request` | HTTP requests with template variable substitution |
| `post-to-mdserve` | Post content to mdserve for markdown rendering |

### GitHub Integration

| Module | Description |
|--------|-------------|
| `github-issues` | Fetch and filter GitHub issues |
| `issues-to-markdown` | Convert issues to formatted Markdown |
| `github-comment` | Post comments to GitHub issues |
| `create-pull-request` | Create GitHub pull requests |
| `git-branch-push` | Push git branches to remote |
| `git-worktree` | Manage git worktrees for parallel development |
| `issue-state-tracker` | Track and update issue states |

### Workflow Control

| Module | Description |
|--------|-------------|
| `execute-target` | Execute named targets in workflows |
| `run-default-workflow` | Trigger the default workflow |
| `array-workflow-launcher` | Launch multiple workflows from array data |
| `spawn-multi-workflow` | Spawn multiple workflows in parallel |
| `workflow-aggregator` | Aggregate results from multiple workflows |
| `workflow_agent_demo` | Trigger workflows or agents from WASM |
| `working-dir-demo` | Demonstrate working directory management |
| `worktree-name-generator` | Generate unique worktree names |
| `prompt-sender` | Send prompts to agents and retrieve responses |

### Validation

| Module | Description |
|--------|-------------|
| `validation-module` | Run validation commands with retry logic |

## Using WASM Modules in Workflows

### 1. Build the Module

```bash
cd examples/wasm/text-processor
GOOS=wasip1 GOARCH=wasm go build -o text-processor.wasm main.go
```

### 2. Upload to Mule

Encode the binary and upload via API:

```bash
# Encode to base64
BASE64_WASM=$(base64 -w 0 text-processor.wasm)

# Upload via API
curl -X POST http://localhost:8140/api/v1/wasm-modules \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"text-processor\",
    \"description\": \"Transform text to uppercase, lowercase, or title case\",
    \"module_data\": \"$BASE64_WASM\",
    \"config\": {
      \"input_schema\": {
        \"text\": \"string\",
        \"transform\": \"string\"
      }
    }
  }"
```

### 3. Create a Workflow Step

```bash
# Create workflow with WASM step
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "text-processing-pipeline",
    "description": "Process text through multiple transformations"
  }'

WORKFLOW_ID="workflow-uuid"

# Add WASM module step
curl -X POST http://localhost:8140/api/v1/workflows/${WORKFLOW_ID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wasm_module",
    "wasm_module_id": "wasm-module-uuid",
    "config": {
      "transform": "uppercase"
    }
  }'
```

### 4. Execute the Workflow

```bash
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "workflow/text-processing-pipeline",
    "messages": [
      {"role": "user", "content": "Transform this text: hello world"}
    ]
  }'
```

## Complete Workflow Example

Here's a complete example using the GitHub issues fetcher:

```json
{
  "name": "github-issue-analysis",
  "description": "Fetch GitHub issues and analyze them",
  "is_async": false,
  "steps": [
    {
      "step_order": 1,
      "type": "wasm_module",
      "wasm_module_id": "github-issues-uuid",
      "config": {
        "url": "https://api.github.com/repos/owner/repo/issues",
        "state": "open",
        "labels": ["bug", "help wanted"]
      }
    },
    {
      "step_order": 2,
      "type": "wasm_module",
      "wasm_module_id": "issues-to-markdown-uuid",
      "config": {
        "format": "detailed"
      }
    },
    {
      "step_order": 3,
      "type": "agent",
      "agent_id": "analysis-agent-uuid",
      "config": {
        "task": "Analyze the following GitHub issues and identify common themes:\n{{step_2.output}}"
      }
    }
  ]
}
```

## Best Practices

### Input Validation

Always validate inputs in your WASM module:

```go
func main() {
    var input Input
    if err := json.NewDecoder(os.Stdin).Decode(&input); err != nil {
        outputError(fmt.Errorf("failed to decode input: %w", err))
        return
    }
    
    if input.Text == "" {
        outputError(fmt.Errorf("text field is required"))
        return
    }
    // Process...
}
```

### Error Handling

Return meaningful error messages:

```go
func outputError(err error) {
    fmt.Fprintf(os.Stderr, "Error: %v\n", err)
    os.Exit(1)
}
```

### Memory Management

Be careful with memory pointers in WASM:

```go
// Keep references to byte slices to prevent garbage collection
commandBytes := []byte(command)
commandPtr := uint32(uintptr(unsafe.Pointer(&commandBytes[0])))
// Important: keep reference to prevent GC
_ = commandBytes
```

### Testing Locally

Test with wasmtime before deploying:

```bash
# Create test input
echo '{"text": "hello world", "transform": "uppercase"}' | wasmtime module.wasm
```

### Binary Size

For production, consider using TinyGo for smaller binaries:

```bash
# Standard Go: ~2-3MB
GOOS=wasip1 GOARCH=wasm go build -o module.wasm main.go

# TinyGo: ~100-500KB
tinygo build -o module.wasm -target wasi main.go
```

## Hot Reload

Mule supports hot reloading of WASM modules. After uploading a new version, workflows will automatically use the updated module without restart. This is useful for development and iterative improvements.

## Module Configuration

WASM modules can have associated configuration data that is automatically merged with input data when the module executes. This allows you to store static configuration values directly with the module.

### How Configuration Works

When a WASM module with configuration is executed, the configuration data is merged with the input data before being passed to the module via stdin as JSON.

For example, if your module has this configuration stored in the database:
```json
{
  "api_key": "secret123",
  "endpoint": "https://api.example.com",
  "timeout": 30
}
```

And the workflow passes this input data:
```json
{
  "prompt": "Process this text"
}
```

Your WASM module will receive the combined data via stdin:
```json
{
  "prompt": "Process this text",
  "api_key": "secret123",
  "endpoint": "https://api.example.com",
  "timeout": 30
}
```

### Setting Configuration via API

When uploading a WASM module, you can include configuration in the `config` field:

```bash
# Upload via API with configuration
curl -X POST http://localhost:8140/api/v1/wasm-modules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "api-processor",
    "description": "Process data using an external API",
    "module_data": "'"$(base64 -w 0 module.wasm)"'",
    "config": {
      "api_key": "your-api-key-here",
      "base_url": "https://api.example.com/v1",
      "timeout_seconds": 30,
      "retries": 3
    }
  }'
```

### Configuration Best Practices

1. **Use for Static Values**: Configuration is best for static values that don't change between executions, such as:
   - API keys and secrets
   - Service endpoints
   - Timeout values
   - Feature flags

2. **Keep It Secure**: Remember that configuration is stored in the database. Don't store highly sensitive information unless your Mule instance is properly secured.

3. **Test with Configuration**: When testing modules in development, manually provide the configuration values that would normally come from the stored config.

4. **Update Anytime**: You can update the configuration for an existing module at any time - changes take effect immediately for new executions.

### Example: API Integration Module

Here's an example module that uses configuration for API settings:

```go
package main

import (
    "encoding/json"
    "fmt"
    "os"
)

type InputData struct {
    Prompt    string                 `json:"prompt"`
    APIKey    string                 `json:"api_key"`
    BaseURL   string                 `json:"base_url"`
    Timeout   int                    `json:"timeout_seconds"`
}

type OutputData struct {
    Result  string `json:"result"`
    Success bool   `json:"success"`
}

func main() {
    var input InputData
    json.NewDecoder(os.Stdin).Decode(&input)
    
    // Use configuration values for API call
    result := callAPI(input.Prompt, input.APIKey, input.BaseURL, input.Timeout)
    
    json.NewEncoder(os.Stdout).Encode(OutputData{
        Result:  result,
        Success: true,
    })
}

func callAPI(prompt, apiKey, baseURL string, timeout int) string {
    // Your API integration logic here
    return fmt.Sprintf("Processed '%s' using API at %s", prompt, baseURL)
}
```

## Limitations

- WASM modules run in a sandboxed environment
- No direct file system access (use bash or filesystem tools)
- No network access directly (use HTTP host functions)
- Limited memory compared to native execution
- Fixed timeout (controlled by workflow timeout settings)

## Next Steps

- Explore the [WASM examples](https://github.com/mule-ai/mule/tree/main/examples/wasm) in the repository
- Learn about [workflows](/docs/Settings/workflows/) to integrate WASM modules
- Check out [validation modules](/docs/Advanced/validation/) for testing workflows
