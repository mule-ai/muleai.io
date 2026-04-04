---
weight: 7
title: "Memory Configuration"
description: "Configure vector embedding storage for semantic search and context retention"
icon: "article"
date: "2026-03-28T00:00:00-05:00"
lastmod: "2026-03-28T00:00:00-05:00"
toc: true
---

![memory-config](https://storage.googleapis.com/mule-storage/memory-config.png)

Mule's memory system enables agents to store and retrieve information using semantic search powered by vector embeddings. This allows agents to maintain context across conversations, recall relevant information, and build on previous knowledge.

## Overview

The memory configuration controls how Mule stores and retrieves embeddings for semantic search. It's used by the memory tool that agents can access to:

- Store content with metadata for later retrieval
- Query stored content using semantic similarity
- Maintain persistent context across sessions
- Build knowledge bases for specialized agents

## Memory Configuration Structure

```json
{
  "id": "default",
  "database_url": "postgres://user:pass@localhost:5432/dbname?sslmode=disable",
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "embedding_dims": 1536,
  "default_ttl_seconds": 604800,
  "default_top_k": 5,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:00:00Z"
}
```

> **Note**: The `database_url` field is read-only and cannot be modified via the API. The database connection is configured through the server's database connection string.

## Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (currently always "default") |
| `database_url` | string | PostgreSQL connection string for storing embeddings |
| `embedding_provider` | string | AI provider for generating embeddings (openai, anthropic, etc.) |
| `embedding_model` | string | Specific embedding model to use |
| `embedding_dims` | int | Dimensionality of the embedding vectors |
| `default_ttl_seconds` | int | Default time-to-live for stored embeddings (in seconds) |
| `default_top_k` | int | Default number of results to return from searches |

## API Endpoints

### Get Current Configuration

```bash
curl http://localhost:8140/api/v1/memory-config
```

**Response:**
```json
{
  "id": "default",
  "database_url": "postgres://mule:mule@localhost:5432/mulev2?sslmode=disable",
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "embedding_dims": 1536,
  "default_ttl_seconds": 604800,
  "default_top_k": 5,
  "created_at": "2026-03-28T10:00:00Z",
  "updated_at": "2026-03-28T10:00:00Z"
}
```

### Update Configuration

```bash
curl -X PUT http://localhost:8140/api/v1/memory-config \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_provider": "anthropic",
    "embedding_model": "claude-embedding-v1",
    "embedding_dims": 1536,
    "default_ttl_seconds": 86400,
    "default_top_k": 10
  }'
```

## Configuration Options

### Embedding Providers

Mule supports multiple embedding providers:

#### OpenAI

```json
{
  "embedding_provider": "openai",
  "embedding_model": "text-embedding-3-small",
  "embedding_dims": 1536
}
```

Available models:
- `text-embedding-3-small` (1536 dimensions)
- `text-embedding-3-large` (3072 dimensions)
- `text-embedding-ada-002` (1536 dimensions)

#### Anthropic

```json
{
  "embedding_provider": "anthropic",
  "embedding_model": "claude-embedding-v1",
  "embedding_dims": 1536
}
```

#### Ollama (Local)

For local embeddings with Ollama:

```json
{
  "embedding_provider": "ollama",
  "embedding_model": "nomic-embed-text",
  "embedding_dims": 768
}
```

### TTL Configuration

The `default_ttl_seconds` field controls how long embeddings are stored before expiration:

| Value | Duration | Use Case |
|-------|----------|----------|
| 3600 | 1 hour | Temporary context |
| 86400 | 1 day | Daily sessions |
| 604800 | 1 week | Standard retention |
| 2592000 | 30 days | Long-term knowledge |
| 0 | No expiration | Permanent storage |

### Top-K Configuration

The `default_top_k` field controls how many results are returned from semantic searches:

| Value | Use Case |
|-------|----------|
| 1-3 | Precise, single-result lookups |
| 5 | Balanced results |
| 10-20 | Broad exploration |

## Memory Tool Operations

When agents use the memory tool, they can perform these operations:

### Store Content

Store information for later retrieval:

```json
{
  "operation": "store",
  "content": "The project uses Go 1.25.4 and PostgreSQL 16",
  "metadata": {
    "project": "mule",
    "category": "configuration"
  }
}
```

### Semantic Search

Query stored content using natural language:

```json
{
  "operation": "search",
  "query": "What programming language does the project use?",
  "top_k": 5
}
```

### Retrieve by ID

Get specific stored content:

```json
{
  "operation": "retrieve",
  "id": "content-uuid"
}
```

### Delete Content

Remove specific content:

```json
{
  "operation": "delete",
  "id": "content-uuid"
}
```

## Example Configuration

Here's a complete example for configuring memory with OpenAI embeddings:

```bash
curl -X PUT http://localhost:8140/api/v1/memory-config \
  -H "Content-Type: application/json" \
  -d '{
    "embedding_provider": "openai",
    "embedding_model": "text-embedding-3-small",
    "embedding_dims": 1536,
    "default_ttl_seconds": 604800,
    "default_top_k": 5
  }'
```

## Best Practices

1. **Choose the right embedding model**: Match the model to your use case - smaller models are faster but less accurate
2. **Set appropriate TTL**: Balance storage costs with retention needs
3. **Configure top_k appropriately**: More results provide richer context but may slow responses
4. **Use metadata effectively**: Add relevant metadata to stored content for better filtering
5. **Monitor database size**: Embeddings can grow large - monitor and clean up old data periodically
6. **Test search quality**: Verify that semantic search returns relevant results for your domain
