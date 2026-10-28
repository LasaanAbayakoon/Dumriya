/**
 * Service-worker runtime caching rules (used by vite.config.ts, tested in
 * build/runtimeCaching.test.ts).
 *
 * Map tiles:
 * - Cached only when the map itself requests them; never prefetched (tiles are not in the
 *   precache manifest, and the app has no code that fetches tiles ahead of time).
 * - NetworkFirst: online requests go to the network through the browser's normal HTTP cache,
 *   so the tile server's Cache-Control / Expires headers decide freshness. The service
 *   worker's copy is only an offline fallback.
 * - Only real 200 responses (tiles are requested with CORS, see StationMap.tsx). Opaque
 *   responses are not cached: Chrome counts each one as ~7 MB of quota.
 * - At most TILE_CACHE_MAX_ENTRIES tiles, each kept TILE_CACHE_MAX_AGE_DAYS; the cache is
 *   dropped first if the phone runs out of space (tickets matter more than tiles).
 */
import type { VitePWAOptions } from 'vite-plugin-pwa';

type RuntimeCaching = NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']>[number];

export const TILE_CACHE_MAX_ENTRIES = 300;
export const TILE_CACHE_MAX_AGE_DAYS = 7;
export const TILE_NETWORK_TIMEOUT_SECONDS = 4;

/** z/x/y tile paths from any provider configured in src/config/app.ts. */
export const isTileRequest = ({ request, url }: { request: Request; url: URL }) =>
  request.destination === 'image' && /\/\d+\/\d+\/\d+(@2x)?\.(png|jpg|jpeg|webp)$/.test(url.pathname);

export const runtimeCaching: RuntimeCaching[] = [
  {
    urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
    handler: 'CacheFirst',
    options: {
      cacheName: 'google-fonts',
      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: isTileRequest,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'map-tiles',
      networkTimeoutSeconds: TILE_NETWORK_TIMEOUT_SECONDS,
      expiration: {
        maxEntries: TILE_CACHE_MAX_ENTRIES,
        maxAgeSeconds: 60 * 60 * 24 * TILE_CACHE_MAX_AGE_DAYS,
        purgeOnQuotaError: true,
      },
      cacheableResponse: { statuses: [200] },
    },
  },
];
