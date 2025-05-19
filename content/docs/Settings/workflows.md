---
weight: 6
title: "Workflows"
description: "Understanding and configuring Mule workflows"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

Workflows are at the heart of Mule's ability to coordinate complex AI tasks. A workflow defines a sequence of steps that Mule follows when processing issues and generating code.

## Workflow Architecture

Each workflow consists of:

- **Steps**: Individual tasks performed by specific agents or integrations
- **Input Mappings**: How data flows between steps
- **Output Fields**: What data is produced by each step
- **Validation Functions**: Code quality checks applied to the output

Workflows enable you to chain together multiple agents, each with specific responsibilities, to solve complex problems collaboratively.

## Default Workflow

Mule comes with a default workflow that follows this sequence:

1. **Starting Agent**: Analyzes the issue and generates initial code changes
2. **Commit Agent**: Generates appropriate commit messages for changes
3. **PR Title Agent**: Creates a descriptive pull request title
4. **PR Body Agent**: Writes a comprehensive pull request description

This default workflow is suitable for most use cases and requires minimal configuration.

## Workflow Steps

Each step in a workflow is defined with the following properties:

```yaml
id: unique-step-id
agentID: 1
agentName: Agent Name
outputField: generatedText
integration:
  integration: integration-name
  event: event-name
  data: event-data
```

- **id**: A unique identifier for the step
- **agentID**: The ID of the agent to use for this step
- **agentName**: A human-readable name for the agent (optional)
- **outputField**: The field to extract from the agent's output
- **integration**: Optional integration details if this step uses an external integration

## Output Fields

Output fields define how to process the raw output from an agent:

- **generatedText**: Extracts only the final generated content (code, text, etc.)
- **generatedTextWithReasoning**: Includes the agent's reasoning along with the final output

When an agent completes its work, its output is processed according to the outputField setting and then passed to the next step in the workflow.

## Validation Functions

Validation functions run after a workflow step to ensure code quality. Mule includes several built-in validation functions:

- **getDeps**: Ensures all dependencies are available
- **goFmt**: Formats Go code according to standard conventions
- **goModTidy**: Cleans up Go module dependencies
- **golangciLint**: Runs linters to catch common coding issues
- **goTest**: Executes tests to verify functionality

You can specify which validation functions to run for each workflow:

```yaml
validationFunctions:
  - goFmt
  - goTest
```

If validation fails, Mule will make additional attempts to fix the issues by asking the agent to revise its output.

## Advanced: Multi-Agent Workflows

More complex tasks can benefit from specialized multi-agent workflows:

```yaml
id: code-analysis-workflow
name: Code Analysis
description: Analyzes code and provides improvement suggestions
steps:
  - id: code-analyzer
    agentID: 2
    outputField: generatedText
  - id: improvement-generator
    agentID: 3
    outputField: generatedText
  - id: implementation
    agentID: 1
    outputField: generatedTextWithReasoning
validationFunctions:
  - goFmt
  - golangciLint
  - goTest
```

In this example:
1. One agent analyzes the code
2. A second agent suggests improvements
3. A third agent implements those improvements
4. Validation ensures code quality

## Integration with External Systems

Workflows can integrate with external systems through the integration field:

```yaml
id: discord-notification
integration:
  integration: discord
  event: sendMessage
  data: Workflow completed successfully!
```

This allows workflows to:
- Send notifications when tasks complete
- Fetch additional information from external sources
- Trigger actions in other systems

## Workflow Triggers

Workflows can be triggered by:

- **Repository synchronization** (automatic)
- **Manual sync** button on the repository page
- **External triggers** from integrations (Discord, Matrix, etc.)

When triggered, a workflow will process any eligible issues (those labeled with `mule` that don't already have pull requests or have unresolved PR comments).

## Customizing Workflows

{{< alert text="Currently multiple agents can be defined but only the first one will be used. Multi-agent workflows will be fully enabled in a future update." />}}

While full workflow customization is coming in a future update, you can currently influence the workflow by:

1. Modifying agent prompts to change their behavior
2. Adjusting the default validation functions
3. Configuring external integrations for notifications

## Best Practices

For optimal workflow performance:

- Start with simple, well-defined tasks
- Ensure agent prompts are clear and specific
- Include relevant context in issue descriptions
- Test workflows with the local provider before using with GitHub
- Review validation function output for common errors