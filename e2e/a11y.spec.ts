import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, fakeTiles, MESSAGES, NOW, openScreen, SCREENS, setPrefs, settled, test } from './support';

/**
 * axe-core on every screen (and the dialogs / error states listed in SCREENS), in light and
 * dark themes. Fails on any "serious" or "critical" violation (colour contrast is "serious").
 * Contrast of the status colours and banners is also checked from the CSS tokens in
 * build/contrast.test.ts. Also checks the sample-data and preview bars are on screen where they must be.
 */
test.use({ serviceWorkers: 'block' }); // map tiles go through fakeTiles()

const BLOCKING = new Set(['serious', 'critical']);

async function scan(page: Page, where: string) {
  // Every axe rule except experimental ones: WCAG 2.0–2.2 A/AA plus best practices.
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => BLOCKING.has(v.impact ?? ''))
    .map((v) => `${where}: [${v.impact}] ${v.id}: ${v.help}\n${v.nodes.map((n) => `    ${n.target.join(' ')}  ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`).join('\n')}`);
}

for (const theme of ['light', 'dark'] as const) {
  test(`no serious or critical accessibility issues (${theme} theme)`, async ({ page }) => {
    test.setTimeout(180_000);
    const m = MESSAGES.en;
    await page.clock.setFixedTime(NOW);
    await page.emulateMedia({ colorScheme: theme });
    await setPrefs(page, { theme });
    await fakeTiles(page);

    const problems: string[] = [];
    for (const s of SCREENS) {
      await openScreen(page, s.url);
      expect(await page.evaluate(() => document.documentElement.classList.contains('dark')), `${s.name} theme`).toBe(theme === 'dark');
      if (s.sample) await expect(page.getByTestId('sample-data-banner'), `${s.name} sample-data bar`).toBeVisible();
      if (s.preview) await expect(page.getByTestId('preview-banner'), `${s.name} preview bar`).toBeVisible();
      problems.push(...(await scan(page, s.name)));
      for (const state of s.states ?? []) {
        await openScreen(page, s.url);
        await state.open(page, m);
        await settled(page);
        problems.push(...(await scan(page, `${s.name} → ${state.name}`)));
      }
    }
    expect(problems, problems.join('\n')).toEqual([]);
  });
}
