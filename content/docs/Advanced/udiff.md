---
weight: 5
title: "File Operations in Mule"
description: "How Mule handles file operations using the FilesystemTool and WASM modules"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2026-03-21T12:00:00-05:00"
toc: true
---

> **Note:** This page was previously titled "Unified Diff (UDiff) Implementation". The UDiff approach for applying code changes has been deprecated and replaced with a more flexible filesystem-based approach. This document reflects the current implementation.

Mule uses a combination of the **FilesystemTool** and **WASM modules** to handle file operations. This approach provides more flexibility and control compared to the deprecated unified diff format.

## Overview of Current File Operations

The current file handling system provides:

1. **FilesystemTool**: Direct file read/write/delete operations
2. **WASM Modules**: Custom workflow steps for complex file operations
3. **Agent Runtime**: Context-aware file access with working directory support

## FilesystemTool

The FilesystemTool provides agents with controlled access to the filesystem. It's designed with security in mind, restricting access to a configurable root directory.

### Available Actions

The FilesystemTool supports the following actions:

| Action | Description | Parameters |
|--------|-------------|------------|
| `read` | Read file contents | `path` (required) |
| `write` | Write content to a file | `path`, `content` (required) |
| `delete` | Delete a file | `path` (required) |
| `list` | List directory contents | `path` (optional, defaults to ".") |
| `exists` | Check if file/directory exists | `path` (required) |

### Usage Examples

#### Reading a File

```json
{
  "action": "read",
  "path": "src/main.go"
}
```

Response:
```json
{
  "content": "package main\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n}",
  "path": "src/main.go",
  "size": 64
}
```

#### Writing a File

```json
{
  "action": "write",
  "path": "src/newfile.go",
  "content": "package main\n\nfunc NewFunction() {\n    fmt.Println(\"New content\")\n}"
}
```

Response:
```json
{
  "success": true,
  "path": "src/newfile.go",
  "size": 72
}
```

#### Deleting a File

```json
{
  "action": "delete",
  "path": "src/oldfile.go"
}
```

Response:
```json
{
  "success": true,
  "path": "src/oldfile.go"
}
```

#### Listing Directory Contents

```json
{
  "action": "list",
  "path": "src"
}
```

Response:
```json
{
  "path": "src",
  "files": [
    {"name": "main.go", "is_dir": false, "size": 64, "mod_time": "2026-03-21T10:00:00Z"},
    {"name": "utils", "is_dir": true, "size": 4096, "mod_time": "2026-03-21T10:00:00Z"}
  ],
  "count": 2
}
```

#### Checking File Existence

```json
{
  "action": "exists",
  "path": "src/main.go"
}
```

Response:
```json
{
  "exists": true,
  "path": "src/main.go"
}
```

## Security Features

### Path Restrictions

The FilesystemTool enforces strict path restrictions:

- All file operations are restricted to a configurable root directory
- Path traversal attacks (e.g., `../../etc/passwd`) are blocked
- Absolute paths are resolved relative to the root directory

### Working Directory Support

The tool supports dynamic working directories that can be set per execution context:

```go
filesystemTool := NewFilesystemTool("/repositories/project")
filesystemTool.SetWorkingDirectory("/feature-branch")
// File operations will now be relative to /repositories/project/feature-branch
```

## WASM Modules for Complex Operations

For more complex file operations, WASM modules provide additional capabilities:

- **Custom workflows**: Define complex file transformation logic
- **External integrations**: Call external APIs for file processing
- **Git operations**: Create commits, branches, and pull requests
- **Multi-file operations**: Atomic updates across multiple files

### Example: Creating a File with WASM

```go
// Inside a WASM module
func processFiles(ctx context.Context, m api.Module) {
    // Read existing file
    readResult := filesystem.Read("src/main.go")
    
    // Transform content
    newContent := transform(readResult.Content)
    
    // Write updated file
    filesystem.Write("src/main.go", newContent)
}
```

## Comparison: Old vs New Approach

### Deprecated UDiff Approach (Removed)

The old UDiff approach required agents to generate unified diff format:

```diff
--- a/path/to/file.go
+++ b/path/to/file.go
@@ -10,7 +10,7 @@ func example() {
-    fmt.Println("Old code")
+    fmt.Println("New code")
 }
```

**Limitations:**
- Required precise line number matching
- Fragile to context line changes
- Complex to generate correctly
- Limited to text-based patches

### Current FilesystemTool Approach

The current approach allows direct file manipulation:

```json
{
  "action": "write",
  "path": "src/main.go",
  "content": "package main\n\nfunc main() {\n    fmt.Println(\"Hello, World!\")\n}"
}
```

**Advantages:**
- Simple, clear semantics
- No line number matching required
- Works with any file content
- Easier for agents to generate correctly

## Migration from UDiff

If you have existing workflows that relied on UDiff:

1. **Update agent prompts**: Change from requesting UDiff output to requesting filesystem tool calls
2. **Pre-read files**: Have agents read existing content before writing modifications
3. **Use WASM modules**: For complex transformations, implement them as WASM modules

### Example: Converting a UDiff Workflow

**Old approach:**
```
Generate a UDiff that changes line 10 in main.go from "old" to "new"
```

**New approach:**
```
1. Read the current content of main.go
2. Modify the content to change the relevant line
3. Write the updated content back to main.go
```

## Best Practices

1. **Always read before writing**: Check existing content to avoid overwrites
2. **Use transactions where available**: Group related file changes together
3. **Validate paths**: Ensure paths are correct before operations
4. **Handle errors gracefully**: Check responses for error details
5. **Keep changes atomic**: Use single operations or WASM modules for atomic updates

## Complete File Operation Workflow Example

A workflow that uses filesystem operations to update code:

```json
{
  "name": "update-config-workflow",
  "description": "Reads config, updates values, and writes back",
  "steps": [
    {
      "step_order": 1,
      "type": "agent",
      "agent_id": "config-reader-uuid",
      "config": {}
    },
    {
      "step_order": 2,
      "type": "wasm_module",
      "wasm_module_id": "config-transform-uuid",
      "config": {
        "operation": "transform_json",
        "preserve_comments": true
      }
    },
    {
      "step_order": 3,
      "type": "agent",
      "agent_id": "config-writer-uuid",
      "config": {}
    }
  ]
}
```

### File Operation API Usage

Create tools for filesystem operations:

```bash
# Create filesystem tool
curl -X POST http://localhost:8080/api/v1/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filesystem",
    "description": "File system operations tool",
    "metadata": {
      "tool_type": "filesystem",
      "root_directory": "/repositories"
    }
  }'

# Create bash tool
curl -X POST http://localhost:8080/api/v1/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bash",
    "description": "Execute bash commands",
    "metadata": {
      "tool_type": "bash",
      "timeout_seconds": 30
    }
  }'

# Assign tools to agent
curl -X POST http://localhost:8080/api/v1/agents/{agent-uuid}/tools \
  -H "Content-Type: application/json" \
  -d '{"tool_id": "filesystem-tool-uuid"}'

curl -X POST http://localhost:8080/api/v1/agents/{agent-uuid}/tools \
  -H "Content-Type: application/json" \
  -d '{"tool_id": "bash-tool-uuid"}'
```

### Common File Operations via Agent

Agents with filesystem tools can perform:

#### Read Multiple Files
```json
{
  "action": "read",
  "path": "src/config.json"
}
```

#### List Project Structure
```json
{
  "action": "list",
  "path": "src"
}
```

Response:
```json
{
  "path": "src",
  "files": [
    {"name": "config.json", "is_dir": false, "size": 1024, "mod_time": "2026-03-21T10:00:00Z"},
    {"name": "handlers", "is_dir": true, "size": 4096, "mod_time": "2026-03-21T10:00:00Z"},
    {"name": "models", "is_dir": true, "size": 4096, "mod_time": "2026-03-21T10:00:00Z"}
  ],
  "count": 3
}
```

#### Write New File
```json
{
  "action": "write",
  "path": "src/new_handler.go",
  "content": "package main\n\nfunc NewHandler() {}\n"
}
```

#### Check File Existence
```json
{
  "action": "exists",
  "path": "src/config.json"
}
```

## Troubleshooting

**"Access denied: path outside allowed root directory"**
- Verify the path is within the configured root directory
- Use relative paths from the working directory

**"Failed to write file"**
- Check if the directory exists (it will be created automatically)
- Verify write permissions
- Ensure sufficient disk space

**"File not found"**
- Verify the file exists using the `exists` action
- Check if the working directory is set correctly
