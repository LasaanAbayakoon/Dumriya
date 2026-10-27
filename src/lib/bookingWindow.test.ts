import { getTrip } from '@/api';
import { bookingOpenAlerts, bookingWindow, bookingWindowForTrip, type BookingWindowInput } from './bookingWindow';
import { colomboDateTime } from './time';

const at = (iso: string) => new Date(`${iso}+05:30`);

// Udarata Menike 1015: leaves Colombo Fort 08:30, reaches Ella 17:55.
const dayTrain: BookingWindowInput = {
  serviceDate: '2026-12-10',
  boardingDate: '2026-12-10',
  originDeparture: at('2026-12-10T08:30:00'),
  boardingDeparture: at('2026-12-10T08:30:00'),
  openTime: null,
};

describe('opening date', () => {
  test('30 calendar days before the date of travel, time not confirmed', () => {
    const w = bookingWindow(dayTrain, at('2026-11-01T12:00:00'));
    expect(w.opensOn).toBe('2026-11-10');
    expect(w.altOpensOn).toBeNull();
    expect(w.opensAt).toBeNull();
    expect(w.timeConfirmed).toBe(false);
  });

  test('counts calendar days across a short February', () => {
    const w = bookingWindow({ ...dayTrain, serviceDate: '2026-03-01', boardingDate: '2026-03-01' });
    expect(w.opensOn).toBe('2026-01-30');
  });

  test('with BOOKING_OPEN_TIME configured, gives an exact instant', () => {
    const w = bookingWindow({ ...dayTrain, openTime: '07:00' }, at('2026-11-01T12:00:00'));
    expect(w.opensAt?.toISOString()).toBe(at('2026-11-10T07:00:00').toISOString());
    expect(w.timeConfirmed).toBe(true);
  });
});

describe('closing time', () => {
  test('2 hours before departure from the ORIGIN', () => {
    const w = bookingWindow(dayTrain);
    expect(w.closesAt.toISOString()).toBe(at('2026-12-10T06:30:00').toISOString());
    expect(w.closesMayBeLater).toBe(false);
  });

  test('boarding later on the route still closes from the origin, flagged "may be later"', () => {
    const ella = { ...dayTrain, boardingDeparture: at('2026-12-10T17:55:00') };
    const w = bookingWindow(ella);
    expect(w.closesAt.toISOString()).toBe(at('2026-12-10T06:30:00').toISOString());
    expect(w.closesMayBeLater).toBe(true);
  });

  test('config option: measure from the boarding station instead', () => {
    const ella = { ...dayTrain, boardingDeparture: at('2026-12-10T17:55:00'), closeFromBoarding: true };
    const w = bookingWindow(ella);
    expect(w.closesAt.toISOString()).toBe(at('2026-12-10T15:55:00').toISOString());
    expect(w.closesMayBeLater).toBe(false);
  });
});

describe('status (time not confirmed)', () => {
  test.each([
    { now: '2026-11-09T23:59:00', status: 'not-yet-open' },
    { now: '2026-11-10T00:00:00', status: 'opens-today' },
    { now: '2026-11-10T20:00:00', status: 'opens-today' },
    { now: '2026-11-11T00:00:00', status: 'open' },
    { now: '2026-12-10T06:29:00', status: 'open' },
    { now: '2026-12-10T06:30:00', status: 'closed' },
  ])('at $now → $status', ({ now, status }) => {
    expect(bookingWindow(dayTrain, at(now)).status).toBe(status);
  });
});

// Night Mail 1045 leaves Colombo Fort at 20:00 on 9 Dec; a passenger boarding at
// Nawalapitiya at 00:35 is travelling on 10 Dec. Both opening dates are possible.
describe('Nawalapitiya 00:35 (boarding a night train after midnight)', () => {
  const nawalapitiya: BookingWindowInput = {
    serviceDate: '2026-12-09',
    boardingDate: '2026-12-10',
    originDeparture: at('2026-12-09T20:00:00'),
    boardingDeparture: at('2026-12-10T00:35:00'),
    openTime: null,
  };

  test('shows both possible opening dates, the earlier one first', () => {
    const w = bookingWindow(nawalapitiya);
    expect(w.opensOn).toBe('2026-11-09');
    expect(w.altOpensOn).toBe('2026-11-10');
  });

  test('reminders are set for the earlier date: heads-up the evening before, optional midnight alert', () => {
    const w = bookingWindow(nawalapitiya);
    const alerts = bookingOpenAlerts(w, { midnight: true, now: at('2026-11-01T00:00:00') });
    expect(alerts.map((a) => a.at.toISOString())).toEqual([
      at('2026-11-08T20:00:00').toISOString(),
      at('2026-11-09T00:00:00').toISOString(),
    ]);
  });

  test('closes 2 hours before the train leaves Colombo Fort, i.e. the evening before boarding', () => {
    const w = bookingWindow(nawalapitiya);
    expect(w.closesAt.toISOString()).toBe(at('2026-12-09T18:00:00').toISOString());
    expect(w.closesMayBeLater).toBe(true);
  });

  test.each([
    { now: '2026-11-08T12:00:00', status: 'not-yet-open' },
    { now: '2026-11-09T12:00:00', status: 'opens-today' },
    { now: '2026-11-10T12:00:00', status: 'may-be-open' },
    { now: '2026-11-11T00:00:00', status: 'open' },
    { now: '2026-12-09T17:59:00', status: 'open' },
    { now: '2026-12-09T18:00:00', status: 'closed' },
  ])('at $now → $status', ({ now, status }) => {
    expect(bookingWindow(nawalapitiya, at(now)).status).toBe(status);
  });

  test('with a confirmed opening time, uses it on the earlier date and flags the gap', () => {
    const withTime = { ...nawalapitiya, openTime: '07:00' };
    const alerts = bookingOpenAlerts(bookingWindow(withTime), { now: at('2026-11-01T00:00:00') });
    expect(alerts.map((a) => [a.kind, a.at.toISOString()])).toEqual([['opening', at('2026-11-09T07:00:00').toISOString()]]);
    expect(bookingWindow(withTime, at('2026-11-09T06:59:00')).status).toBe('not-yet-open');
    expect(bookingWindow(withTime, at('2026-11-09T07:00:00')).status).toBe('may-be-open');
    expect(bookingWindow(withTime, at('2026-11-10T07:00:00')).status).toBe('open');
  });

  test('same result from the real trip returned by the API', async () => {
    const trip = await getTrip({ trainId: '1045', date: '2026-12-10', fromStationId: 'nawalapitiya', toStationId: 'badulla' });
    expect(trip?.serviceDate).toBe('2026-12-09');
    const w = bookingWindowForTrip(trip!, at('2026-11-01T00:00:00'));
    expect(w.opensOn).toBe('2026-11-09');
    expect(w.altOpensOn).toBe('2026-11-10');
    expect(w.closesAt.toISOString()).toBe(colomboDateTime('2026-12-09', '18:00').toISOString());
  });
});

