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

Validation functions run after a workflow step to ensure code quality. Validation is handled through WASM modules that implement custom validation logic.

You can create custom validation WASM modules to:
- Check code formatting
- Run linters and formatters (e.g., gofmt, golangci-lint)
- Execute tests (e.g., go test)
- Validate dependencies
- Run custom build checks

Validation modules receive the generated code as input and return validation results. If validation fails, Mule can make additional attempts to fix the issues by asking the agent to revise its output.

See the [WASM validation module example](https://github.com/mule-ai/mule/tree/main/examples/wasm/validation-module) for guidance on creating custom validators.

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
```

In this example:
1. One agent analyzes the code
2. A second agent suggests improvements
3. A third agent implements those improvements

Custom validation WASM modules can be attached to validate the final output.

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

Mule supports sophisticated multi-agent workflows with full production capabilities:

1. **Sequential Step Execution**: Chain multiple agents with context passing
2. **Sub-Workflow Support**: Nest workflows within workflows for complex tasks
3. **Retry Logic**: Configure retry attempts with delays for robust execution
4. **Validation Functions**: Apply code quality checks with automatic retry on failure
5. **Integration Steps**: Call external integrations directly within workflows
6. **Dynamic Output Processing**: Choose between generatedText, generatedTextWithReasoning, or passthrough modes

## Best Practices

For optimal workflow performance:

- Start with simple, well-defined tasks
- Ensure agent prompts are clear and specific
- Include relevant context in issue descriptions
- Test workflows with the local provider before using with GitHub
- Review output for common errors and iterate on prompts