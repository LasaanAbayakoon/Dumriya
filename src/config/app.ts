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

// ── Local data ──────────────────────────────────────────────────────────────
export const MAX_RECENT_SEARCHES = 5;
/** Largest e-ticket file the wallet accepts (bytes). */
export const MAX_TICKET_FILE_BYTES = 10 * 1024 * 1024;
