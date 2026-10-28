import { cleanup, render, screen, within } from '@testing-library/react';
import { getTrip } from '@/api';
import { setLanguage } from '@/i18n';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';
import { PraveshaCard } from './PraveshaCard';

const DAY_TRAIN = '/train/1015/book?date=2026-12-10&from=colombo-fort&to=ella';
const NIGHT = '/train/1045/book?date=2026-12-10&from=nawalapitiya&to=badulla';
const UNRESERVED = '/train/8059/book?date=2026-12-10&from=colombo-fort&to=matara';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00+05:30'));
});
afterEach(async () => {
  cleanup();
  vi.useRealTimers();
  await setLanguage('en');
});

const section = async (name: string) => within((await screen.findByRole('heading', { name })).closest('section')!);

describe('how many bookings', () => {
  test('warns about the 5-seat limit and splits 7 passengers into 5 + 2', async () => {
    const user = setupUser();
    renderRoute(DAY_TRAIN);
    const plan = await section('How many bookings you need');
    expect(plan.getByText('The official site allows at most 5 seats in one booking.')).toBeInTheDocument();
    expect(plan.getByText('You need 1 booking.')).toBeInTheDocument();

    const input = plan.getByRole('spinbutton', { name: 'Passengers' });
    await user.clear(input);
    await user.type(input, '7');
    expect(plan.getByText('You need 2 separate bookings.')).toBeInTheDocument();
    expect(plan.getByText('Booking 1: 5 passengers, outward trip')).toBeInTheDocument();
    expect(plan.getByText('Booking 2: 2 passengers, outward trip')).toBeInTheDocument();
  });

  test('a simple return goes in the same booking; a different count or station needs its own', async () => {
    const user = setupUser();
    renderRoute(DAY_TRAIN);
    const plan = await section('How many bookings you need');
    await user.click(plan.getByRole('button', { name: 'One passenger more' })); // 2 passengers
    await user.click(plan.getByRole('checkbox', { name: 'I am also booking the return trip' }));

    expect(plan.getByText('You need 1 booking.')).toBeInTheDocument();
    expect(plan.getByText('Booking 1: 2 passengers, outward and return')).toBeInTheDocument();
    expect(plan.getByText(/the return can go in the same booking/)).toBeInTheDocument();

    // Different passenger count on the way back.
    const returnCount = plan.getByRole('spinbutton', { name: 'Passengers on the return trip' });
    await user.click(within(returnCount.parentElement!).getByRole('button', { name: 'One passenger fewer' }));
    expect(plan.getByText('You need 2 separate bookings.')).toBeInTheDocument();
    expect(plan.getByText('Booking 2: 1 passenger, return trip')).toBeInTheDocument();
    expect(plan.getByText('Your return trip has a different number of passengers, so it needs its own booking.')).toBeInTheDocument();

    // Different boarding station on the way back (Badulla instead of Ella).
    await user.click(plan.getByRole('button', { name: /Return trip starts from/ }));
    const dialog = within(await screen.findByRole('dialog'));
    await user.type(dialog.getByRole('searchbox'), 'badulla');
    await user.click(await dialog.findByRole('button', { name: /Badulla/ }));
    expect(plan.getByText('Your return trip does not start where your outward trip ends (Ella), so it needs its own booking.')).toBeInTheDocument();
  });
});

describe('true total', () => {
  test('fare × seats + 5 % convenience fee, card or LANKAQR only', async () => {
    const user = setupUser();
    renderRoute(DAY_TRAIN);
    const cost = await section('What you will pay');
    // Default class is the first reservable one (observation saloon).
    const obsFare = within(cost.getByRole('radio', { name: /1st class observation saloon/ }).closest('label')!).getByText(/^Rs /);
    const fare = Number(obsFare.textContent!.replace(/[^\d.]/g, ''));
    expect(cost.getByTestId('true-total')).toHaveTextContent(`Rs ${(fare * 1.05).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`);

    await user.click(cost.getByRole('radio', { name: /2nd class/ }));
    const plan = await section('How many bookings you need');
    await user.click(plan.getByRole('button', { name: 'One passenger more' }));
    expect(cost.getByText(/^Fare Rs [\d,]+ × 2$/)).toBeInTheDocument();
    expect(cost.getByText('Convenience fee (5 %)')).toBeInTheDocument();
    expect(cost.getByText('Pay by card or LANKAQR only.')).toBeInTheDocument();
  });
});

describe('checklist and email', () => {
  test('every rule is listed, ticking updates progress, nothing is blocked', async () => {
    const user = setupUser();
    renderRoute(DAY_TRAIN);
    const list = await section('Before you pay');
    expect(list.getByText('0 of 5 checked')).toBeInTheDocument();
    for (const text of [
      /NIC or passport number of every passenger/,
      /Tickets cannot be transferred/,
      /ID is checked at the gate\. If it does not match the ticket, the fine is double the fare\./,
      /valid email address\. Without it, the e-ticket will not arrive\./,
      /card or LANKAQR/,
    ]) {
      await user.click(list.getByRole('checkbox', { name: text }));
    }
    expect(list.getByText('5 of 5 checked')).toBeInTheDocument();
    expect(list.getByText('The e-ticket is only sent by email. One wrong letter means no ticket.')).toBeInTheDocument();
  });
});

describe('official handoff', () => {
  test('one link, to the official site only, with the look-alike warning and exact address', async () => {
    renderRoute(DAY_TRAIN);
    const leave = await section('You are leaving Dumriya');
    const link = leave.getByRole('link', { name: 'Continue on official site' });
    expect(link).toHaveAttribute('href', 'https://seatreservation.railway.gov.lk');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(leave.getByText(/Beware of look-alike sites/)).toBeInTheDocument();
    expect(leave.getByTestId('official-host')).toHaveTextContent('seatreservation.railway.gov.lk');

    const external = screen.getAllByRole('link').filter((a) => /^https?:/.test(a.getAttribute('href') ?? ''));
    // Only the two official destinations: reserved seats and Pravesha (for the unreserved 3rd class).
    expect(external.map((a) => a.getAttribute('href'))).toEqual(['https://seatreservation.railway.gov.lk', 'https://www.pravesha.lk']);
  });

  test('copy trip details', async () => {
    const user = setupUser();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderRoute(DAY_TRAIN);
    await user.click(await screen.findByRole('button', { name: 'Copy trip details' }));
    expect(writeText).toHaveBeenCalledWith('1015 Udarata Menike, Colombo Fort to Ella, Thu, 10 Dec 2026, departs 08:30');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
  });
});

describe('uncertain values in plain words', () => {
  test('night train after midnight: both dates and "may be later from your station"', async () => {
    renderRoute(NIGHT);
    const bw = await section('Booking window');
    expect(bw.getByText('Booking opens on Mon, 9 Nov 2026 or Tue, 10 Nov 2026.')).toBeInTheDocument();
    expect(bw.getAllByText('Not confirmed')).toHaveLength(2);
    expect(bw.getByText('(may be later from your station)')).toBeInTheDocument();
    expect(bw.getByText('Booking is not open yet. You can prepare now and come back when it opens.')).toBeInTheDocument();
  });
});

describe('unreserved and Pravesha', () => {
  test('unreserved-only train: no seat booking; Pravesha card with limit (not confirmed) and its own handoff', async () => {
    renderRoute(UNRESERVED);
    const pravesha = await section('Commuter ticket (unreserved)');
    expect(pravesha.getByText('Not on sale yet for this date. Commuter tickets go on sale on Thu, 3 Dec 2026.')).toBeInTheDocument();
    expect(pravesha.getByText('Not confirmed')).toBeInTheDocument();
    expect(
      pravesha.getByText(
        'Pravesha allows at most 5 tickets in one order, including return tickets. This limit is not confirmed by Sri Lanka Railways.',
      ),
    ).toBeInTheDocument();

    const leave = await section('You are leaving Dumriya for Pravesha');
    expect(leave.getByText(/Pravesha, the official commuter ticket service/)).toBeInTheDocument();
    expect(leave.getByTestId('official-host')).toHaveTextContent('www.pravesha.lk');
    const link = leave.getByRole('link', { name: 'Continue on Pravesha' });
    expect(link).toHaveAttribute('href', 'https://www.pravesha.lk');
    expect(link.getAttribute('rel')).toContain('noopener');

    expect(screen.queryByRole('link', { name: 'Continue on official site' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'How many bookings you need' })).not.toBeInTheDocument();
  });

  test('a reservable train with an unreserved class also shows the Pravesha card', async () => {
    renderRoute(DAY_TRAIN);
    const pravesha = await section('Commuter ticket (unreserved)');
    expect(pravesha.getByText('Unreserved on this train: 3rd class.')).toBeInTheDocument();
  });

  test('if PRAVESHA_URL is ever null: "link coming soon", no link or button', async () => {
    const trip = (await getTrip({ trainId: '8059', date: '2026-12-10' }))!;
    render(<PraveshaCard trip={trip} now={new Date('2026-11-01T12:00:00+05:30')} url={null} />);
    const pravesha = await section('Commuter ticket (unreserved)');
    expect(pravesha.getByText('Pravesha: link coming soon')).toBeInTheDocument();
    expect(pravesha.getByText('Until then, buy your ticket at the station counter.')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
