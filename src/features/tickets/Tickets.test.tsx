import { cleanup, screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { setLanguage } from '@/i18n';
import { StorageError, tickets } from '@/lib/storage';
import { buildTicket } from '@/lib/tickets';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

const NAWALAPITIYA = '/train/1045?date=2026-12-10&from=nawalapitiya&to=badulla';
const pdf = () => new File(['%PDF-1.4 sample'], 'eticket.pdf', { type: 'application/pdf' });

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00+05:30'));
  URL.createObjectURL = vi.fn(() => 'blob:mock-ticket');
  URL.revokeObjectURL = vi.fn();
  await tickets.clear();
});
afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  await setLanguage('en');
});

const saveOne = () =>
  tickets.put(
    buildTicket({
      id: 'saved-1',
      now: new Date(),
      file: { name: 'eticket.pdf', type: 'application/pdf', size: 2048, data: new Uint8Array(2048).buffer },
      trainNumber: '1015',
      fromStationId: 'colombo-fort',
      toStationId: 'ella',
      travelDate: '2026-12-10',
      departureTime: '08:30',
      coach: 'A',
      seat: '14',
      fareLkr: 1000,
      serviceChargeLkr: 50,
      trip: null,
    }),
  );

test('empty wallet explains itself and shows storage used', async () => {
  renderRoute('/tickets');
  expect(await screen.findByText('No tickets saved yet.')).toBeInTheDocument();
  expect(screen.getByText('Saved on this phone only. Works without internet.')).toBeInTheDocument();
  expect(screen.getByTestId('tickets-usage')).toHaveTextContent('Your tickets use 0 B on this phone.');
});

test('save from Train detail: details are prefilled to confirm; file stored; refund countdown and calculator link', async () => {
  const user = setupUser();
  renderRoute(NAWALAPITIYA);
  await user.click(await screen.findByRole('link', { name: 'Already booked? Save your e-ticket' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Add a ticket' })).toBeInTheDocument();
  expect(screen.getByText('Dumriya does not read your ticket file. Type the details exactly as they appear on the ticket.')).toBeInTheDocument();
  expect(screen.getByLabelText('Train number')).toHaveValue('1045');
  expect(await screen.findByText('Found in the timetable: 1045 Night Mail')).toBeInTheDocument();
  expect(screen.getByLabelText('Date of travel')).toHaveValue('2026-12-10');
  expect(screen.getByLabelText('Departure time')).toHaveValue('00:35');
  expect(screen.getByTestId('ticket-chosen')).toHaveTextContent('You chose: Thu, 10 Dec 2026, 00:35 (Sri Lanka time)');

  await user.upload(screen.getByLabelText('E-ticket file (PDF or photo)'), pdf());
  expect(screen.getByText(/Chosen: eticket\.pdf/)).toBeInTheDocument();
  await user.type(screen.getByLabelText('Coach (optional)'), 'B');
  await user.type(screen.getByLabelText('Seat (optional)'), '12');
  await user.type(screen.getByLabelText('Ticket fare (Rs)'), '510');
  expect(screen.getByLabelText('Service charge (not refundable)')).toHaveValue('25.50');
  await user.click(screen.getByRole('button', { name: 'Save ticket' }));

  expect(await screen.findByRole('heading', { level: 1, name: 'Train 1045' })).toBeInTheDocument();
  expect(screen.getByText('Coach B, seat 12')).toBeInTheDocument();
  const refund = within(screen.getByRole('heading', { name: 'Refund if you cancel' }).closest('section')!);
  expect(refund.getByText('Refund if you cancel now: 75 % (Rs 382.50)')).toBeInTheDocument();
  expect(refund.getByTestId('ticket-countdown')).toHaveTextContent(/^Drops to 50 % in 31 d 8 h 0 min at 20:00 on Wed, 2 Dec 2026$/);
  // Station names load separately; wait for them.
  expect(await refund.findByText(/counted from when the train leaves Colombo Fort \(20:00 on Wed, 9 Dec 2026\)/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open ticket file' })).toHaveAttribute('href', 'blob:mock-ticket');

  const stored = await tickets.list();
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ trainNumber: '1045', coach: 'B', seat: '12', fareLkr: 510, refundBasis: 'origin' });
  expect(new TextDecoder().decode(stored[0]!.file.data)).toBe('%PDF-1.4 sample');

  // Opens the refund calculator prefilled with the ticket.
  await user.click(refund.getByRole('link', { name: 'Open refund calculator' }));
  expect(await screen.findByLabelText('Departure date')).toHaveValue('2026-12-09');
  expect(screen.getByLabelText('Departure time')).toHaveValue('20:00');
  expect(screen.getByLabelText('Ticket fare (Rs)')).toHaveValue('510.00');
  expect(screen.getByLabelText('Service charge (not refundable)')).toHaveValue('25.50');
});

test('list shows the ticket with seat and a live refund line', async () => {
  await saveOne();
  renderRoute('/tickets');
  const card = (await screen.findByRole('heading', { name: 'Train 1015' })).closest('a')!;
  expect(await within(card).findByText('Colombo Fort to Ella')).toBeInTheDocument();
  expect(within(card).getByText('Coach A, seat 14')).toBeInTheDocument();
  expect(within(card).getByText('Refund if you cancel now: 75 % (Rs 750.00)')).toBeInTheDocument();
  expect(within(card).getByTestId('ticket-countdown')).toHaveTextContent(/^Drops to 50 % in 31 d 20 h 30 min$/);
  expect(screen.getByRole('heading', { name: 'Upcoming trips' })).toBeInTheDocument();
  expect(screen.getByTestId('tickets-usage')).toHaveTextContent('Your tickets use 2 KB on this phone.');
});

describe('form checks', () => {
  test('missing details are explained and focus goes to the file field first', async () => {
    const user = setupUser();
    renderRoute('/tickets/new');
    await user.click(await screen.findByRole('button', { name: 'Save ticket' }));
    expect(screen.getByText('Choose your e-ticket file.')).toBeInTheDocument();
    expect(screen.getByText('Choose the station you are leaving from.')).toBeInTheDocument();
    expect(screen.getByLabelText('E-ticket file (PDF or photo)')).toHaveFocus();
    expect(await tickets.list()).toEqual([]);
  });

  test('a file that is not a PDF or image is refused in plain words', async () => {
    const user = setupUser({ applyAccept: false });
    renderRoute('/tickets/new');
    await user.upload(await screen.findByLabelText('E-ticket file (PDF or photo)'), new File(['x'], 'notes.docx', { type: 'application/msword' }));
    expect(screen.getByText('This is not a PDF or an image. Choose the e-ticket PDF, or a photo or screenshot of it.')).toBeInTheDocument();
  });

  test('a file over 10 MB is refused in plain words', async () => {
    const user = setupUser();
    renderRoute('/tickets/new');
    const big = new File(['x'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: 11 * 1024 * 1024 });
    await user.upload(await screen.findByLabelText('E-ticket file (PDF or photo)'), big);
    expect(screen.getByText('This file is larger than 10.0 MB. Choose a smaller file, for example a screenshot.')).toBeInTheDocument();
  });
});

describe('when the browser refuses storage', () => {
  async function fillValid(user: ReturnType<typeof userEvent.setup>) {
    renderRoute('/tickets/new?train=1015&date=2026-12-10&from=colombo-fort&to=ella&time=08:30&fare=1000');
    await user.upload(await screen.findByLabelText('E-ticket file (PDF or photo)'), pdf());
    await screen.findByText('Found in the timetable: 1015 Udarata Menike');
  }

  test.each([
    {
      reason: 'full' as const,
      message:
        'This ticket could not be saved: there is not enough space on this phone. Free up some space, or keep the e-ticket email or PDF instead.',
    },
    {
      reason: 'unavailable' as const,
      message:
        'This ticket could not be saved: your browser is blocking storage, for example in private browsing. Keep the e-ticket email or PDF instead.',
    },
  ])('$reason: plain-words error, stays on the form', async ({ reason, message }) => {
    const user = setupUser();
    vi.spyOn(tickets, 'put').mockRejectedValue(new StorageError(reason));
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Save ticket' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('heading', { level: 1, name: 'Add a ticket' })).toBeInTheDocument();
  });

  test('a blocked list shows a plain-words error', async () => {
    vi.spyOn(tickets, 'list').mockRejectedValue(new StorageError('unavailable'));
    renderRoute('/tickets');
    expect(
      await screen.findByText('Saved tickets cannot be shown: this browser is blocking storage, for example in private browsing.'),
    ).toBeInTheDocument();
  });
});

describe('deleting', () => {
  test('asks first; Cancel keeps the ticket, Delete removes it', async () => {
    const user = setupUser();
    await saveOne();
    renderRoute('/tickets/saved-1');
    await user.click(await screen.findByRole('button', { name: 'Delete ticket' }));
    let dialog = within(await screen.findByRole('dialog', { name: 'Delete this ticket?' }));
    expect(dialog.getByText('It will be removed from this phone. This cannot be undone.')).toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Cancel' }));
    expect(await tickets.list()).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Delete ticket' }));
    dialog = within(await screen.findByRole('dialog', { name: 'Delete this ticket?' }));
    await user.click(dialog.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('No tickets saved yet.')).toBeInTheDocument();
    expect(await tickets.list()).toEqual([]);
  });

  test('"Delete all my data" in Settings also removes tickets', async () => {
    const user = setupUser();
    await saveOne();
    renderRoute('/settings');
    await user.click(await screen.findByRole('button', { name: 'Delete all my data' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Delete all your data?' }));
    await user.click(dialog.getByRole('button', { name: 'Delete everything' }));
    expect(await screen.findByText('All your data has been deleted from this phone.')).toBeInTheDocument();
    // Settings re-reads storage after deleting; wait for it to show nothing left.
    expect(await screen.findByText('Your tickets use 0 B on this phone.')).toBeInTheDocument();
    expect(await tickets.list()).toEqual([]);
    expect(localStorage.getItem('dumriya.lang')).toBeNull();
    expect(localStorage.getItem('dumriya.theme')).toBeNull();
  });
});
