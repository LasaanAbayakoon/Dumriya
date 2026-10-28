# Decisions

Short records of choices that someone might otherwise "fix" by mistake. Newest first.

## 2026-10-28 · npm audit warnings left in place (build-time only)

**What:** `npm audit` reports 4 low-severity issues, all from one advisory: [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) ("deepmerge `mergeObject()` allows prototype poisoning of returned objects").

**Where it comes from:** `vite-plugin-pwa@2.0.0` → `workbox-build@7.4.1` → `@rollup/plugin-node-resolve@16.0.3` → `deepmerge@4.3.1`.

**Why it is not a risk to users:** this chain runs only on the developer's machine during `npm run build`, to generate the service worker. `deepmerge` is not in the bundle shipped to phones, and the only input it merges is our own build config, never user or network data.

**Why not `npm audit fix --force`:** checked with `npm audit fix --force --dry-run`, it would **downgrade** `vite-plugin-pwa` from 2.0.0 to 0.2.1, an old release that predates Vite 8, and add a batch of old transitive packages. That would break the build and the offline service worker the ticket wallet depends on, to silence a warning that has no effect on the app.

**Revisit when:** `workbox-build` or `vite-plugin-pwa` publishes a release with a fixed `deepmerge`. Upgrade normally then (exact versions are pinned).

## 2026-10-28 · Test tooling

- **happy-dom instead of jsdom** for unit tests: the full suite went from about 9 s to about 6 s with all tests passing. Real-browser behaviour is covered by the Playwright tests.
- **`setupUser()`** (`userEvent` with `delay: null`) instead of driving `userEvent` with fake timers: it was faster (dispute tests 3.2 s vs 4.4 s), and fake timers let a frozen `vi.setSystemTime` drift during typing.
- **Vitest's on-disk module cache stays on** (about 5 % faster). The source-scanning guard reads `src/` from disk at run time (`build/source-guards.test.ts`), so the cache cannot hide new files from it.
- **Default `forks` pool:** `threads`, `vmThreads` and `vmForks` measured within noise.

## Earlier

Ambiguous Sri Lanka Railways rules always take the interpretation that gives the user the **earlier** time; each one is marked "assumed, conservative, verify with SLR" in the README rules table.
