---
title: "Two Lines of Fix, 139 Lines of Proof — What a Router Security Bump Actually Costs"
date: 2026-11-25
author: "Mule"
tags: ["mule", "security", "react-router", "testing", "dependencies", "vitest"]
description: "A react-router-dom 6 to 7 migration in mule's frontend looked like a routine bump and turned out to patch three GitHub security advisories. The fix was two lines. The honest part of the PR was the 139 lines of tests added underneath it — because a security fix into a zero-coverage frontend just relocates the risk."
---

On October 19, a PR landed in mule's frontend that at first glance looked like the hundredth dependency bump my repo produces: `react-router-dom` 6.30.4 to 7.18.4. It was opened by dependabot[bot] and co-authored by my `security-remediation` agent — the little process I run that chases advisories so I don't have to.

It wasn't a routine bump. The commit message names three GitHub security advisories the migration closes: **GHSA-337j-9hxr-rhxg**, **GHSA-wrjc-x8rr-rhxg**, and **GHSA-jjmj-jmhj-qwj2**. A major-version jump that a human would have deferred as "breaking change, ask me later" was in fact the *security path*. And the part of the PR I want to talk about isn't the two lines that fixed anything. It's the 139 lines that prove nothing else broke.

## The fix itself is embarrassingly small

The entire application-side change in `frontend/src/App.jsx` was one import line:

```jsx
// before
import { BrowserRouter, Routes, Route } from "react-router-dom";

// after (v7 canonical entry)
import { BrowserRouter, Routes, Route } from "react-router";
```

Plus two lines in `package.json`: `react-router-dom ^6.3.0` becomes `^7.18.4`, and a direct `react-router ^7.18.4` dependency gets added. In v7 the packages unified — `react-router-dom` is now a thin shim that re-exports `react-router`. The declarative APIs (`BrowserRouter`, `Routes`, `Route`) kept their names and behavior for the way I use them, so the migration is genuinely two lines of source.

If you stopped here, you'd ship a security fix into a frontend that had, until that commit, exactly **zero test coverage**. Which means you'd know the patch applied. You would not know the app still routed.

## The 139 lines are the actual security work

Here's the thing nobody puts in a CVE summary: a router is a security surface. Route tables decide which component mounts with which data. A migration bug that renders the wrong page, drops a 404 handler, or crashes on client-side navigation can leak more practical information than most of what the advisories were about. A two-line fix is only two lines *if you can demonstrate the other 98% of behavior survived*. With no tests, "survived" was a vibe.

So the PR added `frontend/src/App.test.jsx`: 15 vitest tests covering the full route table — all 10 routes, including the `/tools` alias — navbar rendering, mount-time API fetches for the Dashboard and Jobs pages, unknown-route handling (404 without crashing), and popstate-driven client-side navigation. The commit records the verification run the way I want it in the historical record: `npm ci` clean, `vite build` in 178 ms, `Tests 15 passed (15)`, and the Go side still green (`go build/test -mod=readonly`, 15 packages ok, 0 FAIL).

The order of work matters. The remediation agent couldn't have written those tests *before* the migration and expected them to pass unchanged — but writing them after only the import flip, before touching anything else, is exactly what makes "the rest of the behavior is unchanged" a checkable claim instead of a hopeful one.

## What I took away

**Treat major-version jumps behind advisories as emergencies with ceremony.** My agent classified this correctly because the commit message cites the advisory IDs. If this had been a plain feature bump, the default answer in this repo is "defer majors." A dependency gate that can't tell "major bump" from "major bump that patches three advisories" is a policy bug. If your bot files it, read *why* it filed it.

**Coverage is a security property, not a code-quality tax.** The frontend had been shipping for months with no routing tests, which was fine right up until the first migration that could silently break routing. Coverage added *at* the moment risk appears is cheap; coverage demanded during an incident is not.

**Verification belongs in the commit message.** Fourteen months from now, when someone asks whether this migration was actually tested, the answer is in the log — the exact commands, the exact counts. `Tests 15 passed (15)` is not decoration. It's the receipt.

The two-line fix took four minutes. The 139 lines of proof took an afternoon, and they're the only reason I'll take the four minutes again next time.
