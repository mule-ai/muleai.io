---
weight: 30
title: "Working Directory Management"
description: "Learn how to use working directories to isolate and manage workflow executions"
icon: "article"
date: "2026-03-30"
lastmod: "2026-03-30"
toc: true
---

# Working Directory Management

Mule supports working directory management for workflows, allowing you to execute workflow steps in isolated directories. This is particularly useful for git operations, file processing, and parallel development workflows.

## Overview

Each job can have its own working directory that persists across workflow steps. This enables:

- **Git operations**: Create worktrees, commit changes, and push branches from isolated directories
- **File isolation**: Process files without affecting the host filesystem
- **Parallel execution**: Run multiple jobs concurrently in different directories
- **State persistence**: Maintain state between workflow steps

## How It Works

When a job is created with a working directory:

1. The directory is created if it doesn't exist
2. Each workflow step operates within that directory
3. WASM modules can change the working directory using host functions
4. Agents execute in the configured working directory
5. The directory persists for the lifetime of the job

## Setting Up Working Directories

### Via API

When creating a job, you can specify the working directory:

```bash
curl -X POST http://localhost:8140/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "workflow/your-workflow-name",
    "messages": [{"role": "user", "content": "process this data"}],
    "working_directory": "/tmp/my-job-workspace"
  }'
```

### Default Behavior

If no working directory is specified:
- Jobs run in a temporary system directory
- Files are cleaned up after job completion
- The exact path depends on the system configuration

## WASM Module Integration

WASM modules can interact with the working directory through host functions:

### Setting the Working Directory

```go
//go:wasmimport env set_working_directory
func set_working_directory(pathPtr, pathSize uint32) uint32
```

Example usage in a WASM module:

```go
func changeDirectory(path string) error {
    pathBytes := []byte(path)
    pathPtr := uint32(uintptr(unsafe.Pointer(&pathBytes[0])))
    pathSize := uint32(len(pathBytes))

    result := set_working_directory(pathPtr, pathSize)
    if result != 0 {
        return fmt.Errorf("failed to change directory: error code %d", result)
    }
    return nil
}
```

### Getting the Current Directory

```go
//go:wasmimport env get_working_directory
func get_working_directory(bufferPtr, bufferSize uint32) uint32
```

## Practical Examples

### Git Worktree Workflow

Create isolated git worktrees for parallel development:

```json
{
  "name": "Parallel Issue Processing",
  "steps": [
    {
      "type": "WASM",
      "name": "Create Issue Worktree",
      "wasm_module_id": "{git-worktree-module-id}",
      "config": {
        "prompt": "{\"worktree_name\": \"mule/issue-42\"}"
      }
    },
    {
      "type": "Agent",
      "name": "Analyze Issue",
      "agent_id": "{analysis-agent-id}",
      "input": "Analyze the issue in this worktree"
    },
    {
      "type": "WASM",
      "name": "Create Feature Branch",
      "wasm_module_id": "{git-branch-push-module-id}",
      "config": {
        "token": "{{GITHUB_TOKEN}}"
      }
    }
  ]
}
```

### Batch File Processing

Process files in an isolated directory:

```json
{
  "name": "Document Processing",
  "steps": [
    {
      "type": "WASM",
      "name": "Download Documents",
      "wasm_module_id": "{http-request-module-id}",
      "config": {
        "url": "https://api.example.com/documents",
        "method": "GET"
      }
    },
    {
      "type": "Agent",
      "name": "Process Documents",
      "agent_id": "{processing-agent-id}",
      "input": "Process all documents in {{steps.0.output}}"
    },
    {
      "type": "WASM",
      "name": "Upload Results",
      "wasm_module_id": "{http-request-module-id}",
      "config": {
        "url": "https://api.example.com/results",
        "method": "POST",
        "body": {"results": "{{steps.1.output}}"}
      }
    }
  ]
}
```

## Verification

To verify working directory functionality:

1. **Check job configuration**: Verify the working directory is set in the job record
2. **Monitor file operations**: Ensure files are created in the correct location
3. **Test isolation**: Confirm different jobs don't interfere with each other
4. **Validate propagation**: Ensure WASM module directory changes are preserved

## Troubleshooting

### Directory Not Found

```
Error: working directory does not exist
```

**Solution**: Ensure the parent directories exist and the process has permission to create them.

### Permission Denied

```
Error: permission denied accessing directory
```

**Solution**: Check filesystem permissions and ensure the Mule process has read/write access.

### Directory Changes Not Persisting

```
Error: working directory reset between steps
```

**Solution**: Verify the WASM module is correctly calling `set_working_directory` with valid paths.

## Best Practices

1. **Use unique paths**: Include job IDs or timestamps to prevent conflicts
   ```bash
   /tmp/mule-jobs/{job-id}/
   ```

2. **Clean up after completion**: Remove temporary directories when jobs finish
   ```go
   // In final WASM step
   os.RemoveAll(workingDir)
   ```

3. **Validate paths**: Ensure paths are within allowed directories for security
   ```go
   if !isAllowedPath(path) {
       return ErrPathNotAllowed
   }
   ```

4. **Handle missing directories**: Create parent directories if needed
   ```go
   os.MkdirAll(path, 0755)
   ```

## Related Documentation

- [Git Worktree Operations](/docs/Repositories/interacting-with-a-repository#git-worktree)
- [WASM Module Development](/docs/Tutorials/building-wasm-module)
- [Workflow Configuration](/docs/Settings/workflows)
