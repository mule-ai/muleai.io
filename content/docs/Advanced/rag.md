---
weight: 1
title: "Retrieval Augmented Generation (RAG)"
description: "Leveraging RAG for context-aware code generation"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

Retrieval Augmented Generation (RAG) is a powerful feature in Mule that enhances AI code generation by providing contextual awareness of your codebase. By indexing and retrieving relevant code snippets, Mule can make more informed and consistent changes to your repositories.

## How RAG Works in Mule

RAG in Mule follows a four-step process:

1. **Indexing**: When a repository is added, Mule analyzes and indexes the codebase
2. **Retrieval**: When working on an issue, Mule identifies relevant code sections
3. **Context Enrichment**: The retrieved code context is included in the agent's prompt
4. **Generation**: The agent creates solutions with awareness of existing patterns and structures

This approach significantly improves code quality by ensuring generated code follows existing patterns, naming conventions, and architectural decisions in your codebase.

## Key Features

Mule's RAG implementation includes these specialized features:

### Intelligent Code Chunking

Code is automatically split into meaningful chunks based on language-specific structures:

- **Go**: Functions, structs, interfaces, methods
- **JavaScript/TypeScript**: Functions, classes, methods
- **HTML**: Elements, sections, components
- **CSS**: Rule sets, at-rules, keyframes

This structural chunking ensures that related code stays together for better context.

### Real-time Index Updates

The codebase index is automatically updated when:

- Files are added or modified in the repository
- Changes are committed to the repository
- The repository is synchronized

This keeps the context current without manual intervention.

### Repository Map Generation

Mule can generate a high-level map of repository structure to help agents understand:

- Key files and their purpose
- Important types and interfaces
- Hierarchical relationships between components
- Overall architecture patterns

## Configuration

{{< alert text="RAG is currently in development and will be fully available in a future release." />}}

While RAG will be enabled by default in future releases, you will be able to configure its behavior:

### Embedding Service

Mule uses an embedding service to create vector representations of code. You'll be able to configure:

```json
{
  "embeddingService": {
    "url": "https://api.your-embedding-service.com",
    "model": "text-embedding-model",
    "apiKey": "your-api-key"
  }
}
```

Supported services will include:
- OpenAI Embeddings
- Local embedding models
- Custom embedding endpoints

### Indexing Settings

Control how your code is indexed:

```json
{
  "indexing": {
    "excludeDirs": ["node_modules", "vendor", "dist"],
    "excludeFiles": ["README.md", "LICENSE"],
    "maxRepoSize": 16384
  }
}
```

### Query Settings

Configure retrieval behavior:

```json
{
  "rag": {
    "enabled": true,
    "maxResults": 10,
    "similarityThreshold": 0.7,
    "includeRepoMap": true
  }
}
```

## Best Practices

To get the most from RAG when it's released:

1. **Keep repositories focused**: Smaller, more specific repositories yield better results
2. **Use meaningful comments**: Well-commented code helps the system understand context
3. **Consistent coding patterns**: Following consistent patterns makes it easier for RAG to understand code relationships
4. **Clean code organization**: Well-organized code with logical file structure improves retrieval quality

## Impact on Generated Code

With RAG, you can expect:

- **More consistent style**: Generated code will match existing patterns
- **Better integration**: New code will integrate more seamlessly with existing code
- **Fewer errors**: Reduced risk of breaking changes or inconsistencies
- **Higher relevance**: Solutions more directly addressing the specific issue

## Example: Before and After RAG

**Without RAG**:
```go
// Generated function with generic naming
func ProcessData(data []string) ([]string, error) {
    result := make([]string, 0, len(data))
    for _, item := range data {
        processed := strings.ToUpper(item)
        result = append(result, processed)
    }
    return result, nil
}
```

**With RAG**:
```go
// Generated function with context-aware naming and error handling
func TransformTaskItems(items []string) ([]string, error) {
    if items == nil {
        return nil, ErrNilItems
    }
    
    result := make([]string, 0, len(items))
    for _, item := range items {
        processed, err := applyTaskTransformation(item)
        if err != nil {
            return nil, fmt.Errorf("error transforming item %q: %w", item, err)
        }
        result = append(result, processed)
    }
    
    return result, nil
}
```

The RAG-enhanced version follows existing patterns for error handling, naming conventions, and coding style from the rest of the codebase.