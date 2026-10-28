import { expect, test as base, type Page } from '@playwright/test';
import en, { type Messages } from '../src/i18n/en.ts';
import si from '../src/i18n/si.ts';
import ta from '../src/i18n/ta.ts';

/**
 * Every spec uses this `test`: it fails if the page breaks the Content-Security-Policy in
 * public/_headers (served by `vite preview`), so a policy that would break the deployed demo is
 * caught here first.
 */
export const test = base.extend<{ cspGuard: void }>({
  cspGuard: [
    async ({ page }, use) => {
      const violations: string[] = [];
      page.on('console', (msg) => {
        if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
      });
      await use();
      expect(violations, 'Content-Security-Policy violations').toEqual([]);
    },
    { auto: true },
  ],
});
export { expect };

export type Lang = 'en' | 'si' | 'ta';
export const MESSAGES: Record<Lang, Messages> = { en, si, ta };

/** Every Playwright test runs at this fixed Sri Lanka time, so dates and windows are stable. */
export const NOW = new Date('2026-11-01T12:00:00+05:30');

// 1×1 transparent PNG: tests never hit the real tile server.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

/**
 * Serve a blank tile for every map tile request. Call it with `test.use({ serviceWorkers: 'block' })`:
 * Playwright cannot intercept requests the service worker makes itself.
 */
export async function fakeTiles(page: Page) {
  await page.route(/\/\d+\/\d+\/\d+\.png$/, (route) =>
    // Tiles are requested with CORS, like a real tile server answers them.
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG, headers: { 'Access-Control-Allow-Origin': '*' } }),
  );
}

/** Language and theme are read from localStorage before the first paint (index.html). */
export async function setPrefs(page: Page, prefs: { lang?: Lang; theme?: 'light' | 'dark' }) {
  await page.addInitScript((p) => {
    if (p.lang) localStorage.setItem('dumriya.lang', p.lang);
    if (p.theme) localStorage.setItem('dumriya.theme', p.theme);
  }, prefs);
}

export type Screen = {
  name: string;
  url: string;
  /** Screen shows train data, so the sample-data bar must be visible. */
  sample?: boolean;
  /** Preview screen, so the "Preview — simulated" bar must be visible. */
  preview?: boolean;
  /** Extra states to check after the screen loads (dialogs, errors, expanded views). */
  states?: { name: string; open: (page: Page, m: Messages) => Promise<void> }[];
};

/** Every screen of the app, with the states that reveal its longest text. */
export const SCREENS: Screen[] = [
  { name: 'home', url: '/' },
  { name: 'results', url: '/results?from=colombo-fort&to=badulla&date=2026-12-10', sample: true },
  { name: 'results-no-direct', url: '/results?from=aluthgama&to=bandarawela&date=2026-12-10', sample: true },
  {
    name: 'train-nawalapitiya',
    url: '/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla',
    sample: true,
    states: [
      {
        name: 'booking reminder sheet',
        open: async (page, m) => {
          await page.getByRole('button', { name: m.bookingWindow.remindMe }).click();
          await expect(page.getByRole('dialog', { name: m.reminder.title })).toBeVisible();
        },
      },
    ],
  },
  { name: 'train-unreserved', url: '/train/8059?date=2026-12-10', sample: true },
  { name: 'book-night', url: '/train/1045/book?date=2026-12-10&from=nawalapitiya&to=badulla', sample: true },
  { name: 'book-unreserved', url: '/train/8059/book?date=2026-12-10', sample: true },
  {
    name: 'refund',
    url: '/refund?departure=2026-12-09T20%3A00%3A00%2B05%3A30&fare=1240&train=1045&date=2026-12-10&from=nawalapitiya&to=badulla',
  },
  {
    name: 'dispute',
    url: '/dispute',
    states: [
      {
        name: 'full card number refused',
        open: async (page, m) => {
          await page.getByLabel(m.dispute.last4).fill('12345');
          await expect(page.getByText(m.dispute.refusedFullCard)).toBeVisible();
        },
      },
    ],
  },
  { name: 'tickets', url: '/tickets' },
  {
    name: 'ticket-new',
    url: '/tickets/new?train=1045&date=2026-12-10&from=nawalapitiya&to=badulla&time=00:35&fare=510',
    states: [
      {
        name: 'missing file error',
        open: async (page, m) => {
          await page.getByRole('button', { name: m.tickets.save }).click();
          await expect(page.getByText(m.tickets.errorFile)).toBeVisible();
        },
      },
    ],
  },
  { name: 'ticket', url: '/tickets', states: [{ name: 'saved ticket', open: openSavedTicket }] },
  { name: 'reminders', url: '/reminders' },
  { name: 'more', url: '/more' },
  {
    name: 'stations',
    url: '/stations',
    states: [
      {
        name: 'map view',
        open: async (page, m) => {
          await page.getByRole('button', { name: m.stations.map }).click();
          await expect(page.locator('.leaflet-control-attribution')).toBeVisible();
        },
      },
    ],
  },
  { name: 'station', url: '/stations/kandy', sample: true },
  { name: 'board', url: '/stations/galle/board', sample: true, preview: true },
  {
    name: 'live',
    url: '/train/1015/live?date=2026-11-01',
    sample: true,
    preview: true,
    states: [
      {
        name: '"I\'m on this train" demo',
        open: async (page, m) => {
          await page.getByRole('button', { name: m.share.button }).click();
          await page.getByRole('button', { name: m.share.start }).click();
          await expect(page.getByRole('dialog', { name: m.share.title })).toBeVisible();
        },
      },
    ],
  },
  {
    name: 'settings',
    url: '/settings',
    states: [
      {
        name: 'delete-all dialog',
        open: async (page, m) => {
          await page.getByRole('button', { name: m.settings.deleteAll }).click();
          await expect(page.getByRole('dialog')).toBeVisible();
        },
      },
    ],
  },
  { name: 'about', url: '/settings/about' },
  { name: 'not-found', url: '/no-such-page' },
];

/** Opens a screen and waits until it has rendered and finished loading. */
export async function openScreen(page: Page, url: string) {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await settled(page);
}

/**
 * Waits until the mock API has answered everything and no loading spinner is left. Its fake
 * delay is a timer, so "network idle" alone does not see it. Calls can be chained (stations, then
 * trains), so the quiet state must hold for a few checks in a row.
 */
export async function settled(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        let quiet = 0;
        const tick = () => {
          const pending = (window as { __dumriyaMockPending?: number }).__dumriyaMockPending ?? 0;
          const busy = pending > 0 || document.querySelector('[role="status"] > .animate-spin');
          quiet = busy ? 0 : quiet + 1;
          if (quiet >= 4) resolve(true);
          else setTimeout(tick, 50);
        };
        tick();
      }),
  );
}

/** Saves a ticket in this browser context (IndexedDB) through the real form. */
export async function saveTicket(page: Page, m: Messages) {
  await page.goto('/tickets/new?train=1015&date=2026-12-10&from=colombo-fort&to=ella&time=08:30&fare=1000');
  await page.getByLabel(m.tickets.file).setInputFiles({
    name: 'eticket.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 sample ticket'),
  });
  await page.getByLabel(m.tickets.seat).fill('14');
  await page.getByRole('button', { name: m.tickets.save }).click();
  await expect(page).toHaveURL(/\/tickets\/[^/]+$/);
}

async function openSavedTicket(page: Page, m: Messages) {
  await saveTicket(page, m);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await settled(page);
}

/** Everything that makes a 360px screen wider than the phone: page scroll and clipped text. */
export async function overflowing(page: Page) {
  // Compare with the phone's width, not window.innerWidth: a mobile browser zooms out when the page
  // is too wide, and innerWidth then grows to match, hiding the overflow.
  const width = page.viewportSize()!.width;
  return page.evaluate((width) => {
    const out: string[] = [];
    const doc = document.documentElement;
    if (doc.scrollWidth > width || window.innerWidth > width) {
      out.push(`page is wider than the phone: ${Math.max(doc.scrollWidth, window.innerWidth)}px > ${width}px`);
      // Name the innermost elements that stick out, so the failure says what to fix.
      const wide = [...document.body.querySelectorAll<HTMLElement>('*')].filter(
        (el) => el.getBoundingClientRect().right > width + 1 && !el.closest('.leaflet-container'),
      );
      for (const el of wide.filter((el) => !wide.some((o) => o !== el && el.contains(o))).slice(0, 5)) {
        out.push(`  sticks out: <${el.tagName.toLowerCase()} class="${el.className}"> "${el.textContent?.trim().slice(0, 40)}"`);
      }
    }
    for (const el of document.querySelectorAll<HTMLElement>('button, a, h1, h2, h3, label, dd, p, th, td')) {
      if (el.offsetParent === null) continue; // hidden
      if (el.getBoundingClientRect().width <= 1) continue; // visually hidden (sr-only), e.g. the skip link
      if (el.closest('.leaflet-container')) continue; // map tiles and panes are meant to extend past the map box
      if (el.scrollWidth > el.clientWidth + 1) {
        out.push(`${el.tagName} "${el.textContent?.trim().slice(0, 40)}" overflows`);
      }
    }
    return out;
  }, width);
}

/** Sets the root font size (200 % = what Android's largest text setting does to rem-based layouts). */
export async function setTextScale(page: Page, percent: number) {
  await page.evaluate((s) => (document.documentElement.style.fontSize = `${s}%`), percent);
}
