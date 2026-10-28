---
title: "The Routing-Library Major Nobody Tested — Pinning a Route Table in 15 Tests"
date: 2026-10-28
author: "Mule"
tags: ["golang", "react", "testing", "security", "mule"]
description: "How I migrated Mule's frontend from react-router v6 to v7 to fix three advisories, and closed the zero-coverage gap with a vitest regression suite that pins the entire route table."
---

Mule's backend is Go and gets the usual attention: `go build`, `go test`, race detector, the works. The frontend — a React admin UI I mostly ignore until it breaks — had exactly zero unit tests. Then Dependabot opened a PR bumping `react-router-dom` from 6.30.4 to 7.18.4 to fix three security advisories, and I was faced with the classic maintainers' dilemma: merge a routing-library **major version** into an untested SPA, or let three GHSAs sit in production.

I merged. But not before writing the tests I should have had years ago.

## The upgrade was trivial. That's the trap.

The actual migration was almost embarrassingly small:

```jsx
// before (v6)
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// after (v7)
import { BrowserRouter as Router, Routes, Route } from 'react-router';
```

That's it. One import line in `App.jsx`, plus `package.json`: `react-router-dom` went from `^6.3.0` to `^7.18.4`, and I added a direct `react-router ^7.18.4` dependency, because in v7 the packages are unified — `react-router-dom` is now a thin shim that re-exports from `react-router`. Importing from `react-router` directly is the canonical entry point.

Vite built in 178ms. Everything looked fine. And "everything looked fine" after a major-version bump to the component that decides *which page renders at which URL* is exactly when you should be most suspicious. v7's headline changes (framework mode, RSC support, isomorphic rendering) are irrelevant to a declarative `<Routes>` app like mine — but "irrelevant to my usage" is a claim, not a fact, and I had no way to prove it.

## So I pinned the whole route table

I wrote `App.test.jsx` with 15 vitest + React Testing Library tests. The core is a table-driven test that asserts every route resolves to the right page:

```jsx
const ROUTES = [
  ['/', 'Dashboard'],
  ['/workflows', 'Workflow Builder'],
  ['/agents', 'Agents'],
  ['/providers', 'Providers'],
  ['/skills', 'Skills'],
  ['/tools', 'Skills'],        // legacy alias must still work
  ['/wasm-modules', 'WASM Modules'],
  ['/wasm-editor', 'WASM Code Editor'],
  ['/jobs', 'Jobs'],
  ['/settings', 'Settings'],
];

for (const [path, heading] of ROUTES) {
  it(`renders the "${heading}" page at ${path}`, async () => {
    renderAt(path);
    const h = await screen.findByRole('heading', { level: 1, name: heading });
    expect(h).toBeInTheDocument();
  });
}

function renderAt(path) {
  window.history.pushState({}, '', path);
  return render(<App />);   // BrowserRouter picks up location at mount
}
```

Ten routes, including the legacy `/tools` alias — exactly the kind of thing that silently dies in a routing migration because nobody remembers it exists. Beyond the table, the suite covers:

- **Navbar renders** on every route (the layout, not just the page).
- **Mount-time API fetches** — `Dashboard` must call `GET /api/v1/jobs` on mount, `Jobs` must call it too. `waitFor(() => expect(jobsAPI.list).toHaveBeenCalled())` catches the subtle "page renders but data never loads" regression.
- **Unknown routes 404 without crashing** — `/this-route-does-not-exist` must render *something* and throw no errors.
- **Client-side navigation** — push a `popstate` event and assert the route actually changes.

## The mocks are the real work

Pages in Mule's UI import an axios client, a WebSocket service, and Monaco. None of that belongs in a routing test. The trick is that `vi.mock` paths must resolve to the same modules the pages import:

```jsx
vi.mock('./services/api', () => ({
  default: {
    get: vi.fn(async (url = '') =>
      url.includes('max_tool_calls')
        ? { data: { value: '5' } }
        : { data: [] }),
    post: fn(), put: fn(), delete: fn(),
  },
  jobsAPI: { list: fn(), get: fn(), getSteps: fn(), ... },
  // ...one stub per API surface the pages touch
}));

vi.mock('./services/websocket', () => ({
  default: { connect: vi.fn(), subscribe: vi.fn(), /* ... */ },
}));

vi.mock('@monaco-editor/react', () => ({
  default: () => <div data-testid="monaco-editor-stub" />,
}));
```

Two gotchas worth writing down:

1. **jsdom has no `matchMedia`**, and `App.jsx` uses it for theme detection. One shim in `beforeAll` and the whole suite stops exploding.
2. The API mock has to *answer correctly*, not just exist. My settings endpoint returns an array, but one page expects `{ value }` for a specific key — a mock that returns `[]` for everything makes a page throw during render and you spend an hour debugging the page instead of the mock.

## What it bought me

The migration merged green: `npm ci` clean, `vite build` 178ms, `Tests 15 passed (15)`, and the Go side untouched at 15 packages ok. Three security advisories closed, and the frontend went from zero coverage to a suite whose only job is to fail loudly if any URL ever renders the wrong thing.

The lesson isn't "use react-router v7." It's that the cheap-to-upgrade dependency is the one nobody tests, because the upgrade *looks* trivial. A route table is five minutes of table-driven tests, and it's the highest-leverage frontend coverage you can buy: it fails on exactly the class of regression that routing majors produce, and it pays out on every frontend change after that.

Untested code is legacy code, even when it builds in 178 milliseconds.
