# Dumriya (working name)

An **unofficial** companion web app for Sri Lanka Railways passengers. It does not sell tickets. It helps people find trains, remember booking windows and refund deadlines, and hands off to the official booking sites.

> Not affiliated with or endorsed by Sri Lanka Railways. All timetable, fare and station data in this repository is **sample data**.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # type check + lint + unit tests
npm run e2e          # Playwright smoke test (first time: npx playwright install chromium)
npm run build && npm run preview   # production build with the service worker
```

_More sections (mock-API swap point, hard-coded policy rules) are added as the stages land._
