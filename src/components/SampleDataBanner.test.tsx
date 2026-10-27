import { screen, within } from '@testing-library/react';
import { IS_SAMPLE_DATA } from '@/api';
import { renderRoute } from '@/test/renderRoute';

const BANNER = 'Sample timetable — not real times';

test('the mock API is active, so the flag is on', () => {
  expect(IS_SAMPLE_DATA).toBe(true);
});

test.each([
  { screenName: 'Results', url: '/results?from=colombo-fort&to=kandy&date=2026-12-10', h1: 'Colombo Fort to Kandy' },
  { screenName: 'Train detail', url: '/train/1015?date=2026-12-10', h1: '1015 Udarata Menike' },
  { screenName: 'Booking helper', url: '/train/1015/book?date=2026-12-10', h1: 'Before you book' },
])('banner shows in the sticky header on $screenName', async ({ url, h1 }) => {
  renderRoute(url);
  const heading = await screen.findByRole('heading', { level: 1, name: h1 });
  const header = heading.closest('header')!;
  expect(within(header).getByText(BANNER)).toBeInTheDocument();
});

test('it has no dismiss button', async () => {
  renderRoute('/train/1015?date=2026-12-10');
  const banner = await screen.findByTestId('sample-data-banner');
  expect(within(banner).queryByRole('button')).not.toBeInTheDocument();
});

test.each([{ url: '/settings' }, { url: '/more' }])('screens without train data have no banner: $url', async ({ url }) => {
  renderRoute(url);
  await screen.findByRole('heading', { level: 1 });
  expect(screen.queryByText(BANNER)).not.toBeInTheDocument();
});
