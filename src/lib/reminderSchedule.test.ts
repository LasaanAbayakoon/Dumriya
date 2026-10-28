import type { Reminder, SavedTicket } from '@/types';
import { buildIcs } from './ics';
import { notificationState, showSystemNotification } from './notify';
import { dueAlerts, markFired, nextAlert, refundReminder, reminderIcsEvents, sortReminders, warrantReminder } from './reminders';
import { buildTicket } from './tickets';

const at = (iso: string) => new Date(`${iso}+05:30`);
const iso = (d: Date | string) => new Date(d).toISOString();

describe('warrant reminders: earlier of booking + 7 days and journey − 48 h', () => {
  test('booked well ahead: expires 7 days after booking; alerts 24 h and 2 h before', () => {
    const r = warrantReminder({ bookedAt: at('2026-11-01T10:00:00'), journeyDeparture: at('2026-12-10T08:30:00'), trainNumber: ' 1015 ', now: at('2026-11-01T10:05:00'), id: 'w1' })!;
    expect(iso(r.eventAt)).toBe(iso(at('2026-11-08T10:00:00')));
    expect(r.params).toMatchObject({ trainNumber: '1015', warrantReason: 'days-after-booking' });
    expect(r.alerts.map((a) => iso(a.at))).toEqual([iso(at('2026-11-07T10:00:00')), iso(at('2026-11-08T08:00:00'))]);
    expect(r.alerts.every((a) => a.kind === 'deadline' && iso(a.deadline!) === iso(at('2026-11-08T10:00:00')))).toBe(true);
  });

  test('booked close to the journey: expires 48 h before it', () => {
    const r = warrantReminder({ bookedAt: at('2026-12-05T09:00:00'), journeyDeparture: at('2026-12-10T08:30:00'), now: at('2026-12-05T09:00:00') })!;
    expect(iso(r.eventAt)).toBe(iso(at('2026-12-08T08:30:00')));
    expect(r.params.warrantReason).toBe('hours-before-journey');
  });

  test('alerts already past are dropped; if all are past, one alert at the expiry itself', () => {
    const r = warrantReminder({ bookedAt: at('2026-11-01T10:00:00'), journeyDeparture: at('2026-12-10T08:30:00'), now: at('2026-11-08T09:00:00') })!;
    expect(r.alerts.map((a) => iso(a.at))).toEqual([iso(at('2026-11-08T10:00:00'))]);
  });

  test('already expired at booking (less than 48 h before the journey): no reminder', () => {
    expect(warrantReminder({ bookedAt: at('2026-12-09T09:00:00'), journeyDeparture: at('2026-12-10T08:30:00') })).toBeNull();
  });
});

describe('refund reminders for a saved ticket', () => {
  const ticket = (refundDeparture: string): SavedTicket => ({
    ...buildTicket({
      id: 't1',
      now: at('2026-11-01T12:00:00'),
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
    refundDeparture,
  });

  test('one alert 24 h before each future drop (75→50 and 50→0)', () => {
    const r = refundReminder(ticket('2026-12-10T08:30:00+05:30'), { now: at('2026-11-01T12:00:00') })!;
    expect(r.kind).toBe('refund-deadline');
    expect(r.ticketId).toBe('t1');
    expect(r.alerts.map((a) => [iso(a.at), iso(a.deadline!), a.dropsFrom, a.dropsTo])).toEqual([
      [iso(at('2026-12-02T08:30:00')), iso(at('2026-12-03T08:30:00')), 75, 50],
      [iso(at('2026-12-07T08:30:00')), iso(at('2026-12-08T08:30:00')), 50, 0],
    ]);
  });

  test('a drop less than 24 h away gets an alert in about a minute', () => {
    const now = at('2026-12-07T20:00:00'); // 50 % now; drops to 0 % at 08:30 on 8 Dec
    const r = refundReminder(ticket('2026-12-10T08:30:00+05:30'), { now })!;
    expect(r.alerts).toHaveLength(1);
    expect(Date.parse(r.alerts[0]!.at) - now.getTime()).toBe(60_000);
  });

  test('no drop ahead: no reminder', () => {
    expect(refundReminder(ticket('2026-12-10T08:30:00+05:30'), { now: at('2026-12-09T08:30:00') })).toBeNull();
  });
});

describe('scheduling', () => {
  const mk = (id: string, ats: string[], fired: boolean[] = []): Reminder => ({
    id,
    kind: 'warrant-expiry',
    eventAt: ats[ats.length - 1]!,
    createdAt: ats[0]!,
    params: {},
    alerts: ats.map((a, i) => ({ kind: 'deadline', at: a, ...(fired[i] ? { firedAt: a } : {}) })),
  });
  const now = at('2026-11-05T12:00:00');
  const list = [
    mk('a', ['2026-11-05T11:00:00+05:30', '2026-11-06T11:00:00+05:30']),
    mk('b', ['2026-11-04T11:00:00+05:30'], [true]),
    mk('c', ['2026-11-05T09:00:00+05:30']),
  ];

  test('dueAlerts: unshown alerts at or before now, oldest first', () => {
    expect(dueAlerts(list, now).map((d) => `${d.reminder.id}#${d.index}`)).toEqual(['c#0', 'a#0']);
  });

  test('markFired stops an alert from being due again', () => {
    const a = markFired(list[0]!, 0, now);
    expect(a.alerts[0]!.firedAt).toBeDefined();
    expect(dueAlerts([a], now)).toEqual([]);
    expect(nextAlert(a)?.at).toBe('2026-11-06T11:00:00+05:30');
  });

  test('sortReminders: upcoming by next alert, then finished', () => {
    const { upcoming, done } = sortReminders(list);
    expect(upcoming.map((r) => r.id)).toEqual(['c', 'a']);
    expect(done.map((r) => r.id)).toEqual(['b']);
  });

  test('calendar events have unique ids even with several alerts of the same kind', () => {
    const ics = buildIcs(reminderIcsEvents(list[0]!, () => ({ title: 'x' })));
    const uids = [...ics.matchAll(/^UID:(\S+)$/gm)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(2);
  });
});

describe('notifications fall back gracefully', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'Notification');
    vi.unstubAllGlobals();
  });
  const install = (permission: string) => {
    const ctor = vi.fn();
    Object.assign(ctor, { permission, requestPermission: vi.fn(async () => permission) });
    Object.defineProperty(window, 'Notification', { value: ctor, configurable: true, writable: true });
    vi.stubGlobal('Notification', ctor);
    return ctor;
  };

  test('unsupported browser', async () => {
    Reflect.deleteProperty(window, 'Notification');
    expect(notificationState()).toBe('unsupported');
    expect(await showSystemNotification('t', 'b', 'k')).toBe(false);
  });

  test('denied: nothing is shown', async () => {
    const ctor = install('denied');
    expect(notificationState()).toBe('denied');
    expect(await showSystemNotification('t', 'b', 'k')).toBe(false);
    expect(ctor).not.toHaveBeenCalled();
  });

  test('granted without a service worker: page notification', async () => {
    const ctor = install('granted');
    expect(await showSystemNotification('Reminder', 'Body', 'tag-1')).toBe(true);
    expect(ctor).toHaveBeenCalledWith('Reminder', expect.objectContaining({ body: 'Body', tag: 'tag-1' }));
  });

  test('granted with a service worker: uses it (required on Android)', async () => {
    const ctor = install('granted');
    const showNotification = vi.fn(async () => {});
    Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistration: async () => ({ showNotification }) }, configurable: true });
    expect(await showSystemNotification('Reminder', 'Body', 'tag-2')).toBe(true);
    expect(showNotification).toHaveBeenCalledWith('Reminder', expect.objectContaining({ tag: 'tag-2' }));
    expect(ctor).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, 'serviceWorker');
  });
});
