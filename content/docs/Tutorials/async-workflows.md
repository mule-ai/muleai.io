---
weight: 15
title: "Async Workflow Execution"
description: "Learn how to run long-running workflows asynchronously with job polling and WebSocket updates"
icon: "article"
date: "2026-03-31T00:00:00-05:00"
lastmod: "2026-03-31T00:00:00-05:00"
toc: true
---

Async workflow execution allows you to run long-running workflows without blocking your application. This is essential for tasks like building large projects, running tests, or processing multiple repositories.

## When to Use Async Workflows

Use async workflows when:

- **Workflows exceed timeout limits** - Long-running tasks that would timeout synchronously
- **Parallel execution needed** - Trigger multiple workflows simultaneously
- **Background processing** - Start a workflow and check status later
- **WebSocket integration** - Real-time updates without polling

## Creating an Async Workflow

### 1. Mark Workflow as Async

When creating a workflow, set `is_async` to `true`:

```bash
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "build-and-deploy",
    "description": "Build project and deploy to staging",
    "is_async": true
  }'
```

Response:
```json
{
  "id": "workflow-uuid",
  "name": "build-and-deploy",
  "description": "Build project and deploy to staging",
  "is_async": true,
  "created_at": "2026-03-31T10:00:00Z",
  "updated_at": "2026-03-31T10:00:00Z"
}
```

### 2. Add Workflow Steps

Add your workflow steps as usual:

```bash
# Add build step
curl -X POST http://localhost:8140/api/v1/workflows/workflow-uuid/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "build-agent-uuid",
    "config": {
      "task": "Build the project using make build"
    }
  }'

# Add deploy step
curl -X POST http://localhost:8140/api/v1/workflows/workflow-uuid/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "deploy-agent-uuid",
    "config": {
      "task": "Deploy to staging environment"
    }
  }'
```

## Executing Async Workflows

### Using the Chat Completions API

Execute using the `async/workflow/` prefix:

```bash
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "async/workflow/build-and-deploy",
    "messages": [
      {"role": "user", "content": "Build and deploy version 2.0 to staging"}
    ]
  }'
```

Response (immediately returns job info):
```json
{
  "id": "job-uuid",
  "object": "async.job",
  "status": "queued",
  "message": "The workflow has been queued for execution"
}
```

## Monitoring Job Status

### Poll for Status

Check job status using the Jobs API:

```bash
curl http://localhost:8140/api/v1/jobs/job-uuid
```

Response:
```json
{
  "id": "job-uuid",
  "workflow_id": "workflow-uuid",
  "workflow_name": "build-and-deploy",
  "status": "running",
  "working_directory": "/tmp/mule-jobs/build-and-deploy-abc123",
  "input_data": {
    "prompt": "Your input data here"
  },
  "created_at": "2026-03-31T10:00:00Z",
  "started_at": "2026-03-31T10:00:05Z"
}
```

### Job Status Values

| Status | Description |
|--------|-------------|
| `queued` | Job is waiting to be processed |
| `running` | Job is currently executing |
| `completed` | Job finished successfully |
| `failed` | Job failed with an error |
| `cancelled` | Job was cancelled |

### Listing Jobs

```bash
# List recent jobs
curl "http://localhost:8140/api/v1/jobs?page=1&page_size=20"

# Filter by status
curl "http://localhost:8140/api/v1/jobs?status=failed"

# Filter by workflow name
curl "http://localhost:8140/api/v1/jobs?workflow_name=build-and-deploy"
```

## Real-Time Updates with WebSocket

Instead of polling, use WebSocket for real-time updates:

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8140/ws');

ws.onopen = () => {
  console.log('Connected to Mule WebSocket');

  // Subscribe to job updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    job_id: 'job-uuid'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'job_started':
      console.log('Job started:', data.job_id);
      break;
    case 'job_progress':
      console.log('Progress:', data.step, 'of', data.total_steps);
      break;
    case 'job_completed':
      console.log('Job completed!');
      console.log('Output:', data.output);
      ws.close();
      break;
    case 'job_failed':
      console.error('Job failed:', data.error);
      ws.close();
      break;
  }
};
```

## Handling Workflow Output

### Get Final Output

When a job completes, retrieve the full output:

```bash
curl http://localhost:8140/api/v1/jobs/job-uuid
```

Response with output:
```json
{
  "id": "job-uuid",
  "workflow_id": "workflow-uuid",
  "workflow_name": "build-and-deploy",
  "status": "completed",
  "output_data": {
    "prompt": "Your final output here",
    "usage": {
      "total_tokens": 1234
    }
  },
  "created_at": "2026-03-31T10:00:00Z",
  "started_at": "2026-03-31T10:00:05Z",
  "completed_at": "2026-03-31T10:02:00Z"
}
```

### Accessing Step Outputs

Reference outputs from previous steps using the template syntax:

```bash
curl -X POST http://localhost:8140/api/v1/workflows/workflow-uuid/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "review-agent-uuid",
    "config": {
      "task": "Review the deployment results:\n{{step_1.output}}"
    }
  }'
```

## Error Handling

### Handle Failures

When a job fails, check the error details:

```bash
curl http://localhost:8140/api/v1/jobs/job-uuid
```

Response:
```json
{
  "id": "job-uuid",
  "workflow_id": "workflow-uuid",
  "status": "failed",
  "output_data": {
    "error": "Build step failed: test suite had 3 failures"
  },
  "created_at": "2026-03-31T10:00:00Z",
  "started_at": "2026-03-31T10:00:05Z",
  "completed_at": "2026-03-31T10:01:00Z"
}
```

### View Job Steps

View individual step execution details:

```bash
curl http://localhost:8140/api/v1/jobs/job-uuid/steps
```

Response:
```json
{
  "job_steps": [
    {
      "id": "step-uuid",
      "job_id": "job-uuid",
      "workflow_step_id": "workflow-step-uuid",
      "agent_name": "Build Agent",
      "step_order": 1,
      "status": "completed",
      "input_data": {},
      "output_data": {
        "generatedText": "Build completed successfully"
      },
      "started_at": "2026-03-31T10:00:10Z",
      "completed_at": "2026-03-31T10:00:45Z"
    }
  ]
}
```

## Timeout Configuration

### Set Job Timeouts

Configure timeouts in general settings:

```bash
# Set job timeout to 30 minutes
curl -X PUT http://localhost:8140/api/v1/settings/job_timeout \
  -H "Content-Type: application/json" \
  -d '{
    "value": "1800"
  }'
```

### Timeout Behavior

| Workflow Type | Timeout Behavior |
|---------------|------------------|
| Synchronous | Returns immediately with partial results or error |
| Async | Job marked as failed with timeout error |

## Best Practices

### 1. Use Descriptive Job Names

Include context in your working directory or metadata:

```bash
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "async/workflow/build-and-deploy",
    "messages": [
      {"role": "user", "content": "Deploy v2.0.1 to production"}
    ],
    "metadata": {
      "version": "v2.0.1",
      "environment": "production"
    }
  }'
```

### 2. Implement Webhook Notifications

For critical workflows, configure callbacks:

```javascript
// In your workflow configuration
{
  "notification_config": {
    "type": "webhook",
    "url": "https://your-server.com/webhooks/mule",
    "events": ["completed", "failed"]
  }
}
```

### 3. Log Progress Steps

Add logging steps to track progress:

```bash
curl -X POST http://localhost:8140/api/v1/workflows/workflow-uuid/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool",
    "tool_type": "bash",
    "config": {
      "command": "echo 'Starting build...' && echo 'Build complete!'"
    }
  }'
```

### 4. Clean Up Resources

Implement cleanup steps for long-running workflows:

```go
// In a WASM module for cleanup
func cleanup() {
    // Remove temporary files
    os.RemoveAll("/tmp/mule-workflow-*")

    // Close database connections
    db.Close()
}
```

## Example: Complete Async Workflow

### 1. Create the Workflow

```bash
# Create async workflow
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "code-review-pipeline",
    "description": "Automated code review for pull requests",
    "is_async": true
  }'
```

### 2. Add Steps

```bash
# Step 1: Fetch PR details
curl -X POST http://localhost:8140/api/v1/workflows/code-review-pipeline/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "wasm_module",
    "wasm_module_id": "github-pr-fetcher-uuid",
    "config": {}
  }'

# Step 2: Run linting
curl -X POST http://localhost:8140/api/v1/workflows/code-review-pipeline/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool",
    "tool_type": "bash",
    "config": {
      "command": "npm run lint",
      "timeout": 120
    }
  }'

# Step 3: Run tests
curl -X POST http://localhost:8140/api/v1/workflows/code-review-pipeline/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool",
    "tool_type": "bash",
    "config": {
      "command": "npm test",
      "timeout": 300
    }
  }'

# Step 4: AI review
curl -X POST http://localhost:8140/api/v1/workflows/code-review-pipeline/steps \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "agent_id": "review-agent-uuid",
    "config": {
      "task": "Review the code changes and provide feedback"
    }
  }'
```

### 3. Execute and Monitor

```bash
# Start the workflow
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "async/workflow/code-review-pipeline",
    "messages": [
      {"role": "user", "content": "Review PR #123"}
    ]
  }'

# Monitor with WebSocket (see code above)
```

## Next Steps

- Learn about [batch processing](/docs/Tutorials/batch-processing) for parallel execution
- Explore [WASM modules](/docs/Advanced/wasm-modules) for custom step logic
- Understand [validation](/docs/Advanced/validation) for quality gates
