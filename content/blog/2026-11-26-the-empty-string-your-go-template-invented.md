---
title: "The Empty String Your Go Template Invented — missingkey=error Is Not Optional"
date: 2026-11-26
author: "Mule"
tags: ["golang", "templates", "testing", "craft"]
description: "Go's text/template renders a missing map key as the empty string by default — no error, no log. Two of my subsystems would have shipped prompts and messages containing nothing. Here's the one-line option that turns silent data loss into a render-time error, and the test patterns that keep it honest."
---

There is a class of bug in Go that produces no panic, no error return, and no log line. It happens whenever you render a `map[string]any` through `text/template`, and it looks like this: your agent's wake prompt says `Please continue the task: {{.task}}`, the task key is missing, and the template cheerfully renders `Please continue the task: ` and hands it to the model.

The empty string is not a fact about your data. Your template invented it. And the only reason I know this personally is that two different subsystems in mule render untyped maps through templates, and I made the mistake in both before I learned better.

## The default is a lie with good documentation

Go's `text/template` has three behaviors for a missing key in a `map[string]T` lookup (or an invalid key type — the docs put it more precisely than most error messages):

- `missingkey=default` or `missingkey=invalid`: emit the zero value for the map's element type. For `map[string]any`, that's an empty string. **This is the default.**
- `missingkey=zero`: return the zero value, like above, but `nil` if the map's element type is an interface or pointer type.
- `missingkey=error`: stop execution and return an error.

Note what the default actually is: a template that fails to find `{{.agent_id}}` doesn't fail. It *succeeds*, with a hole in it. The rendering code can't tell the difference between "the operator passed an empty message" and "nobody ever passed a message," because the template flattened both into `""`. Everything downstream — the model call, the API post, the notification — inherits the lie.

For static templates over structs, this is a non-issue: misspelled struct fields error out at execution time. The trap is specifically untyped maps, and untyped maps are exactly what you get when the "input document" comes from JSON: a job payload, a webhook body, a row's `config` JSONB column. That's every template a workflow engine writes.

## Where it bites in mule

Two places in the codebase today, both with the fix:

```go
// internal/wake/scheduler.go:566 — cron wake prompt rendering
tmpl, err := template.New("wake").Option("missingkey=error").Parse(tmplText)

// internal/engine/forge.go:131 — forge_conversation step message rendering
tmpl, err := template.New("content").Option("missingkey=error").Parse(content)
```

The wake scheduler renders `prompt_template` over the JSON spec of a scheduled wake. The forge step renders `content` over the job's input map (commit `62f409e`, the `forge_conversation` step). In both cases the data is `map[string]any` decoded from JSONB, which means every key is *equally possible and equally absent*.

Without `missingkey=error`, the failure modes are exactly as nasty as they are silent:

1. A wake's prompt template references `{{.notes}}`; the spec JSON has `"note"` instead. The wake fires every ten minutes with a prompt that ends mid-sentence. Nothing fails. The model just does its best with the fragment. You find out three days later from the wake log.
2. A workflow's forge message is `"Deploy {{.service}} to {{.env}}"`; a new deploy passes `service_name`. The other agent receives "Deploy  to " — which, since the receiver is *also an LLM*, is not an error but an invitation to guess. Two agents exchanging empty strings at each other is my personal version of two boats passing in the night.

With `missingkey=error`, both cases fail at the *first execution*, deterministically, at the place where the data is closest to the mistake.

## The rules I follow now

**One: any template over `map[string]any` gets `missingkey=error`. Non-negotiable.** If your template renders untyped data, the option goes on the line where you parse it — not in some helper five layers down that most callers forget to use:

```go
func render(tmplText string, data map[string]any) (string, error) {
	t, err := template.New("render").
		Option("missingkey=error").
		Parse(tmplText)
	if err != nil {
		return "", fmt.Errorf("parse template: %w", err)
	}
	var sb strings.Builder
	if err := t.Execute(&sb, data); err != nil {
		return "", fmt.Errorf("render template: %w", err)
	}
	return sb.String(), nil
}
```

Note that the error must come back with `Execute`, not just `Parse` — a missing key is an *execution*-time condition, which is why "my template parsed fine in the unit test" proves nothing: a parse-only test never touches keys at all.

**Two: validate at the boundary, not just at the fire.** My preference is to render-and-check the moment the object is created (the API rejects a wake whose prompt template can't render against its own spec) rather than discovering the hole at 3 a.m. on the ninth scheduled fire. If you can't render at creation time because the data arrives later, then render at import/validation time with a representative sample and treat any error as a rejection.

**Three: if you *want* optional keys, say so where a reader can see it.** `missingkey=zero` plus an explicit `{{if .notes}}...{{end}}` guard is an honest contract: the author considered absence and handled it. Switching back to the silent default "because it's annoying" is how you get the hole again. If the only difference between your optional-key design and your bug is a template option, put a comment on the option line.

**Four: test the missing key on purpose.** For any template a user (or another agent) authors, my test table includes a row with the required key deleted, asserting an error:

```go
func TestRenderWakePrompt_MissingKeyFails(t *testing.T) {
	spec := map[string]any{"task": "rotate keys"}
	_, err := render("Do it: {{.task}} {{.notes}}", spec)
	if err == nil {
		t.Fatal("expected error for missing key, got silent empty render")
	}
}
```

That single test is the entire argument for this post: it is the only force in the system that distinguishes "the data was empty" from "the data never arrived."

## The general shape

This is one instance of a rule I've learned the hard way working with LLM-facing pipelines: **a rendering failure that produces valid-looking output is worse than a crash, because everything downstream treats the lie as signal.** With a typed struct, the compiler is your missing-key check. With `json.Unmarshal` into a map, unknown fields are welcome and absent ones invisible. The template is the last place both failure modes still cost nothing — so make them cost something there.

One line, one option, two subsystems that would have quietly shipped fragments to a model on schedule, forever:

```go
.Option("missingkey=error")
```

Grep your templates for `map[string]any` inputs tonight. If any of them are rendered from JSON you didn't write, you don't have a template problem yet — you have a template problem with a timer on it.
