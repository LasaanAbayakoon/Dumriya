import type { Page } from '@playwright/test';
import { expect, fakeTiles, type Lang, MESSAGES, NOW, openScreen, overflowing, SCREENS, setPrefs, setTextScale, settled, test } from './support';
import type { Messages } from '../src/i18n/en.ts';

/**
 * Worst case for layout: Sinhala and Tamil (the longest translations) at 200 % text on a 360px
 * phone, on every screen and every state in SCREENS. Fails on horizontal overflow.
 *
 * To prove the long strings were really on screen (not hidden behind a tap the test never made),
 * it also checks that each key in MUST_RENDER appeared somewhere. These are the longest strings in
 * si.ts / ta.ts that the sample data can show; the few longer ones not listed only appear when the
 * browser blocks storage or does not support alerts.
 */
const MUST_RENDER = [
  'about.contacts',
  'about.rules',
  'about.timetableSource',
  'about.sample',
  'refund.originNote',
  'reminders.how',
  'reminders.warrantIntro',
  'bookingWindow.twoDatesWhy',
  'bookingWindow.mayBeLaterWhy',
  'results.noDirect',
  'book.leaveBody',
  'book.leaveBodyPravesha',
  'book.lookAlike',
  'book.praveshaMax',
  'share.intro',
  'share.running',
  'follow.intro',
  'dispute.refusedFullCard',
  'settings.deleteAllBody',
  'reminder.midnightToggle',
];

test.use({ serviceWorkers: 'block' }); // map tiles go through fakeTiles()

function lookup(m: Messages, key: string): string {
  const value = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], m);
  if (typeof value !== 'string') throw new Error(`${key} is not a string`);
  return value;
}

/** The literal parts of a string, without its {{placeholders}}. */
const fragments = (s: string) =>
  s
    .split(/\{\{[^}]+\}\}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length >= 3);

const visibleText = (page: Page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));

test('Sinhala and Tamil at 200 % text fit 360px on every screen', async ({ page }) => {
  test.setTimeout(300_000);
  await page.clock.setFixedTime(NOW);
  await fakeTiles(page);

  const problems: string[] = [];
  for (const lang of ['si', 'ta'] satisfies Lang[]) {
    await setPrefs(page, { lang }); // added last, so it wins over the previous language
    const m = MESSAGES[lang];
    let seen = '';
    const check = async (where: string) => {
      seen += ' ' + (await visibleText(page));
      for (const p of await overflowing(page)) problems.push(`${lang} ${where}: ${p}`);
    };

    for (const s of SCREENS) {
      await openScreen(page, s.url);
      expect(await page.evaluate(() => document.documentElement.lang), `${s.name} language`).toBe(lang);
      await setTextScale(page, 200);
      await check(s.name);
      for (const state of s.states ?? []) {
        await openScreen(page, s.url);
        await setTextScale(page, 200);
        await state.open(page, m);
        await settled(page);
        await check(`${s.name} → ${state.name}`);
      }
    }

    const missing = MUST_RENDER.filter((key) => !fragments(lookup(m, key)).every((f) => seen.includes(f)));
    expect(missing, `${lang}: long strings never shown on screen`).toEqual([]);
  }
  expect(problems, problems.join('\n')).toEqual([]);
});
