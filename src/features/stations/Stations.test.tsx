import { cleanup, screen, within } from '@testing-library/react';
import { setLanguage } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

// The real map (Leaflet) is exercised in Playwright; here we only check WHEN it loads.
const mapRendered = vi.fn();
vi.mock('./StationMap', () => ({
  default: (props: { stations: unknown[] }) => {
    mapRendered(props);
    return <div data-testid="station-map" />;
  },
}));

const GALLE = { latitude: 6.04, longitude: 80.22 };
/** The station list (the bottom navigation is a list too, so look inside <main>). */
const stationList = async () => within(await within(screen.getByRole('main')).findByRole('list'));

function installGeolocation(result: { coords: typeof GALLE } | { code: number }) {
  const getCurrentPosition = vi.fn((ok: PositionCallback, fail: PositionErrorCallback) => {
    if ('coords' in result) ok({ coords: result.coords } as GeolocationPosition);
    else fail({ code: result.code } as GeolocationPositionError);
  });
  Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });
  return getCurrentPosition;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-02T06:00:00+05:30')); // Monday morning
  mapRendered.mockClear();
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'geolocation');
  await setLanguage('en');
});

describe('station list', () => {
  test.each([
    { query: 'ගාල්ල', expected: 'Galle' },
    { query: 'காலி', expected: 'Galle' },
    { query: 'galle', expected: 'Galle' },
    { query: 'KDT', expected: 'Kandy' },
  ])('search "$query" finds $expected', async ({ query, expected }) => {
    const user = setupUser();
    renderRoute('/stations');
    await user.type(await screen.findByRole('searchbox', { name: 'Search stations' }), query);
    const list = await stationList();
    expect(await list.findByText(expected)).toBeInTheDocument();
    expect(list.getAllByRole('link')[0]).toHaveTextContent(expected);
  });

  test('shows lines served for each station', async () => {
    renderRoute('/stations');
    const fort = (await screen.findByText('Colombo Fort')).closest('a')!;
    expect(within(fort).getByText('Main line')).toBeInTheDocument();
    expect(within(fort).getByText('Coastal line')).toBeInTheDocument();
  });
});

describe('Near me', () => {
  test('asks for location only after the tap, sorts by distance, stores nothing', async () => {
    const user = setupUser();
    const getCurrentPosition = installGeolocation({ coords: GALLE });
    const before = JSON.stringify(Object.entries(localStorage).sort());
    const { router } = renderRoute('/stations');
    await screen.findByText('Colombo Fort');
    expect(getCurrentPosition).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Near me' }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Sorted by distance from you.')).toBeInTheDocument();
    const first = (await stationList()).getAllByRole('link')[0]!;
    expect(first).toHaveTextContent('Galle');
    expect(first).toHaveTextContent(/\d+\.\d km away/);
    expect(screen.getByText('Your location is only used on this phone to sort the list. It is not saved or sent.')).toBeInTheDocument();

    expect(JSON.stringify(Object.entries(localStorage).sort())).toBe(before);
    expect(router.state.location.search).toBe('');

    await user.click(screen.getByRole('button', { name: 'Stop using my location' }));
    expect(screen.queryByText(/km away/)).not.toBeInTheDocument();
  });

  test('refused: explains in plain words and the list still works', async () => {
    const user = setupUser();
    installGeolocation({ code: 1 });
    renderRoute('/stations');
    await user.click(await screen.findByRole('button', { name: 'Near me' }));
    expect(await screen.findByText(/Location permission was refused, so the list is in A–Z order/)).toBeInTheDocument();
    expect((await stationList()).getAllByRole('link').length).toBeGreaterThan(15);
  });

  test('unsupported browser: explains and still works', async () => {
    const user = setupUser();
    renderRoute('/stations');
    await user.click(await screen.findByRole('button', { name: 'Near me' }));
    expect(await screen.findByText('This browser cannot share your location. The list is in A–Z order.')).toBeInTheDocument();
  });
});

describe('map', () => {
  test('is not loaded until the Map view is chosen', async () => {
    const user = setupUser();
    renderRoute('/stations');
    await screen.findByText('Colombo Fort');
    expect(screen.queryByTestId('station-map')).not.toBeInTheDocument();
    expect(mapRendered).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Map' }));
    expect(await screen.findByTestId('station-map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('station detail', () => {
  test('lines, sample-labelled flags, next departures, directions via ExternalLink', async () => {
    renderRoute('/stations/galle');
    expect(await screen.findByRole('heading', { level: 1, name: 'Galle' })).toBeInTheDocument();
    expect(screen.getByText('ගාල්ල · காலி')).toBeInTheDocument();
    expect(screen.getByText('Coastal line')).toBeInTheDocument();
    expect(screen.getByText('Sample timetable — not real times')).toBeInTheDocument();

    const facilities = within(screen.getByRole('heading', { name: 'At this station' }).closest('section')!);
    expect(facilities.getByText('Sample — not confirmed')).toBeInTheDocument();
    expect(facilities.getByText('These details are sample data. They have not been confirmed with Sri Lanka Railways.')).toBeInTheDocument();
    for (const name of ['Reservation counter', 'mTicketing counter', 'Pravesha ticket check']) {
      expect(facilities.getByText(name).nextElementSibling).toHaveTextContent('Yes');
    }

    const departures = within(screen.getByRole('heading', { name: 'Next departures' }).closest('section')!);
    const first = (await departures.findAllByRole('link'))[0]!;
    expect(first).toHaveTextContent('06:20');
    expect(first).toHaveTextContent('8058 Ruhunu Kumari');
    expect(first).toHaveAttribute('href', '/train/8058?date=2026-11-02&from=galle&to=colombo-fort');

    const directions = screen.getByRole('link', { name: 'Directions (Google Maps)' });
    expect(directions).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=6.0329,80.2141');
    expect(directions).toHaveAttribute('target', '_blank');
    expect(directions.getAttribute('rel')!.split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
    expect(screen.getByRole('link', { name: 'Show on map' })).toHaveAttribute('href', '/stations?view=map&focus=galle');
  });

  test('a station without a flag says "No" in words', async () => {
    renderRoute('/stations/hikkaduwa');
    const facilities = within((await screen.findByRole('heading', { name: 'At this station' })).closest('section')!);
    expect(facilities.getByText('Reservation counter').nextElementSibling).toHaveTextContent('No');
  });

  test('unknown station', async () => {
    renderRoute('/stations/nowhere');
    expect(await screen.findByText('This station could not be found.')).toBeInTheDocument();
  });
});
