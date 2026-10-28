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
- Gate commits on the real exit code (`npm run check && npm run build && git commit …`). Never pipe the check through `grep`/`tail` in the same chain as the commit: the pipe hides a failure.
- Screens import data only from `src/api`, never from `src/mocks` or `src/api/mock` (ESLint enforces this).
- Every SLR policy rule lives in `src/config/policy.ts` and must also be listed in the README rules table.
- When a policy rule is ambiguous, choose the interpretation that gives the user the **earlier** time, so nobody misses a window.
- All times are Asia/Colombo (+05:30), regardless of the device time zone. Use `src/lib/time.ts`.
- English strings are final. Every Sinhala/Tamil string gets a trailing `// TODO(review-si)` / `// TODO(review-ta)` comment; never put "TODO" inside a string value.
- Do not use the Sri Lanka Railways logo or anything that makes the app look official.

## Backend

The Python backend lives in `backend/`. In this phase Claude is the **mentor and reviewer, not the author**: the backend must show the project owner's own Python skills.

1. Claude may write: Docker/Compose files, `pyproject.toml` tool settings, GitHub Actions config, `.env.example`, and the backend README.
2. The owner writes every `.py` file under `backend/app/` and `backend/tests/`. Claude does not write or edit these unless the owner types "show me" for a specific piece.
3. For each task: explain the new concept in 5 lines or fewer, give the task with clear acceptance criteria, then wait for the owner's code.
4. If the owner is stuck, give hints in three levels (nudge → specific pointer → near-solution), one level at a time, only when asked.
5. Review code in three groups: **Must fix** (bugs, security), **Should fix** (design, readability), **Nice to have**. Explain why for each point, then ask one question to check the main idea was understood.
6. The owner makes every backend commit, with their own messages. Claude does not run `git commit` for backend Python code.
7. The git rules above still apply: no Co-Authored-By or AI attribution anywhere.

Stack: Python 3.12+, uv, FastAPI + Pydantic v2, PostgreSQL 16 + PostGIS (Docker Compose), SQLAlchemy 2.0 typed style + Alembic (from stage B1), pytest + httpx, ruff. GitHub Actions runs ruff and pytest for `backend/` on push, with Postgres as a service container.
