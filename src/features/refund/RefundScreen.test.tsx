import { act, cleanup, screen, within } from '@testing-library/react';
import { setLanguage } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

const NOW = new Date('2026-11-01T12:00:00+05:30');
const DEP = new Date('2026-12-10T08:30:00+05:30');
const HOUR = 3_600_000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  await setLanguage('en');
});

const section = async (name: string) => within((await screen.findByRole('heading', { name })).closest('section')!);
const manual = (fare = '1000') => `/refund?departure=${encodeURIComponent('2026-12-10T08:30:00+05:30')}&fare=${fare}`;

test('opened from Train detail: departure, fare and 5 % service charge are prefilled', async () => {
  const user = setupUser();
  renderRoute('/train/1015?date=2026-12-10&from=colombo-fort&to=ella');
  await user.click(await screen.findByRole('link', { name: 'If you cancel: refund calculator' }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Refund calculator' })).toBeInTheDocument();
  expect(screen.getByLabelText('Departure date')).toHaveValue('2026-12-10');
  expect(screen.getByLabelText('Departure time')).toHaveValue('08:30');
  const fare = Number((screen.getByLabelText('Ticket fare (Rs)') as HTMLInputElement).value);
  expect(fare).toBeGreaterThan(0);
  expect(screen.getByLabelText('Service charge (not refundable)')).toHaveValue(String(Math.round(fare * 0.05 * 100) / 100));
  expect(await screen.findByText('For 1015 Udarata Menike, Thu, 10 Dec 2026.')).toBeInTheDocument();
});

test('current refund, exact tier timeline in Sri Lanka time, and the next drop', async () => {
  renderRoute(manual());
  const now = await section('If you cancel now');
  expect(now.getByTestId('refund-amount')).toHaveTextContent('You get back Rs 750');
  expect(now.getByText('75 % of the fare')).toBeInTheDocument();
  expect(now.getByText('Not refunded: Rs 300, including the service charge of Rs 50.')).toBeInTheDocument();
  expect(now.getByTestId('refund-countdown')).toHaveTextContent('Drops to 50 % in 31 d 20 h 30 min at 08:30 on Thu, 3 Dec 2026');

  const timeline = await section('Refund timeline');
  const items = timeline.getAllByRole('listitem');
  expect(items.map((li) => li.textContent)).toEqual([
    '75 %More than 168 hours before departureuntil 08:30 on Thu, 3 Dec 2026Now',
    '50 %168 hours or less, but more than 48 hours before departurefrom 08:30 on Thu, 3 Dec 2026 until 08:30 on Tue, 8 Dec 2026',
    '0 %48 hours or less before departurefrom 08:30 on Tue, 8 Dec 2026',
  ]);
  expect(items[0]).toHaveAttribute('aria-current', 'step');
  expect(timeline.getByText(/at exactly 168 hours before departure you get 50 %/)).toBeInTheDocument();
  expect(timeline.getByText('All times are Sri Lanka time.')).toBeInTheDocument();
});

test.each([
  { label: 'exactly 168 h before', msLeft: 168 * HOUR, expected: '50 % of the fare' },
  { label: '168 h + 1 min before', msLeft: 168 * HOUR + 60_000, expected: '75 % of the fare' },
  { label: 'exactly 48 h before', msLeft: 48 * HOUR, expected: null },
])('boundaries come from the tested lib: $label', async ({ msLeft, expected }) => {
  vi.setSystemTime(new Date(DEP.getTime() - msLeft));
  renderRoute(manual());
  const now = await section('If you cancel now');
  if (expected) expect(now.getByText(expected)).toBeInTheDocument();
  else expect(now.getByText('It is 48 hours or less before departure, so no refund is possible.')).toBeInTheDocument();
});

test('countdown is live', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.setSystemTime(NOW);
  renderRoute(manual());
  const now = await section('If you cancel now');
  expect(now.getByTestId('refund-countdown')).toHaveTextContent('31 d 20 h 30 min');
  // Jump to 10 s before the drop, then let the 1-second tick run.
  vi.setSystemTime(new Date(NOW.getTime() + 31 * 24 * HOUR + 20 * HOUR + 29 * 60_000 + 50_000));
  act(() => vi.advanceTimersByTime(1000));
  expect(now.getByTestId('refund-countdown')).toHaveTextContent('Drops to 50 % in 0 h 00 min 09 s');
  act(() => vi.advanceTimersByTime(1000));
  expect(now.getByTestId('refund-countdown')).toHaveTextContent('Drops to 50 % in 0 h 00 min 08 s');
});

test('after departure: no refund', async () => {
  vi.setSystemTime(new Date(DEP.getTime() + HOUR));
  renderRoute(manual());
  expect(await screen.findByText('The train has already left. No refund is possible.')).toBeInTheDocument();
});

test('service charge follows the fare until edited, then stays', async () => {
  const user = setupUser();
  renderRoute('/refund');
  const fare = await screen.findByLabelText('Ticket fare (Rs)');
  const sc = screen.getByLabelText('Service charge (not refundable)');
  await user.type(fare, '2000');
  expect(sc).toHaveValue('100');
  await user.clear(sc);
  await user.type(sc, '80');
  await user.clear(fare);
  await user.type(fare, '3000');
  expect(sc).toHaveValue('80');
});

test('invalid inputs explain the problem in words', async () => {
  const user = setupUser();
  renderRoute('/refund');
  await user.type(await screen.findByLabelText('Ticket fare (Rs)'), 'abc');
  expect(screen.getByText('Enter the fare as a number greater than 0.')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'If you cancel now' })).not.toBeInTheDocument();
});

test('in-person rule is always stated in plain words, even before any input', async () => {
  renderRoute('/refund');
  const how = await section('How to get your refund');
  expect(how.getByText('Refunds are only given in person, at a station counter with mTicketing. You cannot get a refund online.')).toBeInTheDocument();
  expect(how.getByText('Bring a copy of the NIC or passport that was used for the booking.')).toBeInTheDocument();
});

test('boarding mid-route: deadlines count from the origin, and the screen says so (not confirmed)', async () => {
  const user = setupUser();
  renderRoute('/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla');
  await user.click(await screen.findByRole('link', { name: 'If you cancel: refund calculator' }));
  expect(await screen.findByLabelText('Departure date')).toHaveValue('2026-12-09');
  expect(screen.getByLabelText('Departure time')).toHaveValue('20:00');
  expect(
    await screen.findByText(
      'Times are counted from when the train leaves Colombo Fort (20:00 on Wed, 9 Dec 2026), the earliest possible reading. If they are counted from your boarding station instead, you would have a little more time. This is not confirmed.',
    ),
  ).toBeInTheDocument();
});
