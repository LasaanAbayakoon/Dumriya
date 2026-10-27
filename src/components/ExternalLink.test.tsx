import { screen } from '@testing-library/react';
import { renderRoute } from '@/test/renderRoute';

/**
 * Guard: every link that opens a new tab must have rel="noopener noreferrer".
 * 1) Source check: only ExternalLink.tsx may use target="_blank".
 * 2) Rendered check: on every screen with outbound links, each target=_blank link has both rel values.
 */
const sources = import.meta.glob<string>(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

test('only ExternalLink may set target="_blank"', () => {
  const offenders = Object.entries(sources)
    .filter(([file]) => !file.endsWith('/components/ExternalLink.tsx'))
    .filter(([, code]) => /_blank/.test(code))
    .map(([file]) => file);
  expect(Object.keys(sources).length).toBeGreaterThan(20); // the glob really found the source
  expect(offenders).toEqual([]);
});

const SCREENS = [
  '/train/1015/book?date=2026-12-10&from=colombo-fort&to=ella',
  '/train/8059/book?date=2026-12-10',
  '/dispute',
  '/refund',
];

test.each(SCREENS.map((url) => ({ url })))('every new-tab link on $url has rel="noopener noreferrer"', async ({ url }) => {
  renderRoute(url);
  await screen.findByRole('heading', { level: 1 });
  // Let lazy data settle before scanning.
  await new Promise((r) => setTimeout(r, 0));
  await screen.findAllByRole('heading', { level: 2 }).catch(() => []);
  const blank = [...document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
  for (const a of blank) {
    const rel = (a.getAttribute('rel') ?? '').split(/\s+/);
    expect(rel, a.href).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  }
});
