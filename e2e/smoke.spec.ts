import { expect, test } from '@playwright/test';

test('app loads, navigates and switches language on a 360px phone', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();

  await page.getByRole('link', { name: 'More' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'தமிழ்' }).check();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('அமைப்புகள்');

  // No horizontal scrolling at 360px, even with Tamil text.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
