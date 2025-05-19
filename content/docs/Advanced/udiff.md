---
weight: 5
title: "Unified Diff (UDiff) Implementation"
description: "How Mule handles code changes using unified diffs"
icon: "article"
date: "2025-05-19T12:00:00-05:00"
lastmod: "2025-05-19T12:00:00-05:00"
toc: true
---

Unified Diff (UDiff) is the mechanism Mule uses to represent and apply code changes. This approach allows AI agents to specify precise modifications to files without needing to understand or generate the entire codebase.

## What is UDiff?

UDiff (Unified Diff) is a standard format for representing differences between text files. It shows:

- Which files are being modified
- Which lines are being added, removed, or changed
- Context surrounding the changes

A simple UDiff looks like this:

```diff
--- a/path/to/file.go
+++ b/path/to/file.go
@@ -10,7 +10,7 @@ func example() {
     // Some code here
-    fmt.Println("Old code")
+    fmt.Println("New code")
     // More code
 }
```

In this example:
- The file being modified is `path/to/file.go`
- Line 10 provides context
- Line 11 shows the removed code (prefixed with `-`)
- Line 12 shows the added code (prefixed with `+`)
- Line 13 provides more context

## How Mule Uses UDiff

In Mule, UDiff serves several crucial purposes:

1. **Output Format**: AI agents can generate UDiffs rather than complete files
2. **Change Application**: Mule applies these UDiffs to the actual codebase
3. **Change Representation**: UDiffs are used to show changes in pull requests
4. **Context for Feedback**: UDiffs provide context for PR comments and iterations

## Advantages of UDiff

Using UDiff offers significant benefits:

- **Precision**: Changes are applied exactly where intended
- **Context**: The surrounding code provides context for changes
- **Efficiency**: Only the changes are transmitted, not entire files
- **Readability**: Diffs are human-readable and easy to review
- **Compatibility**: Standard format works with existing tools and platforms

## UDiff Format in Mule

Mule expects AI-generated UDiffs to follow this format:

````
```diff
--- a/path/to/file1.go
+++ b/path/to/file1.go
@@ -10,7 +10,7 @@ func example() {
     // Some code
-    oldCode()
+    newCode()
     // More code
 }
```
````

Key requirements:
- The diff must be wrapped in triple backticks with `diff` language specifier
- File paths must be correct relative to the repository root
- Line numbers in the hunk header (`@@ -10,7 +10,7 @@`) should be accurate
- Context lines should match the actual file content

## Multiple File Changes

UDiffs can represent changes to multiple files:

````
```diff
--- a/path/to/file1.go
+++ b/path/to/file1.go
@@ -10,7 +10,7 @@ func example() {
     // Some code
-    oldCode()
+    newCode()
     // More code
 }

--- a/path/to/file2.go
+++ b/path/to/file2.go
@@ -15,6 +15,9 @@ func anotherExample() {
     // Some code
+    // New functionality
+    additionalCode()
+    
     // More code
 }
```
````

## Processing UDiffs

When an agent returns output containing UDiffs, Mule processes them as follows:

1. **Parsing**: The output is scanned for UDiff blocks
2. **Validation**: Each UDiff is validated for correct format and paths
3. **Application**: Changes are applied to the repository files
4. **Verification**: Modified files are checked for expected changes

## Creating New Files

To create a new file with UDiff:

````
```diff
--- /dev/null
+++ b/path/to/newfile.go
@@ -0,0 +1,10 @@
+package example
+
+import (
+    "fmt"
+)
+
+func NewFunction() {
+    fmt.Println("This is a new file")
+}
+
```
````

## Deleting Files

To delete an existing file:

````
```diff
--- a/path/to/oldfile.go
+++ /dev/null
@@ -1,10 +0,0 @@
-package example
-
-import (
-    "fmt"
-)
-
-func OldFunction() {
-    fmt.Println("This file will be deleted")
-}
-
```
````

## UDiff Settings

Agents can be configured with specific UDiff settings:

```yaml
udiff:
  enabled: true
  contextLines: 3
  createMissingFiles: true
  allowFileRemoval: false
```

- **enabled**: Whether to process UDiffs in agent output
- **contextLines**: Number of context lines to include around changes
- **createMissingFiles**: Allow creation of new files
- **allowFileRemoval**: Permit deletion of existing files

## Best Practices

For optimal UDiff usage:

1. **Include sufficient context**: Provide enough surrounding lines for proper placement
2. **Use relative paths**: Ensure file paths are relative to repository root
3. **Binary files**: Avoid UDiffs for binary files; use base64 encoding if necessary
4. **Large changes**: Break large changes into smaller, logical UDiffs
5. **Rename operations**: Represent renames as a deletion and creation

## Troubleshooting

Common UDiff issues and solutions:

**"Failed to apply patch"**
- Verify file paths are correct
- Ensure context lines match the actual file
- Check if line numbers need adjustment

**"Hunk failed to apply"**
- The file may have changed since the UDiff was generated
- Increase context lines for better matching
- Update the UDiff based on current file state

**"No valid UDiffs found"**
- Check the formatting of your UDiff blocks
- Ensure triple backticks and `diff` language specifier are included
- Verify the UDiff follows standard format