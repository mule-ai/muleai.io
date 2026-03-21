---
weight: 6
title: "WASM Modules"
description: "Extending Mule with WebAssembly modules for custom workflow steps"
icon: "article"
date: 2026-03-21
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
curl -X POST http://localhost:8080/api/v1/wasm-modules \
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
curl -X POST http://localhost:8080/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "text-processing-pipeline",
    "description": "Process text through multiple transformations"
  }'

WORKFLOW_ID="workflow-uuid"

# Add WASM module step
curl -X POST http://localhost:8080/api/v1/workflows/${WORKFLOW_ID}/steps \
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
curl -X POST http://localhost:8080/v1/chat/completions \
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
