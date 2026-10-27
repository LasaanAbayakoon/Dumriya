import { expect, test } from '@playwright/test';

/**
 * The ticket wallet must work with no signal: save a ticket, go offline, reload the
 * app (served by the service worker) and open the ticket from IndexedDB.
 */
test('saved ticket opens with no network after a reload', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-01T12:00:00+05:30'));
  await page.goto('/tickets');
  // Wait until the service worker controls the page (it precaches the whole app).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
    }
  });

  await page.goto('/tickets/new?train=1015&date=2026-12-10&from=colombo-fort&to=ella&time=08:30&fare=1000');
  await page.getByLabel('E-ticket file (PDF or photo)').setInputFiles({
    name: 'eticket.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 sample ticket'),
  });
  await page.getByLabel('Seat (optional)').fill('14');
  await page.getByRole('button', { name: 'Save ticket' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Train 1015' })).toBeVisible();

  await context.setOffline(true);
  await page.goto('/tickets');
  await expect(page.getByText('You are offline. Showing saved information.')).toBeVisible();
  await page.getByRole('heading', { name: 'Train 1015' }).click();
  await expect(page.getByText('Seat 14')).toBeVisible();
  await expect(page.getByText(/Refund if you cancel now: 75 %/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open ticket file' })).toHaveAttribute('href', /^blob:/);
});
