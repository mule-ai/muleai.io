# Mule AI Project Research - March 2026

## Repository Information
- **Repo:** github.com/mule-ai/mule
- **Description:** AI workflow platform combining AI agents, custom tools, and WebAssembly modules
- **Default Branch:** main
- **Language:** Go (backend), React (frontend)

## Recent Commits (Last 10)

| Date | Commit | Author | Message |
|------|--------|--------|---------|
| 2025-12-20 | f35c933 | Jeremiah Butler | Add implement phase (#100) |
| 2025-12-13 | 3eaead7 | Jeremiah Butler | bash tool and more wasm examples (#95) |
| 2025-12-04 | 5e5e124 | Jeremiah Butler | Workflow step reordering plus hot reload WA modules (#93) |
| 2025-12-01 | ae21cfd | Jeremiah Butler | Update WASM interface (#92) |
| 2025-11-29 | 73589ca | Jeremiah Butler | WASM network and jobs capabilities (#91) |
| 2025-11-27 | 45523da | Jeremiah Butler | checkpoint (#90) |
| 2025-11-24 | 6ac6701 | Jeremiah Butler | fix github actions build |
| 2025-11-24 | 3086f0f | Jeremiah Butler | Rewrite (#89) |
| 2025-09-13 | a78b073 | Jeremiah Butler | Add persistent memory (#87) |
| 2025-06-26 | e72328d | Jeremiah Butler | Add CLAUDE.md (#80) |

## Recent Releases

| Version | Date | Notes |
|---------|------|-------|
| v0.1.7 | 2025-12-20 | Add implement phase - WASM module/engine capabilities to implement code and create PR |
| v0.1.6 | 2025-12-13 | Bash tool with proper working directory support + WASM examples |
| v0.1.5 | 2025-12-04 | Workflow step reordering + hot reload for WASM modules |
| v0.1.4 | 2025-12-01 | WASM interface updates |
| v0.1.3 | 2025-11-29 | WASM network and jobs capabilities |

## Key Development Themes

1. **WASM Module Expansion** - Significant work on making WASM modules more powerful:
   - Network capabilities
   - Jobs system
   - Hot module reloading
   - Interface updates
   - Code implementation capabilities (auto-generating code from specifications)

2. **Agent/Tool Improvements**:
   - Bash tool with working directory support
   - More WASM example modules

3. **Workflow Enhancements**:
   - Drag-and-drop step reordering
   - Better workflow execution

## Recent Merged Pull Requests

| # | Title | Author | Merged Date |
|---|-------|--------|-------------|
| 100 | Add implement phase | jbutlerdev | 2025-12-20 |
| 95 | bash tool and more wasm examples | jbutlerdev | 2025-12-13 |
| 93 | jq filter wasm and hot reloading modules | jbutlerdev | 2025-12-04 |
| 92 | Update WASM interface | jbutlerdev | 2025-12-01 |
| 91 | WASM network and jobs capabilities | jbutlerdev | 2025-11-29 |
| 90 | Better Defaults | jbutlerdev | 2025-11-27 |
| 89 | Rewrite | jbutlerdev | 2025-11-24 |
| 87 | Add persistent memory | jbutlerdev | 2025-09-13 |
| 80 | Add CLAUDE.md | jbutlerdev | 2025-06-26 |
| 79 | add grpc api for MoM | jbutlerdev | 2025-05-28 |

### Notable Merged PR Details

- **PR #100 (Add implement phase)**: Adds wasm module and engine capabilities to implement code and create a PR - major new feature for automatic code implementation
- **PR #95 (bash tool)**: Adds a bash tool with proper working directory support and more example wasm modules
- **PR #93 (jq filter wasm and hot reloading)**: Adds more wasm examples and fixes module reloading
- **PR #92 (Update WASM interface)**: Uses consistent "prompt" key and allows user specified WASM configuration
- **PR #91 (WASM network and jobs capabilities)**: Extends WASM modules with network access and background jobs

## Open Issues (Trending)

| # | Title | Author | Created |
|---|-------|--------|---------|
| 101 | Update agent runtime to use pi | jbutlerdev | 2026-02-15 |
| 102 | Update agent workflow to always create git issue, worktree, push, and link branch to issue | jbutlerdev | 2026-02-15 |
| 99 | Implement Advanced Monitoring & Observability Platform | mule-bot | 2025-12-17 |
| 98 | Update issue loop workflow to monitor all assigned issues | mule-bot | 2025-12-17 |
| 97 | Implement Event-Based Actions Microservice | mule-bot | 2025-12-16 |
| 94 | Allow mule to monitor all assigned issues | jbutlerdev | 2025-12-06 |
| 83 | Advanced Monitoring & Observability Platform | jbutlerdev | 2025-09-13 |

## Project Overview

Mule is an AI workflow platform with these core primitives:
- **AI providers** - connections to models (OpenAI compliant APIs)
- **Tools** - extensible tools for agents
- **WASM modules** - imperative code execution using wazero
- **Agents** - model + system prompt + tools (using Google ADK)
- **Workflow Steps** - agent calls or WASM module execution
- **Workflows** - ordered execution of steps

## Technology Stack
- **Backend:** Go 1.24+ with Google ADK and wazero
- **Frontend:** React
- **Database:** PostgreSQL 12+
- **Container:** Docker/Docker Compose

## Recommended Blog Post Topics

Based on research, potential topics for the Mule AI blog post:

1. **"The Evolution of WASM in Mule AI"** - Deep dive into the WASM module capabilities added in recent releases (implement phase, network, jobs, hot reload)

2. **"What's New in Mule v0.1.7: Auto-Code Implementation"** - Focus on the new "implement phase" that allows Mule to automatically implement code and create PRs

3. **"Building AI Agents with Mule: A Developer's Guide"** - Overview of the platform for new users

4. **"Event-Driven AI Workflows with Mule"** - Coverage of the Event-Based Actions feature being developed
