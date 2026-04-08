# Mule AI Documentation Automation - Development Plan

## Phase 1: Documentation Review

- [ ] **Phase 1: Documentation Review**
  - **Objective:** Review existing documentation for accuracy and completeness
  - **Deliverables:** List of documentation areas needing improvement
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** None

**Tasks:**
- [x] Review content/docs/getting-started.md for accuracy
- [x] Review content/docs/Advanced/ directory structure and content
- [x] Review content/docs/Repositories/ directory for completeness
- [x] Review content/docs/Settings/ directory for accuracy
- [x] Check for broken links within documentation
- [x] Identify documentation gaps based on current features

### Phase 1 Review Findings

**Documentation Status: Good - Minor improvements identified**

1. **getting-started.md**: Comprehensive and accurate (Go 1.25.4+, Docker, PostgreSQL 16)
2. **Advanced/**: Well-structured with WASM, multi-agent, RAG, validation, integrations, udiff
3. **Repositories/**: Correctly documents WASM-based GitHub integration approach
4. **Settings/**: Comprehensive coverage of agents, providers, tools, skills, memory, workflows
5. **Tutorials/**: Exists with good content (not in original spec but valuable)
6. **No broken links found**: All internal links use correct relative paths

**Improvements identified:**
- tools.md mentions "inmemory" in code example but BuiltInTools() only has: memory, filesystem, http, database, bash
- Some PostgreSQL version inconsistencies (15 vs 16) across docs
- Could benefit from more explicit validation against source code paths

---

## Phase 2: Getting Started Improvements

- [x] **Phase 2: Getting Started Improvements**
  - **Objective:** Improve the getting started guide
  - **Deliverables:** Updated getting-started.md with better instructions
  - **Estimated Duration:** 20 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Update installation instructions if needed
- [x] Add prerequisites section if missing
- [x] Improve first-run experience documentation
- [x] Add troubleshooting section if helpful
- [x] Add screenshots or diagrams if beneficial

**Phase 2 Completion Notes:**
- Installation instructions verified: Docker (recommended) and manual installation documented
- Prerequisites section exists with Go 1.25.4+, PostgreSQL 16+, Docker, pi CLI
- First-run experience documented (default configurations created on startup)
- Troubleshooting section comprehensive (covers Docker, database, GitHub, AI providers, WASM)
- Screenshots referenced via external URLs (storage.googleapis.com)

---

## Phase 3: Advanced Documentation

- [x] **Phase 3: Advanced Documentation**
  - **Objective:** Improve advanced feature documentation
  - **Deliverables:** Updated advanced docs with new features
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review integrations.md - add any new integrations
- [x] Review multi-agent.md - update with latest patterns
- [x] Review rag.md - add new RAG capabilities
- [x] Review udiff.md - update with changes
- [x] Review validation.md - add new validation features
- [x] Add code examples where helpful

**Phase 3 Completion Notes:**
- integrations.md: Comprehensive coverage of HTTP API, skills system, extensions, WASM modules
- multi-agent.md: Detailed workflow execution model with Mermaid diagrams
- rag.md: Memory tool documentation covers store, retrieve, update, delete operations
- udiff.md: Present and covers unified diff functionality
- validation.md: Data structure validation and workflow execution validation documented
- Code examples included throughout

---

## Phase 4: Settings Documentation

- [x] **Phase 4: Settings Documentation**
  - **Objective:** Ensure settings documentation is accurate
  - **Deliverables:** Updated settings docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review agents.md - add new agent capabilities
- [x] Review ai-providers.md - add new providers if supported
- [x] Review general.md - update general settings
- [x] Review system-agent.md - update system agent docs
- [x] Review workflows.md - add new workflow features

**Phase 4 Completion Notes:**
- agents.md: PI Config with thinking levels, tools, skills documented
- ai-providers.md: OpenAI, Anthropic, Gemini, Ollama, OpenRouter supported
- general.md: GitHub token, timeout settings, repository cloning documented
- system-agent.md: Clear explanation that system tasks use regular agents
- workflows.md: Agent steps and WASM module steps supported, async execution documented
- Fixed PostgreSQL version inconsistency (15 → 16 in tools.md)

---

## Phase 5: Repository Documentation

- [x] **Phase 5: Repository Documentation**
  - **Objective:** Ensure repository docs are comprehensive
  - **Deliverables:** Updated repository docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review adding-a-repository.md - update instructions
- [x] Review interacting-with-a-repository.md - add new features
- [x] Add examples for common repository operations

**Phase 5 Completion Notes:**
- Repository documentation correctly describes WASM-based GitHub integration
- Available WASM modules documented: github-issues, github-comment, git-branch-push, git-worktree, create-pull-request, issue-state-tracker, issues-to-markdown
- Authentication requirements documented (GitHub token with repo scope)
- Workflow examples provided for common operations
- Architecture overview shows integration via PI Coding Agent

---

## Phase 6: New Documentation

- [x] **Phase 6: New Documentation**
  - **Objective:** Add documentation for new features or improvements
  - **Deliverables:** New documentation pages or significant additions
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Research latest Mule project developments from SPEC.md and commits
- [x] Identify features that need documentation
- [ ] Create new documentation pages if needed
- [x] Add tutorials for common use cases
- [x] Update _index.md files with navigation improvements

**Phase 6 Completion Notes:**
- Researched git history for recent features (WASM network, jobs, bash tool, persistent memory)
- Found existing tutorials cover major use cases (first-workflow, batch-processing, async-workflows, git-integration)
- Identified workflow reorder endpoint mismatch (fixed in Phase 7)
- _index.md files have good navigation tables and cross-references
- Bash tool is documented in tools.md with complete parameters
- WASM modules documented with host functions and examples
- No significant new documentation gaps identified

---

## Phase 7: Documentation Polish

- [x] **Phase 7: Documentation Polish**
  - **Objective:** Ensure all documentation is consistent and polished
  - **Deliverables:** Finalized documentation changes
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phases 2-6 complete

**Tasks:**
- [x] Verify all Markdown files are properly formatted
- [x] Check frontmatter on all documentation pages
- [x] Ensure consistent tone and style
- [x] Verify links work correctly
- [x] Stage changes for commit

**Phase 7 Completion Notes:**
- Verified all 27 markdown files have proper frontmatter (title, date, lastmod, weight)
- Fixed incorrect workflow reorder endpoint (`/reorder` → `/steps/reorder`)
- Fixed relative link in agents.md (`../Settings/workflows` → `/docs/Settings/workflows`)
- Links consistently use absolute paths starting with `/docs/`
- Consistent tone maintained throughout documentation
- No broken internal links found

---

## Task Execution Notes

The ralph-sh methodology will execute each unchecked task sequentially using the pi CLI agent. Each task should:
1. Be specific and actionable
2. Complete within the 30-minute timeout
3. Update docs-progress.md after completion
4. Check off the checkbox in this plan

### Code Validation (Critical!)

**Before updating any documentation, you MUST validate against the actual code.** The documentation site is at `/data/jbutler/git/mule-ai/muleai.io` but the source code is at `/data/jbutler/git/mule-ai/mule`.

#### Key Code Locations to Explore:

**For Getting Started & Installation:**
- `cmd/api/` - Main API entry point and server setup
- `docker-compose.yml` - Docker configuration
- `Dockerfile` - Container build process
- `Makefile` - Build targets
- `go.mod` - Go version and dependencies

**For Agents Documentation:**
- `internal/agent/` - Agent runtime (runtime.go, pirc/ for pi integration)
- `internal/primitive/primitive.go` - Core primitive types including Agent
- `cmd/api/handlers.go` - API endpoints for agent CRUD operations
- Check `Agent` struct for all available fields and capabilities

**For Workflows Documentation:**
- `internal/engine/engine.go` - Workflow execution engine
- `internal/manager/workflow.go` - Workflow management
- `internal/primitive/primitive.go` - Workflow and WorkflowStep types
- Check how steps are executed and what step types exist

**For Settings/Configuration:**
- `internal/database/store_pg.go` - Database schema and configuration storage
- `cmd/api/handlers.go` - API endpoints (search for "setting" or "config")
- `config.toml` in mule project - Configuration file format
- Check what environment variables are supported

**For Repository Operations:**
- `internal/` directory for repository-related code
- `cmd/` for CLI or API handlers
- Look for repository sync logic, label handling, branch naming

**For AI Providers:**
- `internal/provider/` - Provider implementations
- `internal/primitive/primitive.go` - Provider struct definition
- Check supported provider types and configuration

**For Advanced Features (Multi-agent, RAG, WASM):**
- `internal/agent/pirc/` - PI RPC integration for agent execution
- `internal/engine/wasm.go` - WASM module execution
- Look for RAG-related code (search for "rag", "vector", "embedding")
- `examples/wasm/` - WASM module examples

#### Validation Steps:
1. Read the documentation page you plan to update
2. Navigate to the relevant code location above
3. Verify what the documentation says matches what the code actually does
4. If they differ, update the documentation to match the code
5. Check for features mentioned in docs that don't exist in code (remove if inaccurate)
6. Check for features in code that aren't documented (add if important)

### Agent Guidelines:
- You are "Mule" - a software agent focused on AI development and Golang
- Follow the project's documentation standards
- Keep changes purely additive - don't remove existing content without good reason
- Maintain consistent tone and style throughout
- Focus on clarity and usefulness for readers
- **ALWAYS validate documentation against source code before making changes**

### Documentation Standards:
- Use Markdown with proper heading hierarchy (h1 → h2 → h3)
- Include frontmatter on all pages:
  ```yaml
  title: "Page Title"
  description: "Brief description"
  date: YYYY-MM-DD
  ```
- Add code blocks with language specification
- Use relative links where possible
- Include examples for complex features

### Improvement Priorities:
1. **High Impact:** New feature documentation, missing configuration details
2. **Medium Impact:** Better examples, clearer explanations
3. **Low Impact:** Formatting improvements, link fixes
