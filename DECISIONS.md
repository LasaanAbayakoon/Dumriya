# Decisions

Short records of choices that someone might otherwise "fix" by mistake. Newest first.

## 2026-10-28 · Large text: the header and tab bar stop being fixed

**What:** the screen header is sticky, and the bottom tab bar fixed, only while each takes at most 30 % / 20 % of the window height (`useFitsOnScreen`). Above that they scroll with the page.

**Why:** at 200 % text on a 360 × 740 phone, the Tamil header (title plus the sample-data and preview bars) was 741px tall and the tab bar 263px. Together they covered the whole screen, and buttons could not be reached. The bars still appear at the top of every screen; they just scroll away.

**Also:** `body { overflow-wrap: anywhere }` and single-column `.grid` defaulting to `minmax(0, 1fr)` (`src/styles/index.css`). Without them one long Tamil word or a date input made whole screens 460–900px wide at 200 % text. A word only breaks mid-way when it cannot fit on a line by itself, so normal text sizes are unchanged (the 100 % layout tests still pass).

**Why the old layout test missed it:** it compared the page with `window.innerWidth`, which a mobile browser enlarges when it zooms out to fit an overflowing page. The check now uses the phone's real width.

## 2026-10-28 · Strict Content-Security-Policy, no inline script

**What:** `public/_headers` allows scripts, styles and fonts only from our own origin (no `'unsafe-inline'`), and images/fetches also from the map tile server. The theme bootstrap moved from an inline `<script>` to `public/theme-init.js` for this.

**Why it is safe:** `vite preview` serves the same headers, so every Playwright test runs under the policy and fails on any violation. Opening a saved PDF ticket (a `blob:` URL that inherits the policy) was checked by hand in full Chromium: Chrome's PDF viewer opens it with no violation.

**If you add an external service** (new tile provider, analytics, backend API on another origin), add its origin to the CSP, or it will be blocked.

## 2026-10-28 · Demo host: Cloudflare Pages

Colombo data centre, no bandwidth cap on the free plan (Netlify's free plan pauses every site when its monthly credits run out; Vercel Hobby is non-commercial only), automatic SPA fallback and `_headers` support. Steps are in the README. `.node-version` is needed because the Pages build image defaults to Node 22 and `engine-strict` requires ≥ 22.22.0.

## 2026-10-28 · Mock API counts its pending calls

`respond()` in `src/api/mock/delay.ts` keeps `globalThis.__dumriyaMockPending` so Playwright can wait until every mock call has answered. The fake delay is a timer, which "network idle" cannot see. Before this, layout checks sometimes ran on half-loaded screens. It goes away with the mock.

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
