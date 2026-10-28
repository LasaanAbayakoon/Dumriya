// @vitest-environment node
/**
 * Source-scanning guards. These read src/ from disk at run time (not via
 * import.meta.glob), so Vitest's on-disk module cache can never hide a newly
 * added file from them.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

const SRC = fileURLToPath(new URL('../src', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.(ts|tsx)$/.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

const files = sourceFiles(SRC).map((p) => ({ path: relative(SRC, p).split(sep).join('/'), code: readFileSync(p, 'utf8') }));

test('the scan really sees the source tree', () => {
  expect(files.length).toBeGreaterThan(50);
  expect(files.some((f) => f.path === 'components/ExternalLink.tsx')).toBe(true);
});

test('only ExternalLink may set target="_blank" (it always adds rel="noopener noreferrer")', () => {
  const offenders = files.filter((f) => f.path !== 'components/ExternalLink.tsx' && /_blank/.test(f.code)).map((f) => f.path);
  expect(offenders).toEqual([]);
});

const LEAFLET_MODULES = ['features/stations/StationMap.tsx', 'features/live/LiveTrainMap.tsx'];

test('only the lazy-loaded map modules import Leaflet (so it stays out of every other screen)', () => {
  const offenders = files
    .filter((f) => !LEAFLET_MODULES.includes(f.path) && /from ['"]leaflet|import\(['"]leaflet|['"]leaflet\/dist/.test(f.code))
    .map((f) => f.path);
  expect(offenders).toEqual([]);
});
