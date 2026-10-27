# Dumriya (working name)

An **unofficial** companion web app for Sri Lanka Railways passengers. It does not sell tickets. It helps people find trains, remember booking windows and refund deadlines, and hands off to the official booking sites.

> Not affiliated with or endorsed by Sri Lanka Railways. All timetable, fare, station and live data in this repository is **sample data**.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # type check + lint + unit tests
npm run e2e          # Playwright smoke test (first time: npx playwright install chromium)
npm run build && npm run preview   # production build with the service worker
```

`npm run build` prints the initial JS size and **fails if it exceeds 150 KB gzipped** (see `build/bundleBudget.ts`).

## Data layer and the mock-API swap point

Screens only ever import from `src/api` (enforced by ESLint: importing `src/mocks/*.json` or `src/api/mock` from a screen is a lint error).

```
src/api/contract.ts   DumriyaApi interface – the contract the backend must meet
src/api/index.ts      ← SWAP POINT: `const api: DumriyaApi = mockApi;`
src/api/mock/         mock implementation (fake 150–450 ms delay, deep-copied results)
src/mocks/*.json      SAMPLE DATA – each file carries a "_notice" saying so
```

To connect the FastAPI backend: add `src/api/http.ts` exporting an object that implements `DumriyaApi`, then change the one line in `src/api/index.ts`. The tests in `src/api/api.test.ts` describe the expected behaviour (direction, running days, night trains crossing midnight, time filter) and can be pointed at the real implementation.

All times are handled in **Asia/Colombo (+05:30, no DST)** regardless of the phone's time zone (`src/lib/time.ts`).

## Sri Lanka Railways rules hard-coded in this app

> ⚠️ **These rules were taken from public SLR / seat-reservation FAQ information and must be re-checked against the official FAQ before every release.** They all live in [`src/config/policy.ts`](src/config/policy.ts); keep this list in sync with that file.

| Rule | Value | Constant |
|---|---|---|
| Reservations open before the date of travel | 30 calendar days (Asia/Colombo date) | `BOOKING_WINDOW_DAYS` |
| "Date of travel" for the 30-day window | **Assumed, conservative, verify with SLR.** The date the train leaves its **origin**. If the passenger boards on a later calendar date (night train after midnight), both possible opening dates are shown and reminders use the earlier one | `BOOKING_WINDOW_DAYS` |
| Time of day booking opens | **Not confirmed** – `null`, so the UI shows the date only with a "time not confirmed" note | `BOOKING_OPEN_TIME` |
| Online booking closes before departure | 2 hours | `BOOKING_CLOSE_HOURS_BEFORE` |
| Which departure the 2 hours count from | **Assumed, conservative, verify with SLR.** The train's **origin** station departure; UI says "may be later from your station". Boarding-station rule available as an option, off by default | `BOOKING_CLOSE_USE_BOARDING_STATION` |
| Max seats per online booking | 5 | `MAX_SEATS_PER_BOOKING` |
| Return trip with a different passenger count or boarding station | needs a separate booking | (booking helper logic) |
| Online convenience fee | 5 % of fare | `CONVENIENCE_FEE_RATE` |
| Payment methods | Card or LANKAQR only | `PAYMENT_METHODS` |
| Valid email required | e-ticket is only sent by email | `EMAIL_REQUIRED_FOR_ETICKET` |
| ID per passenger | NIC or passport number for every passenger | `ID_REQUIRED_PER_PASSENGER` |
| Transferability | Tickets are non-transferable; ID checked at the gate | `TICKETS_TRANSFERABLE` |
| ID mismatch penalty | Double fare | `ID_MISMATCH_PENALTY_FARE_MULTIPLIER` |
| Refund, more than 168 h before departure | 75 % of fare | `REFUND_TIERS` |
| Refund, 168 h or less and more than 48 h | 50 % of fare | `REFUND_TIERS` |
| Refund, 48 h or less | 0 % | `REFUND_FALLBACK_PERCENT` |
| Refund boundaries | Exactly on a boundary → the **lower** refund | `REFUND_TIERS` |
| Service charge | Never refunded | `SERVICE_CHARGE_REFUNDABLE` |
| How refunds are done | In person at a station counter, with an NIC/passport copy | `REFUND_IN_PERSON_ONLY`, `REFUND_DOCUMENTS` |
| Temporary warrant reservation expiry | 7 days after booking **or** 48 h before the journey, whichever is first; must be confirmed at a station | `WARRANT_EXPIRES_DAYS_AFTER_BOOKING`, `WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY` |
| Pravesha commuter tickets | Can be bought up to 7 days in advance | `PRAVESHA_ADVANCE_DAYS` |
| Payment dispute | Official site → Contact Us → dispute type "Payment issue" | `DISPUTE_TYPE_LABEL` |

**Ambiguity rule:** where SLR's wording is ambiguous, the app picks the interpretation that gives the user the **earlier** time, so nobody misses a window. Rows marked "assumed, conservative" above are such interpretations and must be confirmed with SLR.

## Official links

Only these destinations are used for booking (`src/config/links.ts`):
- Reserved seats: `https://seatreservation.railway.gov.lk`
- Commuter tickets (Pravesha): `PRAVESHA_URL` – **TODO: fill in**. While it is `null`, the app hides the Pravesha button and points users to the station counter.

## Map tiles

Tile URL and attribution are in `src/config/app.ts` (`MAP_TILE_URL`, `MAP_TILE_ATTRIBUTION`). The OSM standard tile server is for light use only; switch provider before public launch.

## Booking-opens reminders

While `BOOKING_OPEN_TIME` is `null`, a "Remind me when booking opens" reminder uses these alerts (all in [`src/config/app.ts`](src/config/app.ts)):

| Alert | Default | Constant |
|---|---|---|
| Heads-up the evening **before** the earliest possible opening date: "Booking may open tomorrow for &lt;train&gt; on &lt;date&gt;. Exact time not confirmed." | 20:00, always on | `BOOKING_HEADS_UP_TIME` |
| Optional alert at the start of the opening date (toggle: "Also alert me at midnight (seats on popular trains can sell out within minutes)") | 00:00, **off** | `BOOKING_MIDNIGHT_ALERT_TIME`, `BOOKING_MIDNIGHT_ALERT_DEFAULT` |

When `BOOKING_OPEN_TIME` is set, a single alert fires at the exact opening time instead. Alerts already in the past are dropped. The `.ics` calendar export contains one event per alert at exactly the same times (tested in `src/lib/reminders.test.ts`).

## Dates and times

- Times are always `HH:mm` (24 h, Asia/Colombo) in every language, matching tickets and timetables.
- Dates are built from month/weekday names in the translation files (`format.date`, `format.months`, `format.weekdaysShort`), **not** from the browser's `Intl` data: many Android WebViews ship without Sinhala/Tamil locale data and silently show US English. The Sinhala date order (`{{year}} {{month}} {{day}}, {{weekday}}`) needs native review.

## Translations

English (`src/i18n/en.ts`) is final. Sinhala (`si.ts`) and Tamil (`ta.ts`) are drafts: every line carries a `// TODO(review-si)` / `// TODO(review-ta)` comment for a native speaker to remove once checked. The type checker enforces identical keys; tests fail if any string *value* contains "TODO". Sinhala/Tamil station names in `src/mocks/stations.json` also need review.
