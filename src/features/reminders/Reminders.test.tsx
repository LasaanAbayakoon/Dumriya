import { act, cleanup, screen, within } from '@testing-library/react';
import { getTrip } from '@/api';
import { setLanguage } from '@/i18n';
import { bookingWindowForTrip } from '@/lib/bookingWindow';
import { bookingOpensReminder } from '@/lib/reminders';
import { reminders, tickets } from '@/lib/storage';
import { buildTicket } from '@/lib/tickets';
import type { Reminder } from '@/types';
import { renderRoute } from '@/test/renderRoute';
import { setupUser } from '@/test/user';

const NOW = new Date('2026-11-01T12:00:00+05:30');
const at = (iso: string) => `${iso}+05:30`;

/** A fake Notification API with a given permission; returns the constructor spy. */
function installNotifications(permission: 'default' | 'granted' | 'denied', grantOnRequest = permission) {
  const ctor = vi.fn();
  const api = { permission, requestPermission: vi.fn(async () => ((api.permission = grantOnRequest), grantOnRequest)) };
  Object.assign(ctor, api);
  Object.defineProperty(ctor, 'permission', { get: () => api.permission, configurable: true });
  Object.defineProperty(window, 'Notification', { value: ctor, configurable: true, writable: true });
  return { ctor, requestPermission: api.requestPermission };
}

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  await reminders.clear();
  await tickets.clear();
});
afterEach(async () => {
  cleanup();
  Reflect.deleteProperty(window, 'Notification');
  vi.useRealTimers();
  await setLanguage('en');
});

describe('permission prompt', () => {
  test('asks clearly, and only when the user taps "Turn on alerts"', async () => {
    const user = setupUser();
    const { requestPermission } = installNotifications('default', 'granted');
    renderRoute('/reminders');
    expect(await screen.findByRole('heading', { name: 'Turn on phone alerts?' })).toBeInTheDocument();
    expect(screen.getByText(/It only uses this for the reminders on this screen/)).toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Turn on alerts' }));
    expect(requestPermission).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Phone alerts are on.')).toBeInTheDocument();
  });

  test('denied: explains what still works', async () => {
    installNotifications('denied');
    renderRoute('/reminders');
    expect(await screen.findByText(/Phone alerts are blocked for Dumriya in your browser settings\. Alerts will still show inside Dumriya/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Turn on alerts' })).not.toBeInTheDocument();
  });

  test('unsupported: explains what still works', async () => {
    renderRoute('/reminders');
    expect(await screen.findByText(/This browser cannot show phone alerts/)).toBeInTheDocument();
  });

  test('how alerts work is stated in plain words', async () => {
    renderRoute('/reminders');
    expect(await screen.findByText(/If the phone is off or Dumriya is closed, the alert appears the next time you open it/)).toBeInTheDocument();
  });
});

describe('alerts actually fire', () => {
  const due = (minutesAgo: number): Reminder => ({
    id: 'w-due',
    kind: 'warrant-expiry',
    eventAt: at('2026-11-02T10:00:00'),
    createdAt: at('2026-10-26T10:00:00'),
    params: { trainNumber: '1015' },
    alerts: [{ kind: 'deadline', at: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(), deadline: at('2026-11-02T10:00:00') }],
  });

  test('a due alert shows as a phone notification and in the app, once, and is marked as shown', async () => {
    const { ctor } = installNotifications('granted');
    await reminders.put(due(1));
    renderRoute('/more');
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent('Your warrant reservation for train 1015 expires at 10:00 on Mon, 2 Nov 2026. Confirm it at a station before then.');
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(ctor).toHaveBeenCalledWith('Reminder', expect.objectContaining({ tag: 'w-due-0' }));
    expect((await reminders.get('w-due'))!.alerts[0]!.firedAt).toBe('2026-11-01T12:00:00+05:30');

    // Another check (app comes back to the foreground) does not repeat it.
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await new Promise((r) => setTimeout(r, 50));
    expect(ctor).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  test('alerts denied: still shown inside the app', async () => {
    const { ctor } = installNotifications('denied');
    await reminders.put(due(1));
    renderRoute('/more');
    expect(await screen.findByRole('alert')).toHaveTextContent('Your warrant reservation for train 1015 expires');
    expect(ctor).not.toHaveBeenCalled();
  });

  test('an alert missed while the app was closed shows when it opens, saying when it was due', async () => {
    await reminders.put(due(90));
    renderRoute('/more');
    expect(await screen.findByRole('alert')).toHaveTextContent('This alert was due at 10:30 on Sun, 1 Nov 2026.');
  });

  test('an alert that comes due while the app is open fires on the next check', async () => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(NOW);
    const { ctor } = installNotifications('granted');
    await reminders.put({ ...due(0), alerts: [{ kind: 'deadline', at: new Date(NOW.getTime() + 20_000).toISOString(), deadline: at('2026-11-02T10:00:00') }] });
    renderRoute('/more');
    await screen.findByRole('heading', { level: 1, name: 'More' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    vi.setSystemTime(new Date(NOW.getTime() + 30_000));
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(ctor).toHaveBeenCalledTimes(1);
  });

  test('dismiss hides the banner', async () => {
    const user = setupUser();
    await reminders.put(due(1));
    renderRoute('/more');
    const banner = await screen.findByRole('alert');
    await user.click(within(banner).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('reminder list', () => {
  test('booking reminder shows what it is about in plain words, with its alerts', async () => {
    const trip = (await getTrip({ trainId: '1045', date: '2026-12-10', fromStationId: 'nawalapitiya', toStationId: 'badulla' }))!;
    await reminders.put(bookingOpensReminder(trip, bookingWindowForTrip(trip, NOW), { midnight: true, now: NOW, id: 'b1' }));
    renderRoute('/reminders');
    const card = (await screen.findByRole('heading', { name: '1045 Night Mail · Thu, 10 Dec 2026' })).closest('article')!;
    expect(within(card).getByText('Booking opens')).toBeInTheDocument();
    expect(within(card).getByText('Opens on Mon, 9 Nov 2026 or Tue, 10 Nov 2026. Exact time not confirmed.')).toBeInTheDocument();
    expect(await within(card).findByText('Nawalapitiya to Badulla')).toBeInTheDocument();
    expect(within(card).getByText('20:00 on Sun, 8 Nov 2026')).toBeInTheDocument();
    expect(within(card).getByText('00:00 on Mon, 9 Nov 2026')).toBeInTheDocument();
    expect(within(card).getByText('Next alert: 20:00 on Sun, 8 Nov 2026')).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Add to calendar (.ics)' })).toBeInTheDocument();
  });

  test('delete asks first', async () => {
    const user = setupUser();
    const trip = (await getTrip({ trainId: '1015', date: '2026-12-10' }))!;
    await reminders.put(bookingOpensReminder(trip, bookingWindowForTrip(trip, NOW), { now: NOW, id: 'b2' }));
    renderRoute('/reminders');
    await user.click(await screen.findByRole('button', { name: 'Delete reminder' }));
    const dialog = within(await screen.findByRole('dialog', { name: 'Delete this reminder?' }));
    await user.click(dialog.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('No reminders yet.')).toBeInTheDocument();
    expect(await reminders.list()).toEqual([]);
  });
});

describe('warrant reminder form', () => {
  test('previews the expiry and the rule that applied, then saves it', async () => {
    const user = setupUser();
    renderRoute('/reminders');
    await user.type(await screen.findByLabelText('Date you booked'), '2026-11-01');
    await user.type(screen.getByLabelText('Time you booked'), '10:00');
    await user.type(screen.getByLabelText('Journey date'), '2026-12-10');
    await user.type(screen.getByLabelText('Train departure time'), '08:30');
    expect(screen.getByTestId('warrant-preview')).toHaveTextContent('Expires at 10:00 on Sun, 8 Nov 2026.');
    expect(screen.getByText('That is 7 days after you booked.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save warrant reminder' }));

    expect(await screen.findByText('Reminder saved on this phone.')).toBeInTheDocument();
    const card = (await screen.findByText('Warrant reservation expires')).closest('article')!;
    expect(within(card).getByText('Expires at 10:00 on Sun, 8 Nov 2026. Confirm it at a station before then.')).toBeInTheDocument();
    expect(within(card).getByText('Next alert: 10:00 on Sat, 7 Nov 2026')).toBeInTheDocument();
  });

  test('a warrant booked inside the last 48 hours is already expired, in words', async () => {
    const user = setupUser();
    renderRoute('/reminders');
    await user.type(await screen.findByLabelText('Date you booked'), '2026-12-09');
    await user.type(screen.getByLabelText('Time you booked'), '09:00');
    await user.type(screen.getByLabelText('Journey date'), '2026-12-10');
    await user.type(screen.getByLabelText('Train departure time'), '08:30');
    expect(screen.getByRole('alert')).toHaveTextContent('This warrant has already expired: it was booked less than 48 hours before the journey. Ask at a station.');
    await user.click(screen.getByRole('button', { name: 'Save warrant reminder' }));
    expect(await reminders.list()).toEqual([]);
  });
});

test('ticket detail: "Remind me before the refund drops" creates a refund reminder', async () => {
  const user = setupUser();
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  await tickets.put(
    buildTicket({
      id: 'tk',
      now: NOW,
      file: { name: 'a.pdf', type: 'application/pdf', size: 1, data: new ArrayBuffer(1) },
      trainNumber: '1015',
      fromStationId: 'colombo-fort',
      toStationId: 'ella',
      travelDate: '2026-12-10',
      departureTime: '08:30',
      fareLkr: 1000,
      serviceChargeLkr: 50,
      trip: null,
    }),
  );
  renderRoute('/tickets/tk');
  await user.click(await screen.findByRole('button', { name: 'Remind me before the refund drops' }));
  expect(await screen.findByText('Reminder saved on this phone. You can see it under Reminders.')).toBeInTheDocument();

  cleanup();
  renderRoute('/reminders');
  const card = (await screen.findByText('Refund drops')).closest('article')!;
  expect(within(card).getByText('Refund drops from 75 % to 50 % at 08:30 on Thu, 3 Dec 2026.')).toBeInTheDocument();
  expect(within(card).getByText('Refund drops from 50 % to 0 % at 08:30 on Tue, 8 Dec 2026.')).toBeInTheDocument();
});
