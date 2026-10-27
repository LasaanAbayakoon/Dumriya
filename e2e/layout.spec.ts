import { expect, test, type Page } from '@playwright/test';

/**
 * Layout guard at 360px: no horizontal page scroll and no text overflowing its
 * button/link/heading, in all three languages, at normal and 200 % text size.
 */
const PAGES = [
  { name: 'home', url: '/' },
  { name: 'results', url: '/results?from=colombo-fort&to=badulla&date=2026-12-10' },
  { name: 'train-nawalapitiya', url: '/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla' },
  { name: 'train-unreserved', url: '/train/8059?date=2026-12-10' },
  { name: 'book-night', url: '/train/1045/book?date=2026-12-10&from=nawalapitiya&to=badulla' },
  { name: 'book-unreserved', url: '/train/8059/book?date=2026-12-10' },
];

async function overflowing(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    if (document.documentElement.scrollWidth > window.innerWidth) {
      out.push(`page scrolls horizontally: ${document.documentElement.scrollWidth}px > ${window.innerWidth}px`);
    }
    for (const el of document.querySelectorAll<HTMLElement>('button, a, h1, h2, h3, label, dd, p, th, td')) {
      if (el.offsetParent === null) continue; // hidden
      if (el.getBoundingClientRect().width <= 1) continue; // visually hidden (sr-only), e.g. the skip link
      if (el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName} "${el.textContent?.trim().slice(0, 40)}" overflows`);
    }
    return out;
  });
}

for (const lang of ['en', 'si', 'ta']) {
  for (const scale of [100, 200]) {
    test(`${lang} @ ${scale}% text fits 360px`, async ({ page }) => {
      await page.clock.setFixedTime(new Date('2026-11-01T12:00:00+05:30'));
      await page.addInitScript((l) => localStorage.setItem('dumriya.lang', l), lang);
      for (const p of PAGES) {
        await page.goto(p.url);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.waitForLoadState('networkidle');
        if (scale !== 100) await page.evaluate((s) => (document.documentElement.style.fontSize = `${s}%`), scale);
        expect(await overflowing(page), `${p.name} (${lang}, ${scale}%)`).toEqual([]);
      }
    });
  }
}
