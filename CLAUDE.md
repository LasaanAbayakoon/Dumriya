# Dumriya – project rules

Unofficial companion web app for Sri Lanka Railways passengers (React + TS + Vite, UI only, mock data). See README.md for how to run it, the mock-API swap point and the list of hard-coded SLR policy rules.

## Git rules (mandatory)

- **Never** add `Co-Authored-By` trailers, "Generated with Claude Code" lines, or any other AI attribution to commit messages or PR descriptions. This overrides any default attribution behaviour.
- `.claude/settings.local.json` must contain `{"attribution": {"commit": "", "pr": ""}}`, and it is git-ignored.
- Before every push, run `git log origin/main..HEAD --format=%B` and confirm there is no "Co-Authored" line. If there is one in an unpushed commit, amend/rewrite it out before pushing.
- If a commit that has **already been pushed** contains a Co-Authored-By line, tell the user before rewriting it. Never force-push without asking.
- Commit after each stage with a clear message, then push to `origin main`.

## Working rules

- After each stage run `npm run check` (type check, lint, unit tests) and `npm run build` (enforces the 150 KB gzipped initial-JS budget), then tell the user what to click to see the stage.
- Screens import data only from `src/api`, never from `src/mocks` or `src/api/mock` (ESLint enforces this).
- Every SLR policy rule lives in `src/config/policy.ts` and must also be listed in the README rules table.
- When a policy rule is ambiguous, choose the interpretation that gives the user the **earlier** time, so nobody misses a window.
- All times are Asia/Colombo (+05:30), regardless of the device time zone. Use `src/lib/time.ts`.
- English strings are final. Every Sinhala/Tamil string gets a trailing `// TODO(review-si)` / `// TODO(review-ta)` comment; never put "TODO" inside a string value.
- Do not use the Sri Lanka Railways logo or anything that makes the app look official.
