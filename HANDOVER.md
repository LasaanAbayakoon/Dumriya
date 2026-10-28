# Handover: what is still "Not confirmed", "Sample" or TODO

Status at the end of the UI phase (Stage 11, 2026-10-28). Each item says where it lives and what the app shows meanwhile. Nothing here blocks the demo; all of it is labelled on screen.

## 1. Needs confirmation from Sri Lanka Railways

All rules live in [`src/config/policy.ts`](src/config/policy.ts) and in the [README rules table](README.md#sri-lanka-railways-rules-hard-coded-in-this-app). Until confirmed, each one uses the reading that gives the passenger the **earlier** time.

| # | Question for SLR | Constant | What the app does now |
|---|---|---|---|
| 1 | At what **time of day** do reservations open (e.g. 00:00)? | `BOOKING_OPEN_TIME` (`null`) | Shows the date only, with "Opening time not confirmed". Reminders: 20:00 the evening before, optional 00:00 alert. |
| 2 | For a night train, is the 30-day "date of travel" the date it leaves its **origin** or the date the passenger **boards**? | `BOOKING_WINDOW_DAYS` | Shows both possible opening dates and plans for the earlier one. |
| 3 | Do the 2 hours before online booking closes count from the **origin** departure or the passenger's **boarding station**? | `BOOKING_CLOSE_USE_BOARDING_STATION` (`false`) | Counts from the origin, adds "may be later from your station". |
| 4 | Do refund deadlines (168 h / 48 h) count from the **origin** departure or the **boarding station**? | `REFUND_COUNT_FROM_BOARDING_STATION` (`false`) | Counts from the origin and says so in words (refund calculator and saved tickets). |
| 5 | Is a Pravesha order limited to **5 tickets, return tickets included**? (Source so far: Sunday Observer, Sep 2024.) | `PRAVESHA_MAX_TICKETS_PER_ORDER` | Shows the limit with "Not confirmed". |
| 6 | When does a return trip need a **separate booking**? Our reading of "different boarding station": the return does not start where the outward trip ended. | `planBookings` in `src/lib/booking.ts` | Uses that reading. |
| 7 | Which stations have a **reservation counter**, **mTicketing** and **Pravesha ticket checks**? | `src/mocks/stations.json` | Sample flags labelled "Sample — not confirmed". |
| 8 | Re-check **every other rule** in the table (fees, refund tiers, boundaries, warrant expiry, ID rules) against the official FAQ. | `POLICY_INFO_AS_OF` (2026-10-27) | Update the date after each re-check. |

## 2. Needs native-speaker review

Process and open questions: [REVIEW.md](REVIEW.md). To see a language in the app: More → Settings → Language.

| Item | Where | Count |
|---|---|---|
| Sinhala strings, each marked `// TODO(review-si)` | `src/i18n/si.ts` | 611 |
| Tamil strings, each marked `// TODO(review-ta)` | `src/i18n/ta.ts` | 611 |
| Sinhala and Tamil station names | `src/mocks/stations.json` (move to the backend's station data) | 21 stations |
| Decisions, not just wording: time format, date order, short weekday/month names, "ticket" / "commuter ticket" terms, "Pravesha" spelling | REVIEW.md | 5 Sinhala + 5 Tamil + 4 both |
| Very large text: long words break mid-word at 200 % text (Tamil especially). Shorter wording would read better | REVIEW.md "Both languages" | see list there |

The type checker keeps the keys identical to English, and a test fails if "TODO" ever appears in a string value or on screen.

## 3. Needs the backend (next phase)

| Item | Where now | What the app shows meanwhile |
|---|---|---|
| Real **timetable, fares and stations** (14 sample trains, 21 sample stations) | `src/mocks/*.json` behind the mock API; swap one line in `src/api/index.ts` for an `http.ts` that implements `DumriyaApi` (`src/api/contract.ts`) | Permanent "Sample timetable — not real times" bar. It disappears by itself when the mock is swapped out (`IS_SAMPLE_DATA`). |
| **Live positions**, delays and cancellations | API methods `getLivePosition`, `getFollowEvents`, `getStationBoard`, simulated by `src/api/mock/simulate.ts` | Permanent "Preview — simulated, not real train positions" bar. It stays until a real live feed exists, even with a real timetable. |
| **Platform numbers** on the station board | sample data | "Platform not known" where there is none. |
| **"I'm on this train"** position sharing | `src/features/live/ShareDemo.tsx`; design values in `src/config/app.ts` (`SHARE_*`) | Explanation and a demo only. Never reads location, sends nothing. Needs a server to receive positions and a privacy review. |
| **Alerts while the app is closed** (Web Push) | `src/features/reminders/ReminderScheduler.tsx` checks only while the app is open | Says alerts can be late or appear only on reopening; offers "Add to calendar". Needs a push server (VAPID keys) and stored subscriptions. |
| Where timetable data comes from | `about.timetableSource` on the About page | Says the server is not built yet and all timetable data is sample data. |

## 4. Before a public launch (not needed for the demo)

- **Map tiles:** switch from the OpenStreetMap Foundation tile server to a provider that allows our traffic (`MAP_TILE_URL` in `src/config/app.ts`, and the CSP in `public/_headers`). See README "Map tiles".
- **Search engines:** `X-Robots-Tag: noindex` in `public/_headers` keeps the sample-data demo out of search results. Remove it only when the data is real.
- **npm audit:** a build-time-only `deepmerge` advisory; see [DECISIONS.md](DECISIONS.md) for when to revisit.
