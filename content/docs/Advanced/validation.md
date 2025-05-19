---
weight: 3
title: "Validation Functions"
description: "Ensuring code quality with automated validation"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

Validation functions in Mule ensure that AI-generated code meets quality standards before being committed. These functions act as automated quality gates, running tests, linters, and other checks on the code.

## Built-in Validation Functions

Mule includes several built-in validation functions for Go codebases:

### getDeps

```go
func getDeps(path string) (string, error)
```

This function ensures all dependencies are installed by running `make download-golangci-lint`. It's typically the first validation function to run to ensure other tools are available.

### goFmt

```go
func goFmt(path string) (string, error)
```

Formats Go code according to standard conventions by running `go fmt ./...`. This ensures consistent code formatting throughout the codebase.

### goModTidy

```go
func goModTidy(path string) (string, error)
```

Cleans up Go module dependencies by running `go mod tidy`. This ensures that all imports are properly declared in the go.mod file and removes unused dependencies.

### golangciLint

```go
func golangciLint(path string) (string, error)
```

Runs a comprehensive set of linters via `make lint` to catch common coding issues, potential bugs, and style violations.

### goTest

```go
func goTest(path string) (string, error)
```

Executes tests with `go test ./...` to verify that the code functions as expected and doesn't break existing functionality.

## How Validation Works

When an agent generates code changes, Mule runs the specified validation functions in sequence:

1. The agent makes code changes to the repository
2. Each validation function is executed in the order specified
3. If any validation fails, the output is captured and sent back to the agent
4. The agent attempts to fix the issues based on the validation output
5. This process repeats until all validations pass or the maximum retry limit is reached

## Configuring Validations

Validation functions can be configured at the workflow level:

```yaml
validationFunctions:
  - getDeps
  - goFmt
  - goModTidy
  - golangciLint
  - goTest
```

For specific agents, you can configure different validation sets based on the task requirements.

## Creating Custom Validation Functions

You can extend Mule with custom validation functions for your specific needs:

1. Define your validation function with the signature:
   ```go
   func YourValidator(path string) (string, error)
   ```

2. Register it in the validation function map:
   ```go
   var functions = map[string]ValidationFunc{
       // existing functions...
       "yourValidator": YourValidator,
   }
   ```

3. Add it to your workflow configuration

## Language-specific Validations

While the built-in validators focus on Go, you can create custom validators for other languages:

### JavaScript/TypeScript Example

```go
func eslint(path string) (string, error) {
    cmd := exec.Command("npx", "eslint", ".")
    cmd.Dir = path
    out, err := cmd.CombinedOutput()
    return string(out), err
}

func jest(path string) (string, error) {
    cmd := exec.Command("npx", "jest")
    cmd.Dir = path
    out, err := cmd.CombinedOutput()
    return string(out), err
}
```

### Python Example

```go
func pylint(path string) (string, error) {
    cmd := exec.Command("python", "-m", "pylint", ".")
    cmd.Dir = path
    out, err := cmd.CombinedOutput()
    return string(out), err
}

func pytest(path string) (string, error) {
    cmd := exec.Command("python", "-m", "pytest")
    cmd.Dir = path
    out, err := cmd.CombinedOutput()
    return string(out), err
}
```

## Handling Validation Failures

When validation fails, Mule follows a structured approach:

1. The validation error output is captured
2. The agent is provided with:
   - The specific validation that failed
   - The error output from the validation
   - The original code changes
3. The agent is asked to fix the issues
4. The process is repeated up to 20 times (configurable)

## Best Practices

To get the most out of validation functions:

1. **Start simple**: Begin with basic formatting and linting before adding comprehensive tests
2. **Clear error messages**: Ensure your custom validators provide clear, actionable error messages
3. **Fast feedback**: Optimize validation functions to run quickly for better agent iteration
4. **Progressive validation**: Order validations from fastest to slowest for efficiency
5. **Context-aware validation**: Include repository-specific checks that enforce your project's conventions

## Debugging Validation Issues

If validation consistently fails:

1. Run the validation commands manually to see the output
2. Check if validation requirements are clearly communicated in the agent's prompt
3. Verify that validation tools are properly installed and configured
4. Consider relaxing validation requirements for initial development phases