import type { Page } from '@playwright/test';
import { expect, test } from './support';

/** Fonts are self-hosted and downloaded only for the script actually shown; nothing goes to Google. */
function track(page: Page) {
  const fonts: string[] = [];
  const google: string[] = [];
  page.on('request', (r) => {
    if (/\.woff2?(\?|$)/.test(r.url())) fonts.push(r.url());
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) google.push(r.url());
  });
  return { fonts, google };
}

test.use({ serviceWorkers: 'block' }); // see every request from the page itself

test('English pages download no fonts; nothing is fetched from Google', async ({ page }) => {
  const { fonts, google } = track(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(fonts).toEqual([]);
  expect(google).toEqual([]);
});

test('a Sinhala page downloads only the bundled Sinhala font and uses it', async ({ page }) => {
  const { fonts, google } = track(page);
  await page.addInitScript(() => localStorage.setItem('dumriya.lang', 'si'));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'දුම්රියක් සොයන්න' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(fonts.length).toBeGreaterThan(0);
  expect(fonts.every((u) => new URL(u).origin === new URL(page.url()).origin && /noto-sans-sinhala/.test(u))).toBe(true);
  expect(google).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('16px "Noto Sans Sinhala"', 'දුම්රිය'))).toBe(true);
});
