// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { parseHeaders, siteHeaders } from './headers';

const file = (p: string) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const headers = siteHeaders(file('public/_headers'));
const csp = Object.fromEntries(
  headers['Content-Security-Policy']!.split(';').map((d) => {
    const [name, ...values] = d.trim().split(/\s+/);
    return [name!, values];
  }),
);

test('parses rules, indented headers and comments', () => {
  expect(parseHeaders('# note\n/*\n  A: 1\n  B: x: y\n\n/assets/*\n  C: 2\n')).toEqual({
    '/*': { A: '1', B: 'x: y' },
    '/assets/*': { C: '2' },
  });
  expect(() => parseHeaders('  A: 1')).toThrow();
});

test('the demo is kept out of search results (it shows sample data)', () => {
  expect(headers['X-Robots-Tag']).toBe('noindex');
});

test('scripts only from our own origin, and no inline script in index.html', () => {
  expect(csp['script-src']).toEqual(["'self'"]);
  expect(readFileSync(file('index.html'), 'utf8')).not.toMatch(/<script>(?!<\/script>)/);
});

test('the map tile server is allowed for images and the service worker fetches', () => {
  const config = readFileSync(file('src/config/app.ts'), 'utf8');
  const tileOrigin = new URL(/MAP_TILE_URL = '([^']+)'/.exec(config)![1]!.replace(/\{[a-z]\}/g, '0')).origin;
  expect(csp['img-src']).toContain(tileOrigin);
  expect(csp['connect-src']).toContain(tileOrigin);
});

test('location is allowed only for Dumriya itself ("Near me")', () => {
  expect(headers['Permissions-Policy']).toContain('geolocation=(self)');
});
