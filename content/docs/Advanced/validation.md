---
weight: 2
title: "Validation Functions"
description: "Understanding validation in Mule"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2026-03-21T03:01:00-05:00"
toc: true
---

Validation in Mule operates at two levels: data structure validation and workflow execution validation.

## Data Structure Validation

Mule includes validation functions for ensuring data integrity when creating and updating resources:

### Agent Validation

```go
func (v *Validator) ValidateAgent(agent *primitive.Agent) ValidationErrors
```

Validates:
- Name is required and non-empty
- Provider ID is required
- Model ID is required
- System prompt is required

### Provider Validation

```go
func (v *Validator) ValidateProvider(provider *primitive.Provider) ValidationErrors
```

Validates:
- Name is required and non-empty
- API base URL is required and must be a valid URL
- API key is required

### Workflow Validation

```go
func (v *Validator) ValidateWorkflow(workflow *primitive.Workflow) ValidationErrors
```

Validates:
- Name is required and non-empty

### Workflow Step Validation

```go
func (v *Validator) ValidateWorkflowStep(step *primitive.WorkflowStep) ValidationErrors
```

Validates:
- Workflow ID is required
- Step order must be non-negative
- Step type must be either `agent` or `wasm_module`
- For agent steps: agent ID is required
- For WASM steps: WASM module ID is required

### Tool Validation

```go
func (v *Validator) ValidateTool(tool *primitive.Tool) ValidationErrors
```

Validates:
- Name is required
- Metadata is required
- Tool type must be one of: `http`, `database`, `memory`, `filesystem`

### Skill Validation

```go
func (v *Validator) ValidateSkill(skill *primitive.Skill) ValidationErrors
```

Validates:
- Name is required
- Path is required

## Workflow Execution Validation

### Job Timeout Validation

Workflows have configurable timeouts:

```yaml
settings:
  - key: "timeout_job_seconds"
    value: "3600"  # Default: 1 hour
```

When a job exceeds the timeout, it's marked as failed with the error: `"job timed out after X seconds"`

### Step Type Validation

Workflow steps are validated at execution time:

1. **Agent Steps**: Require a valid agent ID
2. **WASM Steps**: Require a valid WASM module ID

If either is missing, the step fails with an appropriate error message.

### Working Directory Persistence

Each workflow maintains a working directory that persists across steps:

1. The initial working directory can be provided when submitting a job
2. WASM modules can update the working directory by returning `new_working_directory` in their output
3. Subsequent steps receive the updated working directory

## Custom Validation via WASM Modules

For code quality validation, you can create custom WASM modules that:

1. Execute linting tools (golangci-lint, eslint, pylint)
2. Run tests (go test, jest, pytest)
3. Run formatters (go fmt, prettier)
4. Perform custom validation logic
5. Trigger automatic corrections via corrective workflows

### WASM Validation Module Features

The Mule validation module (`examples/wasm/validation-module`) provides:

- **Retry logic**: Configurable maximum attempts before failure
- **Corrective workflows**: Automatic execution of fix workflows on failure
- **Working directory handling**: Automatic detection or explicit configuration
- **Detailed error reporting**: Exit codes, stdout/stderr capture

### Configuration

```json
{
  "validation_command": "golangci-lint run ./...",
  "corrective_workflow_id": "workflow-uuid-for-fixes",
  "max_attempts": 3,
  "working_directory": "/path/to/project"
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `validation_command` | Yes | - | Command to execute for validation |
| `corrective_workflow_id` | No | - | UUID of workflow to run on failure |
| `max_attempts` | No | 3 | Maximum retry attempts |
| `working_directory` | No | host-provided | Working directory for command execution |

### Complete Validation Workflow Example

Create a validation workflow with retry logic:

```bash
# 1. Create the validation workflow
curl -X POST http://localhost:8080/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "lint-and-fix",
    "description": "Run linter with automatic fixes on failure",
    "is_async": false
  }'

WORKFLOW_UUID="workflow-uuid"

# 2. Add validation step
curl -X POST http://localhost:8080/api/v1/workflows/${WORKFLOW_UUID}/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wasm_module",
    "wasm_module_id": "validation-module-uuid",
    "config": {
      "validation_command": "golangci-lint run ./...",
      "corrective_workflow_id": "auto-fix-workflow-uuid",
      "max_attempts": 3,
      "working_directory": "/repositories/my-project"
    }
  }'

# 3. Execute the workflow
curl -X POST http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "workflow/lint-and-fix",
    "messages": [
      {"role": "user", "content": "Run linting on the authentication module"}
    ],
    "working_directory": "/repositories/my-project"
  }'
```

### Validation Module Error Handling

The validation WASM module returns detailed error codes:

| Exit Code | Hex Code | Meaning |
|-----------|----------|---------|
| 0 | - | Command succeeded |
| -6 | 0xFFFFFFFA | Command execution was cancelled |
| -16 | 0xFFFFFFF0 | Failed to read command from WASM memory |
| -15 | 0xFFFFFFF1 | Failed to read working directory |
| -14 | 0xFFFFFFF2 | Failed to get current working directory |
| -13 | 0xFFFFFFF3 | Working directory does not exist |
| -12 | 0xFFFFFFF4 | Command timed out (30 second limit) |
| -11 | 0xFFFFFFF5 | Command execution failed |
| N | Non-zero | Command exited with status code N |

### Retry Loop

The validation module implements a retry loop:

1. Execute validation command
2. If successful, return result immediately
3. If failed and attempts remain:
   - Trigger corrective workflow (if configured)
   - Re-execute validation command
4. If all attempts exhausted, return failure

### Error Codes

The WASM module reports detailed error codes:

| Code | Meaning |
|------|---------|
| `0xFFFFFFFA` | Command execution was cancelled |
| `0xFFFFFFF0` | Failed to read command from WASM memory |
| `0xFFFFFFF1` | Failed to read working directory from WASM memory |
| `0xFFFFFFF2` | Failed to get current working directory |
| `0xFFFFFFF3` | Working directory does not exist |
| `0xFFFFFFF4` | Command timed out (30 second limit) |
| `0xFFFFFFF5` | Command execution failed |
| Non-zero exit | Command exited with specific status code |

### Corrective Workflow Context

When a corrective workflow is triggered, it receives:

```json
{
  "original_prompt": "golangci-lint run ./...",
  "validation_output": {
    "command": "...",
    "exit_code": 1,
    "stdout": "linting errors...",
    "stderr": ""
  },
  "working_directory": "/path/to/project",
  "remaining_attempts": 2,
  "corrective_workflow_id": "workflow-uuid"
}
```

### Example: Go Linting WASM Module

A custom WASM module could:

```go
func lintGoCode(ctx context.Context, input map[string]interface{}) (map[string]interface{}, error) {
    workingDir, _ := input["working_directory"].(string)
    
    // Run golangci-lint
    result, err := runCommand("golangci-lint run ./...", workingDir)
    if err != nil {
        return map[string]interface{}{
            "success": false,
            "errors":  result,
        }, nil
    }
    
    return map[string]interface{}{
        "success": true,
        "output":  result,
    }, nil
}
```

## Chat Completion Request Validation

When using the Mule API for chat completions, requests are validated to ensure proper formatting:

```go
func (v *Validator) ValidateChatCompletionRequest(model string, messages []map[string]interface{}) ValidationErrors
```

Validates:
- **Model format**: Must start with `agent/`, `workflow/`, or `async/workflow/`
- **Messages**: At least one message is required
- **Message structure**: Each message must have a non-empty `role` and `content` field

Example valid request:
```json
{
  "model": "agent/my-agent-id",
  "messages": [
    {"role": "user", "content": "Hello, can you help me?"}
  ]
}
```

### Model Prefixes

| Prefix | Purpose |
|--------|---------|
| `agent/` | Direct agent execution |
| `workflow/` | Synchronous workflow execution |
| `async/workflow/` | Asynchronous workflow execution |

## Skill ID Validation

When creating agents with skills, the skill IDs must exist in the database:

```go
func (v *Validator) ValidateSkillIDs(ctx context.Context, store primitive.PrimitiveStore, skillIDs []string) ValidationErrors
```

Validates:
- Skill ID cannot be empty
- Skill must exist in the database
- Returns specific error if skill not found

## ID Format Validation

```go
func (v *Validator) ValidateID(id string, fieldName string) ValidationErrors
```

Validates:
- ID is not empty
- ID follows UUID format (8-4-4-4-12 hex pattern)

## Error Handling

Validation errors are collected and returned as `ValidationErrors`:

```go
type ValidationError struct {
    Field   string `json:"field"`
    Message string `json:"message"`
}
```

All errors in a validation pass are returned together, allowing the caller to address multiple issues at once.

## Best Practices

1. **Validate early**: Validate data before submission to avoid runtime errors
2. **Provide clear messages**: Include actionable error messages
3. **Set appropriate timeouts**: Consider your workflow complexity when setting job timeouts
4. **Handle step failures**: Design workflows to handle step failures gracefully
5. **Use WASM for custom validation**: Implement project-specific validation as WASM modules for portability
