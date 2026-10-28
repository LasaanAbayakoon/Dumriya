import { expect, test } from '@playwright/test';

/**
 * In a real browser: a reminder saved in the UI fires when its time comes while the app
 * is open (shown in the app, marked as shown). Headless Chromium reports notifications as
 * "denied" even after grantPermissions, so this checks the in-app alert, which always
 * shows; the permission prompt states are covered by unit tests.
 */
test('warrant reminder alert fires while the app is open', async ({ page, context }) => {
  await context.grantPermissions(['notifications']); // honoured by headed browsers only
  await page.clock.install({ time: new Date('2026-11-01T12:00:00+05:30') });
  await page.goto('/reminders');
  // Whatever the permission, the screen says in words what will happen.
  await expect(page.getByText(/Phone alerts are on.|Phone alerts are blocked|This browser cannot show phone alerts/)).toBeVisible();

  // Booked 7 days ago minus 1 minute: expires at 12:01 today, so the only alert is at 12:01.
  await page.getByLabel('Date you booked').fill('2026-10-25');
  await page.getByLabel('Time you booked').fill('12:01');
  await page.getByLabel('Journey date').fill('2026-12-10');
  await page.getByLabel('Train departure time').fill('08:30');
  await page.getByLabel('Train number (optional)').fill('1015');
  await expect(page.getByTestId('warrant-preview')).toHaveText('Expires at 12:01 on Sun, 1 Nov 2026.');
  await page.getByRole('button', { name: 'Save warrant reminder' }).click();
  await expect(page.getByText('Next alert: 12:01 on Sun, 1 Nov 2026')).toBeVisible();

  // Let two minutes pass: the 30-second check picks the alert up.
  await page.clock.runFor(120_000);
  const banner = page.getByRole('alert').filter({ hasText: 'Your warrant reservation for train 1015 expires at 12:01' });
  await expect(banner).toBeVisible();
  await expect(page.getByText('All alerts have been shown.')).toBeVisible();
});
