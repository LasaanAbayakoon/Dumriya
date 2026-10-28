import { expect, fakeTiles, type Lang, NOW, openScreen, overflowing, SCREENS, setPrefs, setTextScale, test } from './support';

/**
 * Layout guard at 360px: no horizontal page scroll and no text overflowing its
 * button/link/heading. Sinhala and Tamil at 200 % text are in longest-strings.spec.ts.
 */
test.use({ serviceWorkers: 'block' }); // map tiles go through fakeTiles()

const RUNS: [Lang, number][] = [
  ['en', 100],
  ['en', 200],
  ['si', 100],
  ['ta', 100],
];

for (const [lang, scale] of RUNS) {
  test(`${lang} @ ${scale}% text fits 360px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.clock.setFixedTime(NOW);
    await setPrefs(page, { lang });
    await fakeTiles(page);
    for (const s of SCREENS) {
      await openScreen(page, s.url);
      if (scale !== 100) await setTextScale(page, scale);
      expect(await overflowing(page), `${s.name} (${lang}, ${scale}%)`).toEqual([]);
    }
  });
}
