import { getTrip } from '@/api';
import { BOOKING_HEADS_UP_TIME, BOOKING_MIDNIGHT_ALERT_DEFAULT, BOOKING_MIDNIGHT_ALERT_TIME } from '@/config/app';
import { bookingOpenAlerts, bookingWindow, bookingWindowForTrip } from './bookingWindow';
import { buildIcs, foldLine, icsTime } from './ics';
import { bookingOpensReminder, reminderIcsEvents } from './reminders';
import { reminders } from './storage';

const at = (iso: string) => new Date(`${iso}+05:30`);
const iso = (d: Date) => d.toISOString();

test('alert times are config values: 20:00 heads-up, optional 00:00 alert, off by default', () => {
  expect(BOOKING_HEADS_UP_TIME).toBe('20:00');
  expect(BOOKING_MIDNIGHT_ALERT_TIME).toBe('00:00');
  expect(BOOKING_MIDNIGHT_ALERT_DEFAULT).toBe(false);
});

describe('bookingOpenAlerts with the opening time NOT confirmed', () => {
  // Opens (earliest) 10 Nov 2026.
  const w = bookingWindow({
    serviceDate: '2026-12-10',
    boardingDate: '2026-12-10',
    originDeparture: at('2026-12-10T08:30:00'),
    boardingDeparture: at('2026-12-10T08:30:00'),
    openTime: null,
  });
  const now = at('2026-11-01T12:00:00');

  test('default: only the heads-up at 20:00 the evening before', () => {
    const alerts = bookingOpenAlerts(w, { now });
    expect(alerts.map((a) => [a.kind, iso(a.at)])).toEqual([['heads-up', iso(at('2026-11-09T20:00:00'))]]);
  });

  test('with the midnight toggle on: heads-up plus 00:00 on the opening date', () => {
    const alerts = bookingOpenAlerts(w, { now, midnight: true });
    expect(alerts.map((a) => [a.kind, iso(a.at)])).toEqual([
      ['heads-up', iso(at('2026-11-09T20:00:00'))],
      ['midnight', iso(at('2026-11-10T00:00:00'))],
    ]);
  });

  test('alerts already in the past are dropped', () => {
    const late = bookingOpenAlerts(w, { now: at('2026-11-09T21:00:00'), midnight: true });
    expect(late.map((a) => a.kind)).toEqual(['midnight']);
    expect(bookingOpenAlerts(w, { now: at('2026-11-10T01:00:00'), midnight: true })).toEqual([]);
  });
});

test('with a confirmed opening time: a single alert at that time', () => {
  const w = bookingWindow({
    serviceDate: '2026-12-10',
    boardingDate: '2026-12-10',
    originDeparture: at('2026-12-10T08:30:00'),
    boardingDeparture: at('2026-12-10T08:30:00'),
    openTime: '07:00',
  });
  const alerts = bookingOpenAlerts(w, { now: at('2026-11-01T00:00:00'), midnight: true });
  expect(alerts.map((a) => [a.kind, iso(a.at)])).toEqual([['opening', iso(at('2026-11-10T07:00:00'))]]);
});

describe('Nawalapitiya 00:35 night train: reminder and .ics', () => {
  const now = at('2026-11-01T12:00:00');
  const text = (_r: unknown, a: { kind: string }) => ({ title: `alert ${a.kind}` });

  test('reminder uses the earlier opening date and records the alternative', async () => {
    const trip = (await getTrip({ trainId: '1045', date: '2026-12-10', fromStationId: 'nawalapitiya', toStationId: 'badulla' }))!;
    const r = bookingOpensReminder(trip, bookingWindowForTrip(trip, now), { midnight: true, now, id: 'r1' });
    expect(r.kind).toBe('booking-opens');
    expect(r.dateOnly).toBe(true);
    expect(r.altEventDate).toBe('2026-11-10');
    expect(r.alerts).toEqual([
      { kind: 'heads-up', at: '2026-11-08T20:00:00+05:30' },
      { kind: 'midnight', at: '2026-11-09T00:00:00+05:30' },
    ]);
    expect(r.params).toMatchObject({ trainNumber: '1045', fromStationId: 'nawalapitiya', travelDate: '2026-12-10' });
  });

  test('the .ics export has one event per alert at exactly the same times', async () => {
    const trip = (await getTrip({ trainId: '1045', date: '2026-12-10', fromStationId: 'nawalapitiya', toStationId: 'badulla' }))!;
    for (const midnight of [false, true]) {
      const r = bookingOpensReminder(trip, bookingWindowForTrip(trip, now), { midnight, now, id: 'r1' });
      const ics = buildIcs(reminderIcsEvents(r, text), now);
      const starts = [...ics.matchAll(/^DTSTART:(\S+)$/gm)].map((m) => m[1]);
      expect(starts).toEqual(r.alerts.map((a) => icsTime(new Date(a.at))));
      expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(r.alerts.length);
    }
    const r = bookingOpensReminder(trip, bookingWindowForTrip(trip, now), { midnight: true, now, id: 'r1' });
    // 20:00 and 00:00 in Colombo are 14:30Z and 18:30Z.
    expect(buildIcs(reminderIcsEvents(r, text), now)).toContain('DTSTART:20261108T143000Z');
    expect(buildIcs(reminderIcsEvents(r, text), now)).toContain('DTSTART:20261108T183000Z');
  });
});

describe('ics format', () => {
  test('CRLF line endings, escaped text, required fields', () => {
    const ics = buildIcs([{ uid: 'a@x', start: at('2026-11-08T20:00:00'), durationMin: 15, title: 'Train 1045; Night, Mail' }], at('2026-11-01T00:00:00'));
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics).toContain('SUMMARY:Train 1045\\; Night\\, Mail');
    expect(ics).toContain('DTEND:20261108T144500Z');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.split('\r\n').every((l) => !l.includes('\n'))).toBe(true);
  });

  test('folds long Sinhala lines at 75 bytes without breaking characters', () => {
    const line = `SUMMARY:${'පොඩි මැණිකේ '.repeat(10)}`;
    const folded = foldLine(line).split('\r\n');
    const enc = new TextEncoder();
    expect(folded.length).toBeGreaterThan(1);
    expect(folded.every((l) => enc.encode(l).length <= 75)).toBe(true);
    expect(folded.map((l, i) => (i === 0 ? l : l.slice(1))).join('')).toBe(line);
  });
});

test('reminders are stored offline in IndexedDB', async () => {
  await reminders.clear();
  const trip = (await getTrip({ trainId: '1015', date: '2026-12-10' }))!;
  const r = bookingOpensReminder(trip, bookingWindowForTrip(trip, at('2026-11-01T00:00:00')), { id: 'stored-1' });
  await reminders.put(r);
  expect(await reminders.get('stored-1')).toEqual(r);
  expect(await reminders.list()).toHaveLength(1);
  await reminders.remove('stored-1');
  expect(await reminders.list()).toEqual([]);
});
