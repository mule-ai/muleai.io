# Mule Website Improvement — Run Summary

**Project**: muleai.io (Hugo + lotusdocs)
**Spec**: `site-improvement-spec.md` (evergreen) · **Plan**: `site-improvement-plan.md` (all checkboxes complete)
**Final runs**: Nov 21, 2026 (audit-only run + verification/summary run)

## Overview

This cycle of the evergreen site-improvement spec addressed the owner-reported
UX defects first, then audited docs accuracy against the sibling `../mule`
implementation, fixed broken things, and improved SEO metadata:

- **Homepage blank sections** — all four homepage sections (Key Features,
  Powerful Capabilities, Latest from the Mule Blog, CTA) were verified to
  populate with real content; no empty shells remain. The static root
  `index.html` is now kept in sync with the Hugo-rendered homepage via
  `build.sh`, eliminating stale/conflicting renders.
- **Blog filtering simplified** — `layouts/blog/list.html` was reduced from a
  500+ line custom implementation to a ~232-line template: newest-first
  default, a single search box, and compact top-10 tag chips, with dead
  CSS/JS stripped.
- **Stale featured posts fixed** — featured selection is now derived from the
  most recent posts in the template (hard 30-day recency), so pre-2026 posts
  can never appear as featured. At final verification only the two newest
  posts (2026-11-21) carried `featured: true`.
- **Docs accuracy** — documentation was corrected against the real `../mule`
  implementation: fabricated built-in skills removed and the real skill
  lifecycle documented; settings and git/GitHub WASM module docs corrected;
  the nonexistent `api.muleai.io` host replaced with `localhost:8140` in
  policy-engine and voice-loop examples.
- **Broken links** — repaired `.md`-suffixed internal blog links; scripted
  checks of all 418 rendered pages confirmed 0 broken internal hrefs/srcs.
- **SEO/discoverability** — docs pages branded correctly with a custom docs
  head partial, `/docs/` and `/blog/` index metadata and tags filled, and
  titles/descriptions added where missing.
- **Final audits** — `hugo` (v0.144.2) builds cleanly (682 pages, 375 static
  files, 0 warnings); all pages have title/description, no placeholder text,
  no images missing alt text; `../mule` routes/migrations spot-checked and
  matched the docs.

## Files Changed / Created (key items)

**Created**
- `SUMMARY.md` — this file
- `build.sh` — Hugo build + static homepage resync
- `layouts/partials/docs/head.html` — docs SEO/OG head partial
- `SUMMARY-site-improvement.md`, `progress.md`, `site-progress.md` — run logs

**Templates / config**
- `layouts/blog/list.html` — simplified filtering (500+ → ~232 lines)
- `config.toml` — site/SEO metadata additions (lotusdocs module import preserved)
- `index.html` (root) — re-synced from Hugo output via `build.sh`

**Content (docs)**
- `content/docs/Settings/skills.md` — rewritten against real implementation
- `content/docs/Settings/general.md`, `content/docs/Settings/_index.md`,
  `content/docs/Settings/tools.md` — corrected/SEO metadata
- `content/docs/Advanced/policy-engine.md`, `content/docs/Advanced/voice-loop.md`
  — fixed defunct API host in examples
- `content/docs/Repositories/adding-a-repository.md`,
  `content/docs/Tutorials/git-integration.md`, `content/docs/Tutorials/_index.md`
  — corrected against implementation / SEO
- `content/docs/_index.md`, `content/blog/_index.md`, `content/blog/archive.md`
  — index metadata and tags

All changes were committed as author "Mule" with conventional commit messages
and pushed to `main` (final audit runs required no commits — working tree clean).

## Notable Decisions / Trade-offs

- **Featured posts derived in template, not hand-flagged** — hard recency
  derivation in the template was chosen over refreshing `featured: true`
  frontmatter each run, so staleness is structurally impossible.
- **Spot-check over full re-audit** — `../mule` was unchanged since the
  Nov 17 full comparison (last commit 2026-10-24), so later runs used
  route/migration spot checks instead of a full docs re-audit.
- **False-positive link reporting** — the initial link checker flagged 417
  "broken" refs, all markdown text inside `data-summary` attributes; the
  extractor was refined to match only real anchor attributes.
- **External 403s accepted as clean** — reddit/linkedin share-intent
  endpoints bot-block curl by design and were not treated as broken links.
- **Blog posts untouched by this workflow** — new posts are owned by
  blog-automation; this spec only touched post metadata/typos.
- **progress.md vs site-progress.md** — per-run checkbox logs go to
  `progress.md` (gitignored); the longer narrative log lives in
  `site-progress.md`.

## Final Outcome

**Spec fully satisfied.** All Phase 0/1/2/3 plan items are checked:

- Hugo builds cleanly with zero warnings; root `index.html` verified
  identical to Hugo output (clean git tree).
- No blank homepage sections, simplified blog filtering, and featured posts
  guaranteed within the 30-day window.
- Docs verified accurate against `../mule`; 0 broken internal links; full
  SEO metadata coverage.
- Improvements committed as "Mule" with conventional messages and pushed to
  `main`; run summaries appended to `progress.md`.

Nothing is deferred. Per the evergreen spec, the next run resets the plan
checkboxes and re-audits from the top.
