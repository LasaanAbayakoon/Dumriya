import { expect, test } from '@playwright/test';

// 1×1 transparent PNG: tests never hit the real tile server.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

// The service worker fetches tiles itself, and Playwright cannot intercept a service worker's
// requests, so block it here: every tile request then goes through page.route below.
test.use({ serviceWorkers: 'block' });

let tilesServed = 0;
test.beforeEach(async ({ page }) => {
  tilesServed = 0;
  await page.route(/\/\d+\/\d+\/\d+\.png$/, (route) => {
    tilesServed++;
    // Tiles are requested with CORS, like a real tile server answers them.
    return route.fulfill({ status: 200, contentType: 'image/png', body: PNG, headers: { 'Access-Control-Allow-Origin': '*' } });
  });
});

test('map loads only when opened, keeps OSM attribution visible, and markers open stations', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') scripts.push(r.url());
  });

  await page.goto('/stations');
  await expect(page.getByRole('link', { name: /Colombo Fort/ })).toBeVisible();
  expect(scripts.some((u) => /StationMap/.test(u)), 'map chunk must not load with the list').toBe(false);

  await page.getByRole('button', { name: 'Map' }).click();
  const map = page.getByTestId('station-map');
  await expect(map).toBeVisible();
  expect(scripts.some((u) => /StationMap/.test(u))).toBe(true);

  // With the map in view, the attribution is visible and not covered by the bottom navigation.
  await map.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const attribution = page.locator('.leaflet-control-attribution');
  await expect(attribution).toContainText('OpenStreetMap');
  await expect(attribution).toBeInViewport();
  const onTop = await attribution.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
  });
  expect(onTop, 'attribution must not be covered by other UI').toBe(true);

  // One marker per station; a marker's popup opens the station page.
  await expect(page.locator('path.leaflet-interactive')).toHaveCount(21);
  expect(tilesServed, 'tiles must come from the fake route, never the real server').toBeGreaterThan(0);
  await page.goto('/stations?view=map&focus=galle');
  await page.getByRole('button', { name: 'Open Galle' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Galle' })).toBeVisible();
});

test('Near me sorts by distance only after the tap', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 6.04, longitude: 80.22 }); // Galle
  await page.goto('/stations');
  await expect(page.getByRole('link', { name: /Aluthgama/ })).toBeVisible();
  await page.getByRole('button', { name: 'Near me' }).click();
  await expect(page.getByText('Sorted by distance from you.')).toBeVisible();
  await expect(page.locator('main ul > li').first()).toContainText('Galle');
  await expect(page.locator('main ul > li').first()).toContainText('km away');
  expect(page.url()).not.toContain('6.04');
});
