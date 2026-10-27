import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { clearRecentSearches, getRecentSearches } from '@/lib/recentSearches';
import { renderRoute } from '@/test/renderRoute';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00+05:30')); // Sunday
  clearRecentSearches();
});
afterEach(() => vi.useRealTimers());

async function pickStation(user: ReturnType<typeof userEvent.setup>, field: RegExp, query: string, option: RegExp) {
  await user.click(await screen.findByRole('button', { name: field }));
  const dialog = within(await screen.findByRole('dialog'));
  await user.type(dialog.getByRole('searchbox', { name: 'Search stations' }), query);
  await user.click(await dialog.findByRole('button', { name: option }));
}

test('shows inline errors and focuses the first invalid field', async () => {
  const user = userEvent.setup();
  renderRoute('/');
  await user.click(await screen.findByRole('button', { name: 'Search trains' }));
  expect(screen.getByText('Choose the station you are leaving from.')).toBeInTheDocument();
  expect(screen.getByText('Choose the station you are going to.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^From/ })).toHaveFocus();
});

test('search by Sinhala and Tamil names, then results list trains in order', async () => {
  const user = userEvent.setup();
  const { router } = renderRoute('/');
  await pickStation(user, /^From/, 'කොටුව', /Colombo Fort/);
  await pickStation(user, /^To/, 'பதுளை', /Badulla/);
  await user.click(screen.getByRole('button', { name: 'Search trains' }));

  expect(router.state.location.pathname).toBe('/results');
  expect(router.state.location.search).toBe('?from=colombo-fort&to=badulla&date=2026-11-01');
  expect(await screen.findByRole('heading', { level: 1, name: 'Colombo Fort to Badulla' })).toBeInTheDocument();
  expect(await screen.findByText('3 trains')).toBeInTheDocument(); // Sunday: 1001 does not run
  const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  expect(names).toEqual(['1005 Podi Menike', '1015 Udarata Menike', '1045 Night Mail']);
  expect(getRecentSearches()).toEqual([{ fromStationId: 'colombo-fort', toStationId: 'badulla' }]);
});

test('From and To must differ', async () => {
  const user = userEvent.setup();
  renderRoute('/');
  await pickStation(user, /^From/, 'galle', /Galle/);
  await pickStation(user, /^To/, 'GLE', /Galle/);
  await user.click(screen.getByRole('button', { name: 'Search trains' }));
  expect(screen.getByText('From and To must be different stations.')).toBeInTheDocument();
});

describe('results', () => {
  test('unreserved-only trains show the badge and the Pravesha note', async () => {
    renderRoute('/results?from=colombo-fort&to=matara&date=2026-11-02');
    const card = (await screen.findByRole('heading', { name: '8059 Ruhunu Kumari' })).closest('a')!;
    expect(within(card).getByText('Unreserved only')).toBeInTheDocument();
    expect(within(card).getByText('Commuter tickets can be bought on Pravesha up to 7 days before travel.')).toBeInTheDocument();
    const intercity = (await screen.findByRole('heading', { name: '8086 Coastal Intercity' })).closest('a')!;
    expect(within(intercity).getByText('Reservable online')).toBeInTheDocument();
  });

  test('night train arriving next day is marked in words for screen readers', async () => {
    renderRoute('/results?from=colombo-fort&to=ella&date=2026-11-02&time=19:00');
    const card = (await screen.findByRole('heading', { name: '1045 Night Mail' })).closest('a')!;
    expect(card).toHaveTextContent('(next day)');
    expect(screen.getByText(/Leaving after 19:00/)).toBeInTheDocument();
  });

  test('whole-hour journeys read "9 h", not "9 h 0 min"', async () => {
    renderRoute('/results?from=colombo-fort&to=badulla&date=2026-11-02');
    const card = (await screen.findByRole('heading', { name: '1001 Denuwara Menike' })).closest('a')!;
    expect(card).toHaveTextContent('Journey time 9 h');
    expect(card).not.toHaveTextContent('0 min');
  });

  test('empty result offers to show the whole day', async () => {
    renderRoute('/results?from=colombo-fort&to=kandy&date=2026-11-02&time=23:00');
    expect(await screen.findByText('No trains found after 23:00 on this day.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Show all trains this day' })).toHaveAttribute(
      'href',
      '/results?from=colombo-fort&to=kandy&date=2026-11-02',
    );
  });

  test('previous day is disabled for today, next day links forward', async () => {
    renderRoute('/results?from=colombo-fort&to=kandy&date=2026-11-01');
    expect(await screen.findByRole('button', { name: 'Previous day' })).toBeDisabled();
    expect(screen.getByRole('link', { name: 'Next day' })).toHaveAttribute('href', '/results?from=colombo-fort&to=kandy&date=2026-11-02');
  });
});
