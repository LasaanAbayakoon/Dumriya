// @vitest-environment node
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { isOwnFont, isTileRequest, runtimeCaching, TILE_CACHE_MAX_AGE_DAYS, TILE_CACHE_MAX_ENTRIES } from './runtimeCaching';

const tiles = runtimeCaching.find((r) => r.options?.cacheName === 'map-tiles')!;
const req = (destination: string) => ({ destination }) as Request;

test('tile rule matches z/x/y tile images only', () => {
  const match = isTileRequest;
  expect(match({ request: req('image'), url: new URL('https://tile.openstreetmap.org/12/3051/1983.png') })).toBe(true);
  expect(match({ request: req('image'), url: new URL('https://tiles.example.com/12/3051/1983@2x.webp') })).toBe(true);
  expect(match({ request: req('script'), url: new URL('https://tile.openstreetmap.org/12/3051/1983.png') })).toBe(false);
  expect(match({ request: req('image'), url: new URL('https://example.com/icons/logo.png') })).toBe(false);
});

test('(b) network first, so the tile server cache headers decide freshness while online', () => {
  expect(tiles.handler).toBe('NetworkFirst');
});

test('(c) size and age limits, dropped first under storage pressure', () => {
  expect(tiles.options?.expiration).toEqual({
    maxEntries: TILE_CACHE_MAX_ENTRIES,
    maxAgeSeconds: TILE_CACHE_MAX_AGE_DAYS * 24 * 60 * 60,
    purgeOnQuotaError: true,
  });
  expect(TILE_CACHE_MAX_ENTRIES).toBeLessThanOrEqual(300);
});

test('only real responses are cached, never opaque ones (each would count as ~7 MB of quota)', () => {
  expect(tiles.options?.cacheableResponse).toEqual({ statuses: [200] });
});

test('(a) never prefetched: no tile URLs are in the precache patterns, and tiles load with CORS', () => {
  const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
  expect(config).toContain("globPatterns: ['**/*.{js,css,html,svg,png}']"); // local build files only (no fonts, no tiles)
  expect(config).toContain('runtimeCaching,');
  const map = readFileSync(new URL('../src/features/stations/StationMap.tsx', import.meta.url), 'utf8');
  expect(map).toMatch(/crossOrigin: true/);
});

test('fonts: self-hosted files cached on first use, never fetched from Google', () => {
  const fonts = runtimeCaching.find((r) => r.options?.cacheName === 'fonts')!;
  expect(fonts.handler).toBe('CacheFirst');
  expect(isOwnFont({ request: req('font'), url: new URL('https://dumriya.example/assets/noto-sans-sinhala-400.woff2'), sameOrigin: true })).toBe(true);
  expect(isOwnFont({ request: req('font'), url: new URL('https://fonts.gstatic.com/x.woff2'), sameOrigin: false })).toBe(false);
  expect(runtimeCaching.some((r) => String(r.urlPattern).includes('googleapis'))).toBe(false);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  expect(html).not.toMatch(/fonts.googleapis|fonts.gstatic/);
});
