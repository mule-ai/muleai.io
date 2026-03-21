---
weight: 1
title: "Memory & Semantic Search"
description: "Using the memory tool with vector embeddings for semantic search"
icon: "article"
date: "2026-03-21"
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

Mule includes a memory tool that enables agents to store and retrieve information using semantic search powered by vector embeddings. This allows agents to maintain context across conversations, recall relevant information, and build on previous knowledge.

## How Memory Works

The memory system uses vector embeddings to enable semantic search:

1. **Storage**: When content is stored, it's converted to a vector embedding
2. **Indexing**: Embeddings are stored in PostgreSQL with metadata
3. **Retrieval**: Queries are converted to embeddings and compared for similarity
4. **Ranking**: Results are returned sorted by similarity score

## Memory Tool Operations

The memory tool supports four primary operations:

### Store

Store content with optional metadata for later retrieval:

```json
{
  "operation": "store",
  "content": "User prefers dark mode interface",
  "metadata": {
    "category": "preference",
    "user_id": "user-123"
  }
}
```

**Response:**
```json
{
  "id": "mem-uuid-here",
  "success": true
}
```

### Retrieve

Search for relevant memories using natural language queries:

```json
{
  "operation": "retrieve",
  "query": "What interface preferences does the user have?",
  "top_k": 5
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "mem-uuid-here",
      "content": "User prefers dark mode interface",
      "metadata": {
        "category": "preference",
        "user_id": "user-123"
      },
      "similarity": 0.92,
      "created_at": "2026-03-21T10:30:00Z"
    }
  ],
  "count": 1
}
```

### Update

Update existing memory content:

```json
{
  "operation": "update",
  "id": "mem-uuid-here",
  "content": "User prefers dark mode with high contrast",
  "metadata": {
    "category": "preference",
    "user_id": "user-123",
    "updated": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "id": "mem-uuid-here"
}
```

### Delete

Remove a memory by ID:

```json
{
  "operation": "delete",
  "id": "mem-uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "id": "mem-uuid-here"
}
```

## Configuration

Memory functionality requires configuration in the Settings panel or via API:

### Configuration Fields

| Field | Description | Default |
|-------|-------------|---------|
| **Database URL** | PostgreSQL connection string | `postgres://mule:mule@localhost:5432/mulev2?sslmode=disable` |
| **Embedding Provider** | AI provider for embeddings | `openai` |
| **Embedding Model** | Model for generating embeddings | `text-embedding-ada-002` |
| **Embedding Dimensions** | Vector size for embeddings | `1536` |
| **Default TTL** | Time-to-live in seconds (0 = never expires) | `0` |
| **Default Top K** | Default number of results | `5` |

### Supported Embedding Models

The memory tool works with OpenAI-compatible embedding models:

- **OpenAI**: `text-embedding-ada-002`, `text-embedding-3-small`, `text-embedding-3-large`
- **Ollama**: Local embedding models (e.g., `nomic-embed-text`)
- **Other OpenAI-compatible providers**: Any provider supporting `/embeddings` endpoint

## Usage in Agents

Agents automatically have access to the memory tool when enabled in the agent configuration. The agent can use memory to:

- **Remember user preferences** across sessions
- **Store context** from previous conversations
- **Recall relevant information** for current tasks
- **Maintain state** that persists beyond individual interactions

### Example Agent Prompt Integration

When an agent uses memory, the retrieved content is automatically included in context:

```
User: Can you check the status of my project?

[Memory Retrieved]
- "User is working on the Mule AI project" (similarity: 0.95)
- "Project deadline is March 25" (similarity: 0.87)

Agent: Based on your project notes, you're working on Mule AI with a deadline of March 25. Let me check the current status...
```

## Complete Memory API Usage Examples

### Agent with Memory Tool

To enable memory for an agent, create a tool with the memory type and assign it:

```bash
# 1. Create memory tool configuration
curl -X POST http://localhost:8080/api/v1/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "memory",
    "description": "Semantic memory storage and retrieval",
    "metadata": {
      "tool_type": "memory",
      "database_url": "postgres://mule:mule@localhost:5432/mulev2?sslmode=disable",
      "embedding_provider": "openai",
      "embedding_model": "text-embedding-3-small",
      "embedding_dims": 1536,
      "default_ttl_seconds": 2592000,
      "default_top_k": 5
    }
  }'

# 2. Assign memory tool to agent
curl -X POST http://localhost:8080/api/v1/agents/{agent-uuid}/tools \
  -H "Content-Type: application/json" \
  -d '{"tool_id": "memory-tool-uuid"}'
```

### Direct Memory Operations

When an agent uses the memory tool, it can perform these operations:

#### Store User Preferences
```json
{
  "operation": "store",
  "content": "User prefers dark mode with high contrast and larger font sizes for better readability",
  "metadata": {
    "category": "preferences",
    "user_id": "user-123",
    "source": "explicit",
    "tags": ["ui", "accessibility"]
  }
}
```

#### Store Project Context
```json
{
  "operation": "store",
  "content": "Working on Mule AI project - a multi-agent orchestration system using PI RPC for agent communication. Key components: agent runtime, workflow engine, WASM executor",
  "metadata": {
    "category": "project",
    "project": "mule-ai",
    "importance": "high",
    "tags": ["architecture", "context"]
  }
}
```

#### Retrieve Related Memories
```json
{
  "operation": "retrieve",
  "query": "What are the user's UI preferences and project details?",
  "top_k": 10
}
```

Response:
```json
{
  "results": [
    {
      "id": "mem-uuid-1",
      "content": "User prefers dark mode with high contrast...",
      "metadata": {"category": "preferences", "tags": ["ui"]},
      "similarity": 0.94,
      "created_at": "2026-03-20T10:30:00Z"
    },
    {
      "id": "mem-uuid-2",
      "content": "Working on Mule AI project...",
      "metadata": {"category": "project", "tags": ["architecture"]},
      "similarity": 0.87,
      "created_at": "2026-03-21T09:15:00Z"
    }
  ],
  "count": 2
}
```

### Using Memory in Multi-Agent Workflows

Example workflow that uses memory to share context between agents:

```json
{
  "name": "context-aware-code-review",
  "description": "Review code with awareness of project patterns and preferences",
  "steps": [
    {
      "step_order": 1,
      "type": "agent",
      "agent_id": "context-gatherer-uuid",
      "config": {
        "input_mapping": {
          "task": "user_message"
        }
      }
    },
    {
      "step_order": 2,
      "type": "agent",
      "agent_id": "code-reviewer-uuid",
      "config": {
        "input_mapping": {
          "code": "user_message",
          "context": "step_1.output.project_context"
        }
      }
    }
  ]
}
```

## Best Practices

### Effective Memory Usage

1. **Use descriptive content**: Clear, detailed content produces better embeddings
2. **Add relevant metadata**: Include context like category, user ID, or timestamps
3. **Set appropriate TTL**: Use TTL for time-sensitive information that should expire
4. **Use consistent categories**: Organize memories with consistent metadata keys

### Query Optimization

1. **Be specific in queries**: More specific queries return better results
2. **Use appropriate top_k**: Adjust based on how many related memories you need
3. **Filter by metadata**: Use metadata filters to narrow results

### Metadata Examples

```json
{
  "category": "preference",
  "user_id": "user-123",
  "source": "conversation",
  "priority": "high",
  "tags": ["ui", "theme"]
}
```

## Technical Details

### Database Schema

The memory system uses PostgreSQL for storage:

```sql
CREATE TABLE memory (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX ON memory USING ivfflat (embedding vector_cosine_ops);
```

### Vector Operations

Embeddings are compared using cosine similarity:

```sql
SELECT id, content, metadata, 1 - (embedding <=> $query_embedding) AS similarity
FROM memory
ORDER BY embedding <=> $query_embedding
LIMIT $top_k;
```

## Limitations

- **Provider dependency**: Requires a configured AI provider for embeddings
- **Embedding latency**: Storing and retrieving requires API calls to embedding provider
- **Dimension matching**: Embedding dimensions must match the configured model
- **Database connection**: PostgreSQL is required for memory storage

## Future Enhancements

Planned improvements to the memory system:

- **Code-aware chunking**: Intelligent code file segmentation for repository context
- **Repository mapping**: Automatic code structure understanding
- **Cross-session continuity**: Persistent agent memory across restarts
- **Hierarchical memory**: Organized memory with categories and relationships
