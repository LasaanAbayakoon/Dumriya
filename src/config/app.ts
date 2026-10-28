/** App-level settings that are not railway policy. */

// ── Map tiles ───────────────────────────────────────────────────────────────
// Switch tile providers here. The OSM standard tile server is for light use only
// (https://operations.osmfoundation.org/policies/tiles/); move to a commercial or
// self-hosted provider before public launch.
export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const MAP_MAX_ZOOM = 19;
/** Rough centre of Sri Lanka, used when nothing else is selected. */
export const MAP_DEFAULT_CENTER: [number, number] = [7.4, 80.6];
export const MAP_DEFAULT_ZOOM = 8;

// ── Mock API ────────────────────────────────────────────────────────────────
/** Fake network delay range for the mock API (ms). Zero in tests. */
export const MOCK_DELAY_MS: [number, number] = import.meta.env.MODE === 'test' ? [0, 0] : [150, 450];

// ── Live data (Preview) ─────────────────────────────────────────────────────
/** How old the simulated live position claims to be. */
export const SIMULATED_POSITION_AGE_MIN = 2;
/** Delay (minutes) at or above which a train counts as "delayed" rather than "on time". */
export const DELAYED_THRESHOLD_MIN = 5;

// ── "Booking opens" reminders ───────────────────────────────────────────────
// Used while BOOKING_OPEN_TIME (config/policy.ts) is null. Once it is set, a single
// alert fires at the exact opening time instead.
/** Heads-up on the evening BEFORE the earliest possible opening date (Asia/Colombo). */
export const BOOKING_HEADS_UP_TIME = '20:00';
/** Optional alert on the earliest possible opening date itself (Asia/Colombo). */
export const BOOKING_MIDNIGHT_ALERT_TIME = '00:00';
/** The midnight alert is off unless the user turns it on. */
export const BOOKING_MIDNIGHT_ALERT_DEFAULT = false;

// ── Warrant and refund reminders ────────────────────────────────────────────
/** Alerts this many hours before a temporary warrant reservation expires. */
export const WARRANT_ALERT_HOURS_BEFORE = [24, 2];
/** Alert this many hours before a ticket's refund drops to a lower tier. */
export const REFUND_ALERT_HOURS_BEFORE = 24;
/** How often the open app checks for due alerts (ms). */
export const REMINDER_CHECK_INTERVAL_MS = 30_000;
/** An alert shown more than this many minutes after its time is labelled "late". */
export const LATE_ALERT_MINUTES = 5;

// ── Local data ──────────────────────────────────────────────────────────────
export const MAX_RECENT_SEARCHES = 5;
/** Largest e-ticket file the wallet accepts (bytes). */
export const MAX_TICKET_FILE_BYTES = 10 * 1024 * 1024;
