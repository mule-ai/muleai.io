---
weight: 40
title: "Parallel Workflow Execution"
description: "Learn how to launch multiple workflows in parallel and process data batches"
icon: "article"
date: "2026-03-30"
lastmod: "2026-03-30"
toc: true
---

# Parallel Workflow Execution

Mule supports parallel workflow execution through WASM modules, allowing you to launch multiple workflows simultaneously and process data batches efficiently.

## Overview

Instead of executing workflows sequentially, you can use WASM modules to:

- **Launch multiple workflows in parallel**: Process several items simultaneously
- **Batch processing**: Apply the same workflow to multiple inputs
- **Parallel task execution**: Run independent tasks concurrently
- **Result aggregation**: Collect and combine results from multiple executions

## Key Concepts

### Host Functions for Workflow Execution

Mule provides host functions that WASM modules can use to trigger workflows and agents:

```go
// Execute a target (workflow or agent)
func execute_target(targetType string, targetID string, params map[string]interface{}) uint32

// Get the result of the last operation
func get_last_operation_result() ([]byte, error)

// Get the status of the last operation
func get_last_operation_status() int32
```

### Parallel vs Sequential Execution

| Approach | Use Case | Pros | Cons |
|----------|----------|------|------|
| Sequential | Dependent tasks | Simple, reliable | Slow |
| Parallel | Independent tasks | Fast, efficient | Complex result handling |
| Hybrid | Mixed dependencies | Flexible | More planning required |

## Available WASM Modules

Mule includes several modules for parallel execution:

| Module | Purpose | Location |
|--------|---------|----------|
| **spawn-multi-workflow** | Launch multiple workflows in parallel | `examples/wasm/spawn-multi-workflow/` |
| **array-workflow-launcher** | Process array data with a workflow | `examples/wasm/array-workflow-launcher/` |
| **jq-filter** | Transform and filter JSON data | `examples/wasm/jq-filter/` |

## Spawn Multiple Workflows

The `spawn-multi-workflow` module launches multiple workflows in parallel:

### Input Format

```json
{
  "workflow_names": ["workflow-a", "workflow-b", "workflow-c"],
  "prompt": "Process this data",
  "working_directory": "/tmp/shared-workspace"
}
```

### Output Format

```json
{
  "results": [
    {
      "name": "workflow-a",
      "success": true
    },
    {
      "name": "workflow-b", 
      "success": true
    },
    {
      "name": "workflow-c",
      "success": false,
      "error": "Workflow execution failed"
    }
  ],
  "success": true
}
```

### Complete Workflow Example

```json
{
  "name": "Parallel Analysis",
  "steps": [
    {
      "type": "Agent",
      "name": "Gather Data",
      "agent_id": "{data-agent-id}",
      "input": "Fetch data from all sources"
    },
    {
      "type": "WASM",
      "name": "Launch Parallel Analysis",
      "wasm_module_id": "{spawn-multi-workflow-id}",
      "config": {
        "workflow_names": ["analyze-code", "analyze-docs", "analyze-tests"],
        "prompt": "{{steps.0.output}}"
      }
    },
    {
      "type": "Agent",
      "name": "Summarize Results",
      "agent_id": "{summary-agent-id}",
      "input": "Combine and summarize the analysis results:\n\n{{steps.1.output}}"
    }
  ]
}
```

## Process Data Arrays

The `array-workflow-launcher` module processes array data by launching a workflow for each item:

### Input Format

```json
{
  "prompt": {
    "result": [
      {"id": 1, "title": "Item 1", "content": "..."},
      {"id": 2, "title": "Item 2", "content": "..."},
      {"id": 3, "title": "Item 3", "content": "..."}
    ]
  },
  "workflow": "process-item",
  "working_directory": "/tmp/item-processing"
}
```

### Output Format

```json
{
  "results": [
    {
      "index": 0,
      "success": true,
      "data": {"processed": true, "item_id": 1}
    },
    {
      "index": 1,
      "success": true,
      "data": {"processed": true, "item_id": 2}
    },
    {
      "index": 2,
      "success": true,
      "data": {"processed": true, "item_id": 3}
    }
  ]
}
```

### Complete Workflow Example

```json
{
  "name": "Batch Issue Processing",
  "steps": [
    {
      "type": "WASM",
      "name": "Fetch Issues",
      "wasm_module_id": "{github-issues-module-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}",
        "repo_url": "https://github.com/owner/repo",
        "filters": {"state": "open", "per_page": 10}
      }
    },
    {
      "type": "WASM",
      "name": "Process Each Issue",
      "wasm_module_id": "{array-workflow-launcher-id}",
      "config": {
        "workflow": "analyze-issue",
        "working_directory": "/tmp/issues"
      }
    },
    {
      "type": "WASM",
      "name": "Generate Report",
      "wasm_module_id": "{jq-filter-id}",
      "config": {
        "query": "[.results[] | {id: .data.issue_id, priority: .data.priority}]"
      }
    }
  ]
}
```

## Data Transformation with jq

The `jq-filter` module transforms JSON data using jq queries:

### Input Format

```json
{
  "prompt": {"items": [{"name": "a", "value": 1}, {"name": "b", "value": 2}]},
  "query": ".items[] | select(.value > 1) | .name"
}
```

### Output Format

```json
{
  "result": "b"
}
```

### Common jq Queries

| Purpose | Query |
|---------|-------|
| Extract field | `.name` |
| Filter array | `.items[] \| select(.active == true)` |
| Group by field | `group_by(.category) \| .[]` |
| Sum values | `[.items[].price] \| add` |
| Flatten nested | `.nested[] \| .values[]` |
| Extract keys | `keys` |
| Count items | `length` |

### Complete Workflow Example

```json
{
  "name": "Data Analysis Pipeline",
  "steps": [
    {
      "type": "WASM",
      "name": "Fetch Raw Data",
      "wasm_module_id": "{http-request-module-id}",
      "config": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "type": "WASM",
      "name": "Filter Active Items",
      "wasm_module_id": "{jq-filter-id}",
      "config": {
        "query": "[.items[] | select(.status == \"active\")]"
      }
    },
    {
      "type": "WASM",
      "name": "Calculate Totals",
      "wasm_module_id": "{jq-filter-id}",
      "config": {
        "query": "[.result[].amount] | add"
      }
    },
    {
      "type": "Agent",
      "name": "Generate Insights",
      "agent_id": "{analysis-agent-id}",
      "input": "Analyze these metrics:\n\nTotal: {{steps.2.output}}"
    }
  ]
}
```

## Error Handling

When parallel execution encounters errors:

### Partial Failure

If some workflows fail, the module still returns results for successful executions:

```json
{
  "results": [
    {"index": 0, "success": true},
    {"index": 1, "success": false, "error": "Timeout"},
    {"index": 2, "success": true}
  ],
  "success": true
}
```

### Error Handling Strategy

```json
{
  "name": "Resilient Parallel Processing",
  "steps": [
    {
      "type": "WASM",
      "name": "Process Items",
      "wasm_module_id": "{array-workflow-launcher-id}",
      "config": {
        "workflow": "process-item",
        "retry_failed": true,
        "max_retries": 3
      }
    },
    {
      "type": "Agent",
      "name": "Handle Failures",
      "agent_id": "{recovery-agent-id}",
      "input": "Review failed items and create recovery tasks:\n\n{{steps.0.output}}"
    }
  ]
}
```

## Best Practices

### 1. Keep Workflows Independent

Parallel execution works best when workflows don't depend on each other's output:

```json
// Good: Independent tasks
"workflow_names": ["send-email", "update-database", "generate-report"]

// Avoid: Dependent tasks (use sequential instead)
"workflow_names": ["create-user", "send-welcome-email"]  // Second depends on first
```

### 2. Set Appropriate Timeouts

Long-running parallel tasks can cause issues:

```json
{
  "config": {
    "workflow_names": ["task-a", "task-b", "task-c"],
    "timeout_seconds": 300
  }
}
```

### 3. Use Working Directories for Isolation

Prevent conflicts between parallel executions:

```json
{
  "config": {
    "workflow_names": ["process-item-1", "process-item-2"],
    "working_directory": "/tmp/mule-batch-{{.job_id}}"
  }
}
```

### 4. Aggregate Results Carefully

Handle partial failures when combining results:

```json
{
  "type": "Agent",
  "name": "Aggregate Results",
  "agent_id": "{aggregation-agent-id}",
  "input": "Combine successful results, log failures:\n\n{{steps.0.output}}"
}
```

## Monitoring Parallel Executions

### WebSocket Events

Monitor parallel execution progress:

```javascript
websocket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.event === "step_complete") {
    console.log(`Step ${data.step} completed`);
    console.log(`Progress: ${data.completed}/${data.total}`);
  }
  
  if (data.event === "workflow_result") {
    console.log(`Workflow ${data.name}: ${data.success ? 'success' : 'failed'}`);
  }
};
```

### Job Status API

Check job status for parallel executions:

```bash
curl http://localhost:8140/api/v1/jobs/{job-id}
```

## Related Documentation

- [Building WASM Modules](/docs/Tutorials/building-wasm-module)
- [WASM Module Reference](/docs/Advanced/wasm-modules)
- [Workflow Configuration](/docs/Settings/workflows)
- [GitHub Integration](/docs/Repositories/interacting-with-a-repository)
