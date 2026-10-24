---
weight: 10
title: "Tutorials"
description: "Step-by-step tutorials for common Mule workflows"
icon: "article"
date: "2026-03-21T00:00:00-05:00"
lastmod: "2026-04-04T00:00:00-05:00"
toc: true
---

# Tutorials

Welcome to the Mule tutorials section. These step-by-step guides will help you accomplish real-world tasks with Mule.

## Quick Navigation

| Difficulty | Tutorial | Description | Time |
|------------|----------|-------------|------|
| Beginner | [First Workflow](/docs/tutorials/first-workflow | Create your first agent workflow | 10 min |
| Intermediate | [Working Directory](/docs/tutorials/working-directory | Manage isolated execution environments | 15 min |
| Intermediate | [Batch Processing](/docs/tutorials/batch-processing | Execute workflows in parallel | 15 min |
| Intermediate | [Async Workflows](/docs/tutorials/async-workflows | Run long-running workflows in background | 15 min |
| Advanced | [Building WASM Modules](/docs/tutorials/building-wasm-module | Create custom WebAssembly modules | 20 min |
| Advanced | [Git Integration](/docs/tutorials/git-integration | Automate Git operations with WASM modules | 15 min |

## Available Tutorials

### [Creating Your First Agent Workflow](/docs/tutorials/first-workflow)
Learn how to create and execute a simple workflow that uses an AI agent to accomplish a task. This tutorial covers:
- Creating an agent with a specific purpose
- Designing a workflow with agent steps
- Executing the workflow and monitoring progress

### [Building a Custom WASM Module](/docs/tutorials/building-wasm-module)
Extend Mule's capabilities by building your own WebAssembly validation module. This tutorial covers:
- Setting up your WASM module project
- Implementing the required input/output interface
- Using host functions for HTTP requests, git operations, and more
- Integrating your module into a workflow

### [Working Directory Management](/docs/tutorials/working-directory)
Learn how to use working directories to isolate and manage workflow executions. This tutorial covers:
- Setting up working directories for jobs
- WASM module integration with working directories
- Git worktree workflows and parallel execution
- Best practices for directory isolation

### [Parallel Workflow Execution](/docs/tutorials/batch-processing)
Learn how to launch multiple workflows in parallel and process data batches efficiently. This tutorial covers:
- Spawning multiple workflows simultaneously
- Processing data arrays with parallel execution
- Using jq-filter for data transformation
- Error handling in parallel workflows

### [Async Workflow Execution](/docs/tutorials/async-workflows)
Learn how to run long-running workflows asynchronously with job polling and WebSocket updates. This tutorial covers:
- Creating and executing async workflows
- Monitoring job status with polling or WebSocket
- Handling workflow output and errors
- Best practices for background processing

### [Git Integration](/docs/tutorials/git-integration)
Automate Git operations using WASM modules and workflows. This tutorial covers:
- Creating and managing Git worktrees for parallel development
- Automated branch creation and pushing
- GitHub issue and PR automation
- Batch processing multiple repositories

---

## Prerequisites

Before starting these tutorials, you should:

1. Have Mule installed and running (see [Getting Started](/docs/getting-started))
2. Have at least one AI provider configured (see [AI Providers](/docs/settings/ai-providers)
3. Understand basic workflow concepts (see [Workflows](/docs/settings/workflows)

## Next Steps

After completing these tutorials, explore the advanced documentation:
- [WASM Modules](/docs/advanced/wasm-modules) - Deep dive into WASM capabilities
- [Multi-agent Workflows](/docs/advanced/multi-agent) - Advanced orchestration patterns
- [Validation](/docs/advanced/validation) - Ensuring code quality
- [GitHub Integration](/docs/repositories/interacting-with-a-repository) - Repository automation patterns
