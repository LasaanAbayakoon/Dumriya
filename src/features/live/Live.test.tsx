import { cleanup, screen, within } from '@testing-library/react';
import { getFollowEvents, getLivePosition } from '@/api';
import en from '@/i18n/en';
import si from '@/i18n/si';
import ta from '@/i18n/ta';
import { setLanguage, type Language } from '@/i18n';
import { addDays } from '@/lib/time';
import { reminders } from '@/lib/storage';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

// The real Leaflet map is exercised in Playwright; here it is a stand-in.
vi.mock('./LiveTrainMap', () => ({ default: () => <div data-testid="live-map" /> }));

/** First Monday-onwards service date of 1015 matching a condition (the simulation is deterministic). */
async function findDate(test: (d: string) => Promise<boolean>) {
  let d = '2026-11-02';
  for (let i = 0; i < 60; i++, d = addDays(d, 1)) if (await test(d)) return d;
  throw new Error('no matching date in the simulation');
}
const delayedDate = () =>
  findDate(async (d) => (await getFollowEvents('1015', d, { delayOverMin: 15, cancellation: false })).length > 0);
const cancelledDate = () => findDate(async (d) => (await getLivePosition('1015', d, new Date(`${d}T07:00:00+05:30`)))!.status === 'cancelled');

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  await reminders.clear();
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'geolocation');
  vi.unstubAllGlobals();
  await setLanguage('en');
});

describe.each([
  ['en', en],
  ['si', si],
  ['ta', ta],
] as const)('preview label (%s)', (lng, m) => {
  test('live map and station board both show it, separate from the sample-data bar', async () => {
    await setLanguage(lng as Language);
    vi.setSystemTime(new Date('2026-11-02T12:00:00+05:30'));
    renderRoute('/train/1015/live?date=2026-11-02');
    expect(await screen.findByTestId('preview-banner')).toHaveTextContent(m.preview.banner);
    expect(screen.getByTestId('sample-data-banner')).toHaveTextContent(m.common.sampleBanner);
    cleanup();
    renderRoute('/stations/galle/board');
    expect(await screen.findByTestId('preview-banner')).toHaveTextContent(m.preview.banner);
  });
});

describe('live map screen', () => {
  test('status badge, last updated, next stop scheduled vs predicted, and a text list of every stop', async () => {
    const date = await delayedDate();
    vi.setSystemTime(new Date(`${date}T14:00:00+05:30`));
    renderRoute(`/train/1015/live?date=${date}`);
    expect(await screen.findByRole('heading', { level: 1, name: '1015 Udarata Menike' })).toBeInTheDocument();
    expect(await screen.findByText(/^Delayed \d+ min$/)).toBeInTheDocument();
    expect(screen.getByTestId('live-updated')).toHaveTextContent('Last updated 2 min ago');
    expect(screen.getByText(/^Next stop: /)).toBeInTheDocument();
    expect(screen.getByText(/^Scheduled \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(screen.getByText(/^Predicted \d{2}:\d{2}$/)).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Stops (text version of the map)' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(12);
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('Colombo Fort');
    expect(rows[0]).toHaveTextContent('Passed');
    expect(within(table).getByText('Next')).toBeInTheDocument();
    expect(await screen.findByTestId('live-map')).toBeInTheDocument();
  });

  test('a cancelled service says so with the cancelled badge', async () => {
    const date = await cancelledDate();
    vi.setSystemTime(new Date(`${date}T10:00:00+05:30`));
    renderRoute(`/train/1015/live?date=${date}`);
    expect(await screen.findByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('This train is cancelled in the simulation.')).toBeInTheDocument();
  });

  test('before departure: not started, with the departure time', async () => {
    vi.setSystemTime(new Date('2026-11-02T06:00:00+05:30'));
    renderRoute('/train/1015/live?date=2026-11-02');
    expect(await screen.findByText('Not started yet')).toBeInTheDocument();
    expect(screen.getByText('Leaves Colombo Fort at 08:30.')).toBeInTheDocument();
  });
});

describe('"I’m on this train" (preview)', () => {
  test('explains what would be shared and when it stops; never touches location or the network', async () => {
    const user = setupUser();
    vi.setSystemTime(new Date('2026-11-02T12:00:00+05:30'));
    const getCurrentPosition = vi.fn();
    const watchPosition = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition, watchPosition }, configurable: true });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    renderRoute('/train/1015/live?date=2026-11-02');
    await user.click(await screen.findByRole('button', { name: 'I’m on this train' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'I’m on this train (preview)' }));
    expect(dialog.getByText('This is a preview. Dumriya does not read your location here and sends nothing.')).toBeInTheDocument();
    expect(dialog.getByText('Your approximate location, rounded to about 100 m')).toBeInTheDocument();
    expect(dialog.getByText('The train number (1015 Udarata Menike) and the time')).toBeInTheDocument();
    expect(dialog.getByText('Every 60 seconds, only while you have chosen to share and Dumriya is open.')).toBeInTheDocument();
    expect(dialog.getByText('When the train reaches the end of its journey (Badulla)')).toBeInTheDocument();
    expect(dialog.getByText('After 6 hours at most')).toBeInTheDocument();
    expect(dialog.getByText('When you close Dumriya')).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Start demo (nothing is shared)' }));
    expect(dialog.getByRole('status')).toHaveTextContent('Demo running. Nothing is being shared.');
    await user.click(dialog.getByRole('button', { name: 'Stop demo' }));

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(watchPosition).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('follow a train', () => {
  test('saves a follow reminder with the simulated delay event; the alert engine fires it', async () => {
    const user = setupUser();
    const date = await delayedDate();
    vi.setSystemTime(new Date(`${date}T07:00:00+05:30`));
    renderRoute(`/train/1015/live?date=${date}`);
    const card = within((await screen.findByRole('heading', { name: 'Follow this train' })).closest('section')!);
    expect(card.getByRole('checkbox', { name: 'Alert me if it is delayed more than' })).toBeChecked();
    expect(card.getByRole('combobox', { name: 'Delay limit' })).toHaveValue('15');
    await user.click(card.getByRole('button', { name: 'Follow this train' }));
    expect(await card.findByText('Following. Alerts will appear like your other reminders.')).toBeInTheDocument();
    // The card then re-reads the saved reminder: wait for it (the button becomes Update).
    await card.findByRole('button', { name: 'Update' });
    expect(card.getByTestId('follow-events')).toHaveTextContent(/more than 15 min late at .+ \(\d+ min\)/);

    const [saved] = await reminders.list();
    expect(saved).toMatchObject({ kind: 'train-follow', params: { trainNumber: '1015', followDelayOverMin: 15, followCancellation: true } });
    const alert = saved!.alerts[0]!;
    expect(alert.kind).toBe('delay');

    // When the simulated moment comes, the Stage 7 engine shows it.
    cleanup();
    vi.setSystemTime(new Date(Date.parse(alert.at) + 60_000));
    renderRoute('/more');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      new RegExp(`Train 1015 Udarata Menike is running ${alert.delayMin} min late at .+ \\(simulated\\)\\.`),
    );
  });

  test('cancelled service: the follow reminder carries a cancellation alert', async () => {
    const user = setupUser();
    const date = await cancelledDate();
    vi.setSystemTime(new Date(`${date}T05:00:00+05:30`));
    renderRoute(`/train/1015/live?date=${date}`);
    const card = within((await screen.findByRole('heading', { name: 'Follow this train' })).closest('section')!);
    await user.click(card.getByRole('button', { name: 'Follow this train' }));
    expect(await card.findByText(/: cancelled$/)).toBeInTheDocument();
    await card.findByRole('button', { name: 'Update' });
    expect((await reminders.list())[0]!.alerts).toEqual([{ kind: 'cancelled', at: `${date}T06:30:00+05:30` }]);
  });

  test('needs at least one alert; Stop following removes it', async () => {
    const user = setupUser();
    vi.setSystemTime(new Date('2026-11-02T07:00:00+05:30'));
    renderRoute('/train/1015/live?date=2026-11-02');
    const card = within((await screen.findByRole('heading', { name: 'Follow this train' })).closest('section')!);
    await user.click(card.getByRole('checkbox', { name: 'Alert me if it is delayed more than' }));
    await user.click(card.getByRole('checkbox', { name: 'Alert me if it is cancelled' }));
    await user.click(card.getByRole('button', { name: 'Follow this train' }));
    expect(card.getByText('Choose at least one alert.')).toBeInTheDocument();
    expect(await reminders.list()).toEqual([]);

    await user.click(card.getByRole('checkbox', { name: 'Alert me if it is cancelled' }));
    await user.click(card.getByRole('button', { name: 'Follow this train' }));
    await card.findByRole('button', { name: 'Stop following' });
    await user.click(card.getByRole('button', { name: 'Stop following' }));
    expect(await card.findByText('No longer following this train.')).toBeInTheDocument();
    // The card re-reads its saved state: wait until it offers to follow again.
    expect(await card.findByRole('button', { name: 'Follow this train' })).toBeInTheDocument();
    expect(await reminders.list()).toEqual([]);
  });
});

describe('station board', () => {
  test('next departures with scheduled vs expected, status and platform', async () => {
    vi.setSystemTime(new Date('2026-11-02T06:00:00+05:30'));
    renderRoute('/stations/galle/board');
    expect(await screen.findByRole('heading', { level: 1, name: 'Departures: Galle' })).toBeInTheDocument();
    const list = within(within(screen.getByRole('main')).getAllByRole('list')[0]!);
    const first = (await list.findAllByRole('link'))[0]!;
    expect(first).toHaveTextContent('06:20');
    expect(first).toHaveTextContent('8058 Ruhunu Kumari');
    expect(first).toHaveTextContent(/On time|Delayed \d+ min|Cancelled/);
    expect(first).toHaveTextContent('Platform 1');
    expect(list.getAllByText('Platform not known').length).toBeGreaterThan(0);
  });
});
