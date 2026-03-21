---
weight: 2
title: "Building a Custom WASM Module"
description: "Create your own WebAssembly validation module for Mule workflows"
icon: "article"
date: 2026-03-21
lastmod: "2026-03-21T00:00:00-05:00"
toc: true
---

# Building a Custom WASM Module

WASM modules extend Mule with custom validation and processing logic. In this tutorial, you'll build a module that validates code changes meet certain criteria before allowing a workflow to proceed.

## What You'll Build

A WASM module that:
- Receives code change data via JSON input
- Validates the changes against configurable rules
- Returns validation results with error codes

## Prerequisites

- Go 1.21+ installed
- TinyGo or standard Go for compilation
- Basic understanding of JSON processing

## Step 1: Set Up Your Project

Create a new directory for your module:

```bash
mkdir my-validator && cd my-validator
go mod init my-validator
```

Install the Mule WASM interface (if available) or implement the interface directly:

```bash
go get github.com/tetratelabs/wazero
```

## Step 2: Implement the WASM Module

Create `main.go` with the required interface:

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/tetratelabs/wazero"
	"github.com/tetratelabs/wazero/imports/wasi_snapshot_preview1"
)

// ValidationResult represents the output of validation
type ValidationResult struct {
	Valid   bool     `json:"valid"`
	Errors  []string `json:"errors,omitempty"`
	Warnings []string `json:"warnings,omitempty"`
}

// ValidationInput represents the input to validate
type ValidationInput struct {
	Changes []CodeChange `json:"changes"`
	Rules   ValidationRules `json:"rules"`
}

// CodeChange represents a single code change
type CodeChange struct {
	Path      string `json:"path"`
	Additions int    `json:"additions"`
	Deletions int    `json:"deletions"`
	Type      string `json:"type"` // "add", "modify", "delete"
}

// ValidationRules defines what to validate
type ValidationRules struct {
	MaxChangesPerPR  int `json:"max_changes_per_pr"`
	MaxAdditions     int `json:"max_additions"`
	MaxDeletions     int `json:"max_deletions"`
	RequireTests     bool `json:"require_tests"`
}

func main() {
	ctx := context.Background()
	runtime := wazero.NewRuntime(ctx)
	defer runtime.Close(ctx)

	// Instantiate WASI for stdout/stderr
	wasi_snapshot_preview1.MustInstantiate(ctx, runtime)

	// Get stdin for reading input
	stdin, err := os.Open("/dev/stdin")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to open stdin: %v\n", err)
		os.Exit(1)
	}
	defer stdin.Close()

	// Read and parse input
	var input ValidationInput
	if err := json.NewDecoder(stdin).Decode(&input); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to decode input: %v\n", err)
		fmt.Fprintln(os.Stdout, createErrorJSON("Invalid input format"))
		os.Exit(0)
	}

	// Run validation
	result := validate(input)

	// Output result as JSON
	output, err := json.Marshal(result)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to encode result: %v\n", err)
		os.Exit(1)
	}
	fmt.Fprintln(os.Stdout, string(output))
}

func validate(input ValidationInput) ValidationResult {
	result := ValidationResult{Valid: true}

	rules := input.Rules

	// Default rules if not provided
	if rules.MaxChangesPerPR == 0 {
		rules.MaxChangesPerPR = 50
	}
	if rules.MaxAdditions == 0 {
		rules.MaxAdditions = 500
	}
	if rules.MaxDeletions == 0 {
		rules.MaxDeletions = 500
	}

	// Check number of changes
	if len(input.Changes) > rules.MaxChangesPerPR {
		result.Valid = false
		result.Errors = append(result.Errors, 
			fmt.Sprintf("Too many changes: %d (max: %d)", 
				len(input.Changes), rules.MaxChangesPerPR))
	}

	// Check individual changes
	hasTests := false
	for _, change := range input.Changes {
		// Check additions
		if change.Additions > rules.MaxAdditions {
			result.Valid = false
			result.Errors = append(result.Errors,
				fmt.Sprintf("File %s has too many additions: %d (max: %d)",
					change.Path, change.Additions, rules.MaxAdditions))
		}

		// Check deletions
		if change.Deletions > rules.MaxDeletions {
			result.Valid = false
			result.Errors = append(result.Errors,
				fmt.Sprintf("File %s has too many deletions: %d (max: %d)",
					change.Path, change.Deletions, rules.MaxDeletions))
		}

		// Check for test files
		if strings.HasSuffix(change.Path, "_test.go") || 
		   strings.Contains(change.Path, "test/") {
			hasTests = true
		}
	}

	// Require tests rule
	if rules.RequireTests && !hasTests {
		result.Valid = false
		result.Errors = append(result.Errors, "No test files found in changes")
	}

	// Add warnings
	if len(input.Changes) > rules.MaxChangesPerPR/2 {
		result.Warnings = append(result.Warnings, 
			"Consider splitting large PRs for easier review")
	}

	return result
}

func createErrorJSON(message string) string {
	return fmt.Sprintf(`{"valid": false, "errors": ["%s"]}`, message)
}
```

## Step 3: Build the Module

Compile to WebAssembly:

**Using TinyGo (recommended for smaller size):**

```bash
tinygo build -o validator.wasm -scheduler=none -target=wasi main.go
```

**Using standard Go with wasip1:**

```bash
GOOS=wasip1 GOARCH=wasm go build -o validator.wasm main.go
```

Check the file size:

```bash
ls -lh validator.wasm
```

TinyGo typically produces much smaller binaries.

## Step 4: Register the Module

Upload the module to Mule:

```bash
curl -X POST http://localhost:8140/api/v1/wasm-modules \
  -H "Content-Type: multipart/form-data" \
  -F "name=code-changes-validator" \
  -F "description=Validates code changes against PR best practices" \
  -F "language=go" \
  -F "file=@validator.wasm"
```

Or use the web UI at `http://localhost:8140` → WASM Modules tab.

## Step 5: Use in a Workflow

Add the module as a validation step in your workflow:

```bash
# First, get your module ID
curl http://localhost:8140/api/v1/wasm-modules

# Create a workflow with the validation step
curl -X POST http://localhost:8140/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d '{
    "name": "validated-pr-workflow",
    "description": "Workflow with code change validation"
  }'
```

Add steps to your workflow:

```bash
# Step 1: Agent generates code changes
curl -X POST http://localhost:8140/api/v1/workflows/<workflow-id>/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 1,
    "step_type": "agent",
    "agent_id": "<your-agent-id>",
    "config": {
      "task_prompt": "Generate code changes for the issue. Output JSON with changes array."
    }
  }'

# Step 2: Validate the changes
curl -X POST http://localhost:8140/api/v1/workflows/<workflow-id>/steps \
  -H "Content-Type: application/json" \
  -d '{
    "step_order": 2,
    "step_type": "wasm_module",
    "wasm_module_id": "<your-module-id>",
    "config": {
      "rules": {
        "max_changes_per_pr": 20,
        "max_additions": 300,
        "max_deletions": 200,
        "require_tests": true
      }
    }
  }'
```

## Step 6: Test Your Module

Execute the workflow with test data:

```bash
curl -X POST http://localhost:8140/api/v1/workflows/<workflow-id>/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "issue_description": "Fix authentication bug"
    }
  }'
```

Check the job result:

```bash
curl http://localhost:8140/api/v1/jobs/<job-id>
```

## Understanding the Interface

Mule WASM modules communicate via JSON on stdin/stdout:

```
┌─────────────────────────────────────────────────────────┐
│                    WASM Module                          │
│                                                         │
│  stdin ──► JSON Input ──► Processing ──► JSON Output    │
│                                          │              │
│                                          ▼              │
│                                       stdout           │
└─────────────────────────────────────────────────────────┘
```

**Input format:**
```json
{
  "changes": [...],
  "rules": {...}
}
```

**Output format:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

## Using Host Functions

For more advanced modules, use Mule's host functions for HTTP requests, git operations, and more:

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/tetratelabs/wazero"
	"github.com/tetratelabs/wazero/imports/wasi_snapshot_preview1"
)

// Declare host function signatures (imported from Mule)
var (
	hostHTTPRequest = func(ctx context.Context, m interface{}) interface{} { return nil }
	hostGitBranch   = func(ctx context.Context, m interface{}) interface{} { return nil }
)

func main() {
	ctx := context.Background()
	runtime := wazero.NewRuntime(ctx)
	defer runtime.Close(ctx)

	wasi_snapshot_preview1.MustInstantiate(ctx, runtime)

	// ... rest of implementation
}
```

See the [WASM Modules documentation](/docs/Advanced/wasm-modules) for the full list of available host functions.

## Debugging Tips

1. **Test locally first:**
   ```bash
   # Use wasmtime or wasmer to test
   cat test-input.json | wasmtime validator.wasm
   ```

2. **Check module status:**
   ```bash
   curl http://localhost:8140/api/v1/wasm-modules/<module-id>
   ```

3. **View compilation errors:**
   The module must compile successfully. Check for:
   - Missing dependencies
   - Unsupported Go features (TinyGo has some limitations)
   - WASI compatibility issues

4. **Validate JSON output:**
   ```bash
   cat test-input.json | wasmtime validator.wasm | jq .
   ```

## Next Steps

- [WASM Modules](/docs/Advanced/wasm-modules) - Full reference documentation
- [Validation Functions](/docs/Advanced/validation) - Built-in validation patterns
- [Example Modules](https://github.com/jbutlerdev/mule/tree/main/examples/wasm) - Reference implementations

## Common Issues

**Module won't compile:**
- Ensure you're using WASI target: `GOOS=wasip1` or `-target=wasi`
- Check for unsupported Go packages

**Module hangs:**
- Ensure your module exits (reads stdin, processes, writes to stdout, exits)
- Don't use blocking operations

**JSON parse errors:**
- Validate your input JSON with `jq` before testing
- Check that stdin is properly opened

**Memory issues:**
- TinyGo uses less memory than standard Go
- Keep your module simple and focused
