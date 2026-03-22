# Mule AI Documentation Automation - Development Plan

## Phase 1: Documentation Review

- [x] **Phase 1: Documentation Review**
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

**Phase 1 Findings:**
- ✅ All documentation files reviewed
- ⚠️ validation.md: Missing `bash` tool from valid tool types - **FIXED**
- ⚠️ integrations.md: Missing `memory` tool from comment - **FIXED**
- ⚠️ getting-started.md: Default provider is OpenRouter, not Ollama - **FIXED**
- ✅ Source code validated against documentation - core features match

---

## Phase 2: Getting Started Improvements

- [ ] **Phase 2: Getting Started Improvements**
  - **Objective:** Improve the getting started guide
  - **Deliverables:** Updated getting-started.md with better instructions
  - **Estimated Duration:** 20 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Update installation instructions if needed (Go version verified: 1.25.4)
- [x] Add prerequisites section if missing (already present and accurate)
- [x] Improve first-run experience documentation (fixed default provider info, updated checklist)
- [x] Add troubleshooting section if helpful (already present with comprehensive coverage)
- [x] Add screenshots or diagrams if beneficial (architecture diagrams already present in getting-started.md, added workflow execution diagram to multi-agent.md)

---

## Phase 3: Advanced Documentation

- [x] **Phase 3: Advanced Documentation**
  - **Objective:** Improve advanced feature documentation
  - **Deliverables:** Updated advanced docs with new features
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review integrations.md - add any new integrations (already comprehensive, tool types verified: bash, filesystem, http, database, memory)
- [x] Review multi-agent.md - update with latest patterns (added workflow execution diagram, data flow patterns, error handling, timeout configuration)
- [x] Review rag.md - add new RAG capabilities (comprehensive documentation already exists for memory tool with vector embeddings)
- [x] Review udiff.md - update with changes (UDiff deprecated, FilesystemTool documented)
- [x] Review validation.md - add new validation features (verified code vs docs, fixed tool types to clarify bash is built-in)
- [x] Add code examples where helpful (already well-documented in all advanced docs)

---

## Phase 4: Settings Documentation

- [x] **Phase 4: Settings Documentation**
  - **Objective:** Ensure settings documentation is accurate
  - **Deliverables:** Updated settings docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review agents.md - add new agent capabilities (already comprehensive with tools, skills, PI config documented)
- [x] Review ai-providers.md - add new providers if supported (comprehensive, verified provider types match code)
- [x] Review general.md - update general settings (timeout settings verified: timeout_workflow_seconds, timeout_request_seconds, timeout_job_seconds)
- [x] Review system-agent.md - update system agent docs (clear explanation of how system tasks work via regular agents)
- [x] Review workflows.md - add new workflow features (added workflow execution flow diagram, real-time monitoring via WebSocket, job management details)

---

## Phase 5: Repository Documentation

- [x] **Phase 5: Repository Documentation**
  - **Objective:** Ensure repository docs are comprehensive
  - **Deliverables:** Updated repository docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review adding-a-repository.md - update instructions (comprehensive WASM-based GitHub integration documented)
- [x] Review interacting-with-a-repository.md - add new features (well-documented with all WASM modules: GitHub Issues, Comment, Branch Push, PR creation, Worktree, State Tracker, Issues-to-Markdown)
- [x] Add examples for common repository operations (complete workflow examples provided)

---

## Phase 6: New Documentation

- [ ] **Phase 6: New Documentation**
  - **Objective:** Add documentation for new features or improvements
  - **Deliverables:** New documentation pages or significant additions
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [ ] Research latest Mule project developments from SPEC.md and commits
- [ ] Identify features that need documentation
- [ ] Create new documentation pages if needed
- [ ] Add tutorials for common use cases
- [ ] Update _index.md files with navigation improvements

---

## Phase 7: Documentation Polish

- [x] **Phase 7: Documentation Polish**
  - **Objective:** Ensure all documentation is consistent and polished
  - **Deliverables:** Finalized documentation changes
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phases 2-6 complete

**Tasks:**
- [x] Verify all Markdown files are properly formatted (Hugo build succeeds)
- [x] Check frontmatter on all documentation pages (all files have proper frontmatter)
- [x] Ensure consistent tone and style (consistent throughout documentation)
- [x] Verify links work correctly (verified internal links work)
- [x] Fix Advanced/_index.md inconsistency (UDiff → File Operations to match actual page title)
- [ ] Stage changes for commit

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
