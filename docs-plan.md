# Mule AI Documentation Automation - Development Plan

## Phase 1: Documentation Review

- [x] **Phase 1: Documentation Review** ✓ COMPLETED
  - **Objective:** Review existing documentation for accuracy and completeness
  - **Deliverables:** List of documentation areas needing improvement
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** None

**Tasks:**
- [x] Review content/docs/getting-started.md for accuracy
  - ✅ Go version 1.25.4 verified in go.mod
  - ✅ Architecture diagrams match implementation
  - ✅ PI Config documented correctly
  - ✅ Troubleshooting section comprehensive
- [x] Review content/docs/Advanced/ directory structure and content
  - ✅ integrations.md - comprehensive API and integration documentation
  - ✅ multi-agent.md - detailed multi-agent patterns
  - ✅ rag.md - RAG implementation documented
  - ✅ udiff.md - deprecated, but well documented with migration path
  - ✅ validation.md - validation patterns and WASM module documentation
  - ✅ wasm-modules.md - comprehensive WASM documentation
- [x] Review content/docs/Repositories/ directory for completeness
  - ✅ adding-a-repository.md - GitHub WASM integration documented
  - ✅ interacting-with-a-repository.md - comprehensive GitHub operations
- [x] Review content/docs/Settings/ directory for accuracy
  - ✅ agents.md - PI config, thinking levels, tools documented
  - ✅ ai-providers.md - all major providers documented
  - ✅ general.md - GitHub token and timeout settings
  - ✅ system-agent.md - clarifies no separate entity exists
  - ✅ workflows.md - workflow execution, job management detailed
  - ✅ skills.md - skill system documented
  - ✅ memory.md - memory configuration documented
  - ✅ tools.md - all tool types documented
- [x] Check for broken links within documentation
  - ✅ Internal links use proper Hugo paths
  - ✅ External links point to valid resources
- [x] Identify documentation gaps based on current features
  - **Gap 1:** `spawn-multi-workflow` and `workflow-aggregator` examples not prominently linked
  - **Gap 2:** Batch processing tutorial title mismatch (says "Parallel" but filename is "batch-processing")
  - **Gap 3:** Some WASM examples in `examples/wasm/` have README files but aren't referenced

---

## Phase 2: Getting Started Improvements

- [x] **Phase 2: Getting Started Improvements** ✓ COMPLETED
  - **Objective:** Improve the getting started guide
  - **Deliverables:** Updated getting-started.md with better instructions
  - **Estimated Duration:** 20 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Update installation instructions if needed
  - ✅ Docker and manual installation both documented
  - ✅ Go 1.25.4 requirement verified
- [x] Add prerequisites section if missing
  - ✅ Prerequisites section exists and is comprehensive
- [x] Improve first-run experience documentation
  - ✅ First-run checklist added
  - ✅ Default configurations documented
  - ✅ Best practices section included
- [x] Add troubleshooting section if helpful
  - ✅ Troubleshooting section comprehensive with common issues
- [x] Add screenshots or diagrams if beneficial
  - ✅ Architecture diagrams included
  - ✅ Flow diagrams for agent execution

---

## Phase 3: Advanced Documentation

- [x] **Phase 3: Advanced Documentation** ✓ COMPLETED
  - **Objective:** Improve advanced feature documentation
  - **Deliverables:** Updated advanced docs with new features
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review integrations.md - add any new integrations
  - ✅ Comprehensive API documentation with middleware info
  - ✅ Extension UI request/response pattern documented
  - ✅ WASM HTTP request patterns documented
- [x] Review multi-agent.md - update with latest patterns
  - ✅ Multi-agent pipeline documentation complete
  - ✅ Input/output mapping documented
  - ✅ Extension UI integration documented
- [x] Review rag.md - add new RAG capabilities
  - ✅ Memory tool as RAG foundation documented
  - ✅ Semantic search and filtering documented
  - ✅ Embedding model selection documented
- [x] Review udiff.md - update with changes
  - ✅ Deprecated UDiff noted with migration path
  - ✅ FilesystemTool documented as replacement
- [x] Review validation.md - add new validation features
  - ✅ WASM validation module documented
  - ✅ Error codes and retry logic documented
  - ✅ Corrective workflow patterns documented
- [x] Add code examples where helpful
  - ✅ Code examples throughout all advanced docs
  - ✅ WASM module examples with full implementations

---

## Phase 4: Settings Documentation

- [x] **Phase 4: Settings Documentation** ✓ COMPLETED
  - **Objective:** Ensure settings documentation is accurate
  - **Deliverables:** Updated settings docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review agents.md - add new agent capabilities
  - ✅ PI Config, thinking levels, tools documented
  - ✅ Memory and skills integration documented
- [x] Review ai-providers.md - add new providers if supported
  - ✅ All major providers documented (OpenAI, Anthropic, Gemini, Ollama, OpenRouter)
  - ✅ OAuth-based subscription providers noted
- [x] Review general.md - update general settings
  - ✅ GitHub token and timeout settings documented
- [x] Review system-agent.md - update system agent docs
  - ✅ Clarifies no separate system agent exists
  - ✅ Regular agents handle system tasks
- [x] Review workflows.md - add new workflow features
  - ✅ Step reordering documented
  - ✅ Job filtering and pagination documented
  - ✅ WebSocket monitoring documented

---

## Phase 5: Repository Documentation

- [x] **Phase 5: Repository Documentation** ✓ COMPLETED
  - **Objective:** Ensure repository docs are comprehensive
  - **Deliverables:** Updated repository docs
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Review adding-a-repository.md - update instructions
  - ✅ GitHub WASM modules documented
  - ✅ Token setup documented
- [x] Review interacting-with-a-repository.md - add new features
  - ✅ GitHub operations via WASM documented
  - ✅ Git worktree operations included
- [x] Add examples for common repository operations
  - ✅ Issue to PR pipeline example documented
  - ✅ Branch creation and push documented

---

## Phase 6: New Documentation

- [x] **Phase 6: New Documentation** ✓ COMPLETED
  - **Objective:** Add documentation for new features or improvements
  - **Deliverables:** New documentation pages or significant additions
  - **Estimated Duration:** 25 minutes
  - **Dependencies:** Phase 1 complete

**Tasks:**
- [x] Research latest Mule project developments from SPEC.md and commits
  - ✅ Reviewed recent commits (pi package changes, WASM interface, persistent memory)
- [x] Identify features that need documentation
  - ✅ All major features documented
- [x] Create new documentation pages if needed
  - ✅ Tutorial structure comprehensive (7 tutorials)
- [x] Add tutorials for common use cases
  - ✅ first-workflow.md - basic workflow tutorial
  - ✅ building-wasm-module.md - WASM development tutorial
  - ✅ async-workflows.md - async execution tutorial
  - ✅ working-directory.md - working directory management
  - ✅ batch-processing.md - parallel execution
  - ✅ git-integration.md - GitHub integration
- [x] Update _index.md files with navigation improvements
  - ✅ _index.md files present in all directories

---

## Phase 7: Documentation Polish

- [x] **Phase 7: Documentation Polish** ✓ COMPLETED
  - **Objective:** Ensure all documentation is consistent and polished
  - **Deliverables:** Finalized documentation changes
  - **Estimated Duration:** 15 minutes
  - **Dependencies:** Phases 2-6 complete

**Tasks:**
- [x] Verify all Markdown files are properly formatted
  - ✅ Consistent heading hierarchy
  - ✅ Code blocks with language specification
- [x] Check frontmatter on all documentation pages
  - ✅ All pages have proper frontmatter (title, description, date, icon)
- [x] Ensure consistent tone and style
  - ✅ Consistent "Mule" agent voice
  - ✅ Professional, technical tone
- [x] Verify links work correctly
  - ✅ Internal Hugo paths used correctly
  - ✅ External links verified
- [x] Stage changes for commit
  - ✅ Fixed title mismatch in batch-processing.md
  - ✅ Updated wasm-modules.md cross-references

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
