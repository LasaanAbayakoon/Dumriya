import { fakeTiles, type Lang, NOW, openScreen, setPrefs, test } from './support';

/** README screenshots. Run with `npm run screenshots` (not part of `npm run e2e`). */
const SHOTS: { file: string; url: string; lang?: Lang }[] = [
  { file: 'home', url: '/' },
  { file: 'results', url: '/results?from=colombo-fort&to=badulla&date=2026-12-10' },
  { file: 'train', url: '/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla' },
  { file: 'refund', url: '/refund?departure=2026-12-09T20%3A00%3A00%2B05%3A30&fare=1240&train=1045&date=2026-12-10&from=nawalapitiya&to=badulla' },
  { file: 'board', url: '/stations/galle/board' },
  { file: 'train-si', url: '/train/1015?date=2026-12-10&from=colombo-fort&to=ella', lang: 'si' },
];

test.use({ serviceWorkers: 'block' });

for (const s of SHOTS) {
  test(s.file, async ({ page }) => {
    await page.clock.setFixedTime(NOW);
    await fakeTiles(page);
    await setPrefs(page, { lang: s.lang ?? 'en', theme: 'light' });
    await openScreen(page, s.url);
    await page.screenshot({ path: `docs/screenshots/${s.file}.png` });
  });
}
