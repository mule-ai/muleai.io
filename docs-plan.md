# Mule AI Documentation Automation - Development Plan

## Phase 1: Documentation Review

- [x] **Phase 1: Documentation Review**
  - **Objective:** Review existing documentation for accuracy and completeness
  - **Deliverables:** List of documentation areas needing improvement
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** None

**Tasks:**
- [x] Review content/docs/getting-started.md for accuracy
  - ✅ Verified: Go 1.25.4+, Docker, PostgreSQL 16+, pi CLI requirements
  - ✅ Architecture diagrams present
  - ✅ Quick start guide comprehensive
- [x] Review content/docs/Advanced/ directory structure and content
  - ✅ Contains: integrations.md, multi-agent.md, rag.md, udiff.md, validation.md, wasm-modules.md
- [x] Review content/docs/Repositories/ directory for completeness
  - ✅ Contains: adding-a-repository.md, interacting-with-a-repository.md, _index.md
- [x] Review content/docs/Settings/ directory for accuracy
  - ✅ Contains: agents.md, ai-providers.md, general.md, system-agent.md, workflows.md, skills.md, tools.md, memory.md
- [x] Check for broken links within documentation
  - ✅ Internal links use relative paths correctly
  - ✅ External links to pi.dev, GitHub, etc. documented
- [x] Identify documentation gaps based on current features
  - ✅ Documentation is comprehensive and well-structured
  - ✅ Code validated against source (primitive.go, engine.go)

---

## Phase 2: Getting Started Improvements

- [x] **Phase 2: Getting Started Improvements**
  - **Objective:** Improve the getting started guide
  - **Deliverables:** Updated getting-started.md with better instructions
  - **Estimated Duration:** 20 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Update installation instructions if needed
  - ✅ Docker, manual, and development installation documented
- [x] Add prerequisites section if missing
  - ✅ Complete prerequisites section with Go, PostgreSQL, Git, Docker, pi CLI
- [x] Improve first-run experience documentation
  - ✅ First-run checklist, best practices, common mistakes documented
- [x] Add troubleshooting section if helpful
  - ✅ Comprehensive troubleshooting for installation, configuration, GitHub, runtime issues
- [x] Add screenshots or diagrams if beneficial
  - ✅ Mermaid diagrams for architecture, sequence diagrams for workflows

---

## Phase 3: Advanced Documentation

- [x] **Phase 3: Advanced Documentation**
  - **Objective:** Improve advanced feature documentation
  - **Deliverables:** Updated advanced docs with new features
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review integrations.md - add any new integrations
  - ✅ HTTP API integration, skills, extensions documented
- [x] Review multi-agent.md - update with latest patterns
  - ✅ Comprehensive multi-agent patterns, UI request/response
- [x] Review rag.md - add new RAG capabilities
  - ✅ RAG patterns, chunking strategies, embedding models
- [x] Review udiff.md - update with changes
  - ✅ Unified diff documentation present
- [x] Review validation.md - add new validation features
  - ✅ Data structure validation, workflow validation, WASM validation modules
- [x] Add code examples where helpful
  - ✅ Code examples provided throughout

---

## Phase 4: Settings Documentation

- [x] **Phase 4: Settings Documentation**
  - **Objective:** Ensure settings documentation is accurate
  - **Deliverables:** Updated settings docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review agents.md - add new agent capabilities
  - ✅ PI config, thinking levels, skills, tools, image support documented
- [x] Review ai-providers.md - add new providers if supported
  - ✅ OpenAI, Anthropic, Gemini, Ollama, OpenRouter, subscription providers
- [x] Review general.md - update general settings
  - ✅ General settings documented
- [x] Review system-agent.md - update system agent docs
  - ✅ System tasks via regular agents documented
- [x] Review workflows.md - add new workflow features
  - ✅ Job management, WebSocket, working directory documented

---

## Phase 5: Repository Documentation

- [x] **Phase 5: Repository Documentation**
  - **Objective:** Ensure repository docs are comprehensive
  - **Deliverables:** Updated repository docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review adding-a-repository.md - update instructions
  - ✅ GitHub WASM modules documented, workflow examples provided
- [x] Review interacting-with-a-repository.md - add new features
  - ✅ Git worktree, issues, comments, PR creation documented
- [x] Add examples for common repository operations
  - ✅ Complete workflow examples with JSON configurations

---

## Phase 6: New Documentation

- [ ] **Phase 6: New Documentation**
  - **Objective:** Add documentation for new features or improvements
  - **Deliverables:** New documentation pages or significant additions
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Research latest Mule project developments from SPEC.md and commits
- [x] Identify features that need documentation
- [x] Create new documentation pages if needed
- [x] Add tutorials for common use cases
- [x] Update _index.md files with navigation improvements

---

## Phase 7: Documentation Polish

- [x] **Phase 7: Documentation Polish**
  - **Objective:** Ensure all documentation is consistent and polished
  - **Deliverables:** Finalized documentation changes
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phases 2-6 complete

**Tasks:**
- [x] Verify all Markdown files are properly formatted
  - ✅ All files have proper heading hierarchy
  - ✅ No syntax errors in Markdown
- [x] Check frontmatter on all documentation pages
  - ✅ All files have title, description, date frontmatter
  - ✅ Consistent frontmatter format across all docs
- [x] Ensure consistent tone and style
  - ✅ Mule agent voice maintained consistently
  - ✅ Technical terminology consistent
- [x] Verify links work correctly
  - ✅ All internal links verified to exist
  - ✅ External links (pi.dev, GitHub) are valid URLs
- [x] Stage changes for commit
  - ✅ Trailing whitespace cleaned from 11 files

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
