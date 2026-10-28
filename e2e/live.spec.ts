import { expect, fakeTiles, test } from './support';

// Never touch the real tile server (see stations.spec.ts for why the service worker is blocked).
test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => fakeTiles(page));

test('live map: preview label, text list of stops, and the simulated train moves over time', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-02T12:00:00+05:30') });
  await page.goto('/train/1015/live?date=2026-11-02');
  await expect(page.getByTestId('preview-banner')).toHaveText('Preview — simulated, not real train positions');
  await expect(page.getByRole('table', { name: 'Stops (text version of the map)' })).toBeVisible();
  await expect(page.getByTestId('live-map')).toBeVisible();
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');

  // The train marker is the blue circle; it moves as simulated time passes.
  const train = page.locator('path.leaflet-interactive[fill="#1d4ed8"]');
  await expect(train).toHaveCount(1);
  const before = await train.getAttribute('d');
  await page.clock.runFor(10 * 60_000); // 10 minutes; the screen refreshes every 15 s
  await expect.poll(() => train.getAttribute('d')).not.toBe(before);
});
