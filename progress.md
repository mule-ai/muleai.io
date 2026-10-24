# Progress Report

## Mule AI Blog & Documentation Automation Run

**Started:** $(date)

---

### Notes


## Run: 2026-10-24

Published 2 posts (both committed as Mule, pushed to main; `hugo` build clean, 359 pages):

1. **Byte Order and the Silent Death of a Voice Call** (`2026-10-24-byte-order-and-the-silent-death-of-a-voice-call.md`, ~940 words) — Category 1 (Mule project work). Based on real mule commit `9f94474` (2026-10-16): WAV RIFF/WAVE/fmt_/data magics written big-endian-style through `LittleEndian.PutUint32` broke every mic call at STT; covers the test-that-pinned-the-bug, fakeforge never parsing the WAV, and the new `{"notice": …}` degraded-hop lane. Decided to fold the Go `encoding/binary` craft lessons into the war story rather than writing a separate category-3 post.
2. **IQuest-Q1 and the Rise of the Scaffold-Native Model** (`2026-10-24-iquest-q1-scaffold-native-model.md`, ~870 words) — Category 2 (AI news/research). Based on arXiv 2610.30949 (submitted 2026-10-22) + PR Newswire 2026-10-23. Facts verified via arxiv.org abstract, HF paper page, and PR fetch: 320B/15B MoE, ~29T tokens, 512K ctx, Stable SplitNorm/Muon/μP, claimed 1.93× vs Qwen3-30B-A3B baseline, multi-scaffold post-training (Claude Code, Codex), MOPD, model merging, Recursive MTP, IQuest-CLIBench. Efficiency/benchmark numbers explicitly framed as authors' claims — not independently verified.

Research notes:
- `git log --since="14 days ago"` in ../mule: strongest candidates were the WAV endianness fix (used), the cron scheduler cadence changes (`4ca7eb3`, `edaccad` — good future topic: "failed cron fires still advance cadence" / NULL next_due_at adoption), and the react-router v7 migration.
- No posts existed in content/blog/ on WAV/endianness/byte order or IQuest; last-30-days check trivially clean (previous posts end 2026-03-20 — note: ~7-month publication gap before this run).
- Tooling issue: search-cli skill's `./search` is actually at `/usr/bin/search`; `--summarize` is broken (bifrost 400: "could not auto resolve a provider"). Fetched pages raw instead.

Skipped: none. Post 2 not skipped — worthwhile topic found.
