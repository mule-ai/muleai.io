# Site Improvement Run — Summary

Dates: Nov 15–17, 2026 · Spec: `site-improvement-spec.md` · Plan: `site-improvement-plan.md` · Log: `site-progress.md`

## Overview

Two coordinated automation runs executed the evergreen site-improvement
plan for muleai.io (Hugo + lotusdocs):

- **Phase 0 (owner-reported UX defects)**
  - *Homepage empty sections*: audited the rendered homepage with an
    HTML-parser audit — all four sections (Key Features, Powerful
    Capabilities, Latest from the Mule Blog, CTA) populate; no empty
    shells remain. Root `index.html` confirmed in sync with the
    Hugo-rendered homepage.
  - *Blog filtering*: `layouts/blog/list.html` rewritten from a 500+ line
    custom implementation to 232 lines — newest-first default, one search
    box (`/` to focus), compact top-10 tag-chip filter, no-results/reset
    states, and stripped dead CSS/JS.
  - *Stale featured posts*: featured content is now derived in-template
    from the 3 newest posts with a hard 30-day cutoff; all hand-maintained
    `featured: true` frontmatter was removed, so no pre-2026 post can ever
    appear as featured again.
- **Phase 1 (audit)**: clean `hugo` v0.144.2 build (646 pages, zero
  warnings); full docs-vs-`../mule` comparison (API routes incl. `/ws` and
  `/voice/*`, wake kinds, pi RPC bridge methods, file-ops tool actions,
  migrations 0001–0016 — all matched); scripted internal-link check
  (0 broken) plus external-link sample (all live).
- **Phase 2 (improvements)**: corrected the docs gaps the audit surfaced —
  primarily the Skills page, which documented fabricated "built-in" skills
  at host-specific paths; rewrote it against `internal/manager/skill.go`
  to document the real lifecycle (owner-scoped DB records → `--skill`
  flags to pi, `skill_ids` on agents, response envelopes, SKILL.md
  frontmatter). Also corrected settings, git/GitHub WASM module, and
  repository docs, and improved SEO metadata on three pages.
- **Phase 3 (verify & publish)**: every change rebuilt cleanly via
  `./build.sh`; all work committed as author "Mule" with conventional
  commit messages and pushed to `main`.

## Files Changed / Created

**Created**
- `build.sh` — runs `hugo` then resyncs the static root `index.html` so it never drifts from Hugo output
- `site-improvement-spec.md`, `site-improvement-plan.md`, `site-progress.md` — spec, plan, and per-run progress log
- `SUMMARY.md` — this file

**Changed**
- `layouts/blog/list.html` — simplified filtering (500+ → 232 lines), template-derived featured posts with 30-day cutoff
- `index.html` — resynced from Hugo-rendered homepage (via `build.sh`)
- `content/docs/Settings/skills.md` — rewritten against the implementation (fixes fabricated built-in skills; +126/−79)
- `content/docs/Settings/general.md`, `content/docs/Settings/_index.md` — corrected settings docs
- `content/docs/Tutorials/git-integration.md` — corrected git/GitHub WASM module docs
- `content/docs/Repositories/adding-a-repository.md` — corrected against implementation
- `content/docs/Tutorials/_index.md`, `content/docs/Settings/tools.md`, `content/blog/archive.md` — SEO title/description/tags improvements
- `content/blog/2026-11-15-no-mcp-no-daemon-just-json-lines.md` — meta description fix

Key commits (author "Mule", pushed to `main`): `8435ff8`, `e095aa1`,
`c3e357f`, plus `build.sh`/homepage-sync chores `8709fbf`, `0954ab5`,
`0eec7cc`.

## Notable Decisions & Trade-offs

- **Derived featured over hand-flagging**: featured is computed from the
  3 newest posts in the template with a 30-day cutoff instead of curated
  frontmatter — permanently fixes staleness at the cost of manual
  curation.
- **Prefer deleting wrong docs over speculating**: the fabricated
  built-in-skills claims were removed and replaced only with statements
  verified in `../mule` source, per the spec's constraint.
- **Static root `index.html` kept, not eliminated**: it's required as a
  pre-built homepage, so the fix was a `build.sh` chore to keep it a
  byte-accurate copy of Hugo output rather than touching its content.
- **No JS where Hugo/CSS suffices**: blog filtering kept minimal and
  server-rendered where possible.
- **Blog posts untouched for content**: only metadata/typo fixes, since
  blog writing is owned by blog-automation.

## Outcome

All Phase 0–3 plan checkboxes are complete: the three owner-reported UX
defects are fixed or verified fixed, the Hugo build is clean, the docs
audit against `../mule` found and repaired the significant Skills-page
inaccuracy, no broken links remain, SEO metadata is complete on all 33
docs pages and the 40 newest posts, and everything is committed and
pushed to `main`.

The spec itself is **evergreen** and intentionally never "completes" —
this run fully satisfied the current plan, with one low-priority item
deferred and recorded in `site-progress.md`: a deeper line-by-line audit
of the remaining Advanced pages (RAG, validation, multi-agent,
integrations) where no staleness is currently known.
