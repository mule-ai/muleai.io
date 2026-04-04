---
weight: 8
title: "Tools"
description: "Built-in and custom tools for agent interactions"
icon: "article"
date: "2026-03-29T00:00:00-05:00"
lastmod: "2026-03-29T00:00:00-05:00"
toc: true
---

![tools](https://storage.googleapis.com/mule-storage/tools.png)

Tools extend Mule agents with capabilities to interact with external systems, execute commands, and manipulate data. Each tool provides specific functionality that agents can invoke during task execution.

## Built-in Tools

Mule provides five built-in tools that are always available:

| Tool | Description | Use Case |
|------|-------------|----------|
| `bash` | Execute shell commands | Running scripts, git operations, build tools |
| `filesystem` | Read, write, and manage files | Code file operations, configuration management |
| `http` | Make HTTP requests | API calls, webhook triggers, data fetching |
| `database` | Query PostgreSQL databases | Data retrieval, database inspection |
| `memory` | Semantic storage and retrieval | Context retention, knowledge bases |

## Tool Registry

The tool registry manages all available tools and allows you to:

- List all registered tools
- Register custom tools
- Assign tools to agents
- Configure tool behavior per agent

### Built-in Tools

The following tools are automatically registered:

- **memory**: Store and retrieve memories using vector embeddings
- **filesystem**: File system operations (read, write, delete, list)
- **http**: HTTP requests with support for headers and body
- **database**: PostgreSQL database queries
- **bash**: Shell command execution

## Tool Management API

### List All Tools

```bash
curl http://localhost:8140/api/v1/tools
```

**Response:**
```json
{
  "data": [
    {
      "id": "tool-uuid",
      "name": "bash",
      "description": "Execute shell commands with configurable timeout",
      "created_at": "2026-03-29T10:00:00Z",
      "updated_at": "2026-03-29T10:00:00Z"
    }
  ]
}
```

### Register a Custom Tool

```bash
curl -X POST http://localhost:8140/api/v1/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-custom-tool",
    "description": "A custom tool for specific functionality",
    "metadata": {
      "category": "custom",
      "version": "1.0"
    }
  }'
```

### Get a Tool by ID

```bash
curl http://localhost:8140/api/v1/tools/{id}
```

### Update a Tool

```bash
curl -X PUT http://localhost:8140/api/v1/tools/{id} \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "metadata": {
      "version": "1.1"
    }
  }'
```

### Delete a Tool

```bash
curl -X DELETE http://localhost:8140/api/v1/tools/{id}
```

## Agent Tool Assignment

### List Tools Assigned to an Agent

```bash
curl http://localhost:8140/api/v1/agents/{agent_id}/tools
```

**Response:**
```json
{
  "data": [
    {
      "id": "tool-uuid",
      "name": "filesystem",
      "description": "File system operations"
    },
    {
      "id": "tool-uuid-2",
      "name": "bash",
      "description": "Execute shell commands"
    }
  ]
}
```

### Assign Tools to an Agent

```bash
curl -X POST http://localhost:8140/api/v1/agents/{agent_id}/tools \
  -H "Content-Type: application/json" \
  -d '{
    "tool_ids": ["tool-uuid-1", "tool-uuid-2"]
  }'
```

### Remove a Tool from an Agent

```bash
curl -X DELETE http://localhost:8140/api/v1/agents/{agent_id}/tools/{tool_id}
```

## Tool Configuration

### Bash Tool

The bash tool executes shell commands with configurable timeout and working directory:

```yaml
tool_type: bash
command: "go build -o app ./cmd/api"
timeout: 300  # 5 minutes
working_directory: "/path/to/project"
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | The shell command to execute |
| `timeout` | integer | Timeout in seconds (default: 300) |
| `working_directory` | string | Directory to execute command in |

### Filesystem Tool

File operations for reading, writing, and managing files:

```yaml
tool_type: filesystem
operation: "read"  # read, write, delete, list, exists
path: "/path/to/file.txt"
```

**Operations:**
| Operation | Description | Parameters |
|-----------|-------------|------------|
| `read` | Read file contents | `path` |
| `write` | Write content to file | `path`, `content` |
| `delete` | Delete a file | `path` |
| `list` | List directory contents | `path` |
| `exists` | Check if file exists | `path` |

### HTTP Tool

Make HTTP requests to external APIs:

```yaml
tool_type: http
url: "https://api.example.com/data"
method: "GET"
headers:
  Authorization: "Bearer token"
  Content-Type: "application/json"
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | The URL to request |
| `method` | string | HTTP method (GET, POST, PUT, DELETE) |
| `headers` | object | Request headers |
| `body` | object | Request body (for POST/PUT) |

### Database Tool

Execute PostgreSQL queries:

```yaml
tool_type: database
operation: "query"  # query, execute
sql: "SELECT * FROM users WHERE active = true"
```

**Operations:**
| Operation | Description | Parameters |
|-----------|-------------|------------|
| `query` | Execute SELECT query | `sql` |
| `execute` | Execute INSERT/UPDATE/DELETE | `sql` |

### Memory Tool

Store and retrieve semantic memories using vector embeddings:

```yaml
tool_type: memory
operation: "store"  # store, retrieve, update, delete
content: "Important information to remember"
metadata:
  category: "project"
  tags: ["important"]
```

**Operations:**

#### Store Content
```yaml
operation: "store"
content: "The project uses Go 1.25 and PostgreSQL 15"
metadata:
  project: "mule"
  category: "configuration"
```

#### Semantic Search
```yaml
operation: "retrieve"
query: "What programming language does the project use?"
top_k: 5
```

#### Update Content
```yaml
operation: "update"
id: "memory-uuid"
content: "Updated information"
metadata:
  updated: true
```

#### Delete Content
```yaml
operation: "delete"
id: "memory-uuid"
```

## Custom Tools

### Creating Custom Tools

To create a custom tool, implement the `Tool` interface:

```go
package tools

import (
    "context"
    "fmt"
)

type MyTool struct{}

func (t *MyTool) Name() string {
    return "my-custom-tool"
}

func (t *MyTool) Description() string {
    return "Custom functionality for agents"
}

func (t *MyTool) IsLongRunning() bool {
    return false
}

func (t *MyTool) Execute(ctx context.Context, params map[string]interface{}) (interface{}, error) {
    // Extract parameters
    input, ok := params["input"].(string)
    if !ok {
        return nil, fmt.Errorf("input parameter is required")
    }
    
    // Process and return result
    return map[string]interface{}{
        "result":  fmt.Sprintf("processed: %s", input),
        "success": true,
    }, nil
}

func (t *MyTool) GetSchema() map[string]interface{} {
    return map[string]interface{}{
        "type": "object",
        "properties": map[string]interface{}{
            "input": map[string]interface{}{
                "type":        "string",
                "description": "The input to process",
            },
        },
        "required": []string{"input"},
    }
}
```

### Registering Custom Tools

Register your tool in the registry:

```go
registry := tools.NewRegistry()
registry.Register(&MyTool{})
```

## Tool Selection in Agents

When creating or updating an agent, you can specify which tools it has access to:

```bash
curl -X POST http://localhost:8140/api/v1/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "coding-assistant",
    "description": "Agent with file and command tools",
    "provider_id": "provider-uuid",
    "model_id": "claude-sonnet-4-20250514",
    "system_prompt": "You are a helpful coding assistant.",
    "tool_ids": ["bash-tool-uuid", "filesystem-tool-uuid"]
  }'
```

## Best Practices

1. **Assign tools based on task requirements**: Only give agents the tools they need
2. **Set appropriate timeouts**: Longer operations may need increased timeout values
3. **Use memory for context**: Store important information using the memory tool
4. **Secure sensitive operations**: Restrict database and bash tool access to trusted agents
5. **Test tool configurations**: Verify tool behavior before deploying agents
6. **Monitor tool usage**: Track which tools are being used and how often

## Troubleshooting

### Tool Not Found

If an agent reports a tool not found error:
1. Verify the tool is registered: `GET /api/v1/tools`
2. Check the tool is assigned to the agent: `GET /api/v1/agents/{id}/tools`
3. Restart the agent if configuration changed

### Database Connection Issues

For database tool errors:
1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check the connection string in environment
3. Ensure the database user has appropriate permissions

### Memory Tool Errors

If the memory tool fails:
1. Verify memory configuration is set: `GET /api/v1/memory-config`
2. Check the embedding provider is configured correctly
3. Ensure PostgreSQL has the required schema

### HTTP Request Failures

For HTTP tool errors:
1. Verify the URL is accessible: `curl -I <url>`
2. Check authentication headers are correct
3. Ensure the endpoint supports the HTTP method used

## Related Documentation

- [Agents](/docs/Settings/agents) - Configure agents with tools
- [Memory Configuration](/docs/Settings/memory) - Configure vector embeddings
- [Workflows](/docs/Settings/workflows) - Chain tools in workflows
- [Integrations](/docs/Advanced/integrations) - External integrations
