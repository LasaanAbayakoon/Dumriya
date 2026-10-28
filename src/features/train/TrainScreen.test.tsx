import { cleanup, screen, within } from '@testing-library/react';
import en from '@/i18n/en';
import si from '@/i18n/si';
import ta from '@/i18n/ta';
import { setLanguage, type Language } from '@/i18n';
import { reminders } from '@/lib/storage';
import { formatDate } from '@/lib/format';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

const NAWALAPITIYA = '/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla';
const HATTON_DAY = '/train/1015?date=2026-12-10&from=hatton&to=ella';

beforeEach(() => {
  // Freeze "now" (Date only; real timers keep RTL's waits working).
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00+05:30'));
});
afterEach(async () => {
  cleanup(); // unmount before resetting the language, so nothing updates outside act()
  vi.useRealTimers();
  await setLanguage('en');
});

const bookingCard = async () => within((await screen.findByRole('heading', { name: 'Booking window' })).closest('section')!);

describe('booking window (English)', () => {
  test('daytime train boarded mid-route: date only, time not confirmed, "may be later from your station"', async () => {
    renderRoute(HATTON_DAY);
    const card = await bookingCard();
    expect(card.getByText('Opens on Tue, 10 Nov 2026')).toBeInTheDocument();
    expect(card.getByText('Not confirmed')).toBeInTheDocument();
    expect(card.getByText(/Opening time not confirmed/)).toBeInTheDocument();
    expect(card.getByText(/Online booking closes at 06:30 on Thu, 10 Dec 2026/)).toBeInTheDocument();
    expect(card.getByText('(may be later from your station)')).toBeInTheDocument();
    expect(card.getByText(/That is 2 hours before the train leaves Colombo Fort. From Hatton it may close later/)).toBeInTheDocument();
    expect(card.getByText('Not open yet')).toBeInTheDocument();
  });

  test('Nawalapitiya 00:35 night train shows both possible opening dates in words', async () => {
    renderRoute(NAWALAPITIYA);
    const card = await bookingCard();
    expect(card.getByText('Booking opens on Mon, 9 Nov 2026 or Tue, 10 Nov 2026.')).toBeInTheDocument();
    expect(
      card.getByText(
        'This train leaves Colombo Fort on Wed, 9 Dec 2026, but you board on Thu, 10 Dec 2026. It is not confirmed which date counts, so plan for Mon, 9 Nov 2026.',
      ),
    ).toBeInTheDocument();
    expect(card.getByText(/Online booking closes at 18:00 on Wed, 9 Dec 2026/)).toBeInTheDocument();
    expect(card.getByText('(may be later from your station)')).toBeInTheDocument();
  });

  test('origin boarding has no "may be later" note', async () => {
    renderRoute('/train/1015?date=2026-12-10&from=colombo-fort&to=ella');
    const card = await bookingCard();
    expect(card.getByText(/Online booking closes at 06:30/)).toBeInTheDocument();
    expect(card.queryByText('(may be later from your station)')).not.toBeInTheDocument();
  });
});

describe.each([
  ['en', en],
  ['si', si],
  ['ta', ta],
] as const)('uncertain values are in plain words (%s)', (lng, m) => {
  beforeEach(() => setLanguage(lng as Language));

  test('Nawalapitiya night train', async () => {
    renderRoute(NAWALAPITIYA);
    const h = await screen.findByRole('heading', { name: m.bookingWindow.title });
    const card = within(h.closest('section')!);
    // "Not confirmed" titles: once for the unknown time, once for the two dates.
    expect(card.getAllByText(m.common.notConfirmed)).toHaveLength(2);
    expect(card.getByText(m.bookingWindow.mayBeLater)).toBeInTheDocument();
    const firstSentence = m.bookingWindow.timeNotConfirmed.split('.')[0]!;
    expect(card.getByText(new RegExp(firstSentence))).toBeInTheDocument();
    // The two-dates sentence, with dates formatted for this language.
    const twoDates = m.bookingWindow.twoDates.replace('{{early}}', formatDate('2026-11-09', lng)).replace('{{late}}', formatDate('2026-11-10', lng));
    expect(card.getByText(twoDates)).toBeInTheDocument();
  });
});

describe('reminder sheet', () => {
  beforeEach(() => reminders.clear());

  test('default: one heads-up at 20:00 the evening before; midnight toggle adds 00:00; saves offline', async () => {
    const user = setupUser();
    renderRoute(NAWALAPITIYA);
    await user.click(await screen.findByRole('button', { name: 'Remind me when booking opens' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Booking reminder' }));

    expect(dialog.getByText('Sun, 8 Nov 2026, 20:00: the evening before')).toBeInTheDocument();
    expect(dialog.queryByText(/start of the opening day/)).not.toBeInTheDocument();
    expect(dialog.getByText('Based on the earlier possible opening date, Mon, 9 Nov 2026.')).toBeInTheDocument();

    const toggle = dialog.getByRole('checkbox', {
      name: 'Also alert me at midnight (seats on popular trains can sell out within minutes)',
    });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(dialog.getByText('Mon, 9 Nov 2026, 00:00: start of the opening day')).toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Save reminder' }));
    expect(await dialog.findByRole('status')).toHaveTextContent('Reminder saved. Alerts will be enabled in a later version — use Add to calendar for now.');
    const [saved] = await reminders.list();
    expect(saved?.alerts).toEqual([
      { kind: 'heads-up', at: '2026-11-08T20:00:00+05:30' },
      { kind: 'midnight', at: '2026-11-09T00:00:00+05:30' },
    ]);
    expect(saved?.altEventDate).toBe('2026-11-10');
  });

  test('Escape closes the sheet and returns focus to the button', async () => {
    const user = setupUser();
    renderRoute(NAWALAPITIYA);
    const button = await screen.findByRole('button', { name: 'Remind me when booking opens' });
    await user.click(button);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});

describe('train details', () => {
  test('stop list marks boarding and alighting, fares and running days in words', async () => {
    renderRoute(HATTON_DAY);
    expect(await screen.findByRole('heading', { level: 1, name: '1015 Udarata Menike' })).toBeInTheDocument();
    expect(screen.getByText('You board here.')).toBeInTheDocument();
    expect(screen.getByText('You get off here.')).toBeInTheDocument();
    expect(screen.getByText('Runs every day.')).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: /1st class observation saloon/ })).toBeInTheDocument();
    expect(screen.getByText('Booking online adds a 5 % convenience fee.')).toBeInTheDocument();
  });

  test('unreserved-only train explains Pravesha 7-day rule with the date', async () => {
    renderRoute('/train/8059?date=2026-12-10');
    expect(await screen.findByRole('heading', { name: 'No online seat reservation' })).toBeInTheDocument();
    expect(screen.getByText('Commuter tickets can be bought on Pravesha up to 7 days before travel.')).toBeInTheDocument();
    expect(screen.getByText('For Thu, 10 Dec 2026 you can buy from Thu, 3 Dec 2026.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Booking window' })).not.toBeInTheDocument();
  });

  test('a train that does not run on the date says so', async () => {
    renderRoute('/train/1029?date=2026-12-12'); // Saturday; 1029 is weekdays only
    expect(await screen.findByText('This train does not run on Sat, 12 Dec 2026.')).toBeInTheDocument();
    expect(screen.getByText(/Runs on: Monday, Tuesday, Wednesday, Thursday, Friday/)).toBeInTheDocument();
  });
});
