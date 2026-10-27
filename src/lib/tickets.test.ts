import { getTrip } from '@/api';
import type { SavedTicket } from '@/types';
import { buildTicket, checkTicketFile, formatBytes, sortTickets, type TicketInput } from './tickets';
import { classifyStorageError, clearAllData, reminders, tickets } from './storage';
import { readPref, writePref } from './prefs';

const file = { name: 'ticket.pdf', type: 'application/pdf', size: 1234, data: new Uint8Array([1, 2, 3]).buffer };
const base: TicketInput = {
  id: 't1',
  now: new Date('2026-11-01T12:00:00+05:30'),
  file,
  trainNumber: ' 1045 ',
  fromStationId: 'nawalapitiya',
  toStationId: 'badulla',
  travelDate: '2026-12-10',
  departureTime: '00:35',
  coach: ' B ',
  seat: '',
  fareLkr: 510,
  serviceChargeLkr: 25.5,
};

describe('file check (the file is never parsed)', () => {
  test.each([
    { f: { name: 'a.pdf', type: 'application/pdf', size: 100 }, expected: null },
    { f: { name: 'a.PDF', type: '', size: 100 }, expected: null },
    { f: { name: 'shot.png', type: 'image/png', size: 100 }, expected: null },
    { f: { name: 'a.docx', type: 'application/msword', size: 100 }, expected: 'type' },
    { f: { name: 'big.jpg', type: 'image/jpeg', size: 11 * 1024 * 1024 }, expected: 'size' },
  ])('$f.name → $expected', ({ f, expected }) => {
    expect(checkTicketFile(f)).toBe(expected);
  });
});

describe('buildTicket', () => {
  test('known night train boarded mid-route: refund counts from the origin (earlier)', async () => {
    const trip = await getTrip({ trainId: '1045', date: '2026-12-10', fromStationId: 'nawalapitiya', toStationId: 'badulla' });
    const t = buildTicket({ ...base, trip });
    expect(t).toMatchObject({
      trainNumber: '1045',
      trainId: '1045',
      departure: '2026-12-10T00:35:00+05:30',
      refundDeparture: '2026-12-09T20:00:00+05:30',
      refundBasis: 'origin',
      originStationId: 'colombo-fort',
      coach: 'B',
    });
    expect(t.seat).toBeUndefined();
  });

  test('unknown train: refund counts from the departure entered', () => {
    const t = buildTicket({ ...base, trainNumber: '9999', trip: null });
    expect(t.trainId).toBeUndefined();
    expect(t.refundDeparture).toBe('2026-12-10T00:35:00+05:30');
    expect(t.refundBasis).toBe('entered');
  });

  test('if the entered time is earlier than the timetable origin, the entered time wins (earlier)', async () => {
    const trip = await getTrip({ trainId: '1015', date: '2026-12-10' }); // origin 08:30
    const t = buildTicket({ ...base, trainNumber: '1015', fromStationId: 'colombo-fort', toStationId: 'ella', departureTime: '08:00', trip });
    expect(t.refundDeparture).toBe('2026-12-10T08:00:00+05:30');
    expect(t.refundBasis).toBe('entered');
  });
});

test('sorting: upcoming soonest first, past most recent first', () => {
  const mk = (id: string, departure: string) => ({ id, departure }) as SavedTicket;
  const now = new Date('2026-12-01T00:00:00+05:30');
  const { upcoming, past } = sortTickets(
    [mk('late', '2026-12-20T08:00:00+05:30'), mk('old', '2026-10-01T08:00:00+05:30'), mk('soon', '2026-12-02T08:00:00+05:30'), mk('recent', '2026-11-30T08:00:00+05:30')],
    now,
  );
  expect(upcoming.map((x) => x.id)).toEqual(['soon', 'late']);
  expect(past.map((x) => x.id)).toEqual(['recent', 'old']);
});

test('formatBytes', () => {
  expect(formatBytes(512)).toBe('512 B');
  expect(formatBytes(340 * 1024)).toBe('340 KB');
  expect(formatBytes(1.25 * 1024 * 1024)).toBe('1.3 MB');
});

describe('storage', () => {
  test('tickets (with file bytes) are stored and read back offline', async () => {
    await tickets.clear();
    const t = buildTicket({ ...base, trip: null });
    await tickets.put(t);
    const back = await tickets.get('t1');
    expect(back?.trainNumber).toBe('1045');
    expect(new Uint8Array(back!.file.data)).toEqual(new Uint8Array([1, 2, 3]));
  });

  test.each([
    { name: 'QuotaExceededError', reason: 'full' },
    { name: 'SecurityError', reason: 'unavailable' },
    { name: 'InvalidStateError', reason: 'unavailable' },
    { name: 'WeirdError', reason: 'unknown' },
  ])('$name is explained as "$reason"', ({ name, reason }) => {
    expect(classifyStorageError(new DOMException('x', name)).reason).toBe(reason);
  });

  test('"Delete all my data" removes tickets, reminders and preferences', async () => {
    await tickets.put(buildTicket({ ...base, trip: null }));
    await reminders.put({ id: 'r', kind: 'booking-opens', alerts: [], eventAt: '', createdAt: '', params: {} });
    writePref('recentSearches', '[]');
    const { ok } = await clearAllData();
    expect(ok).toBe(true);
    expect(await tickets.list()).toEqual([]);
    expect(await reminders.list()).toEqual([]);
    expect(readPref('recentSearches')).toBeNull();
  });
});
