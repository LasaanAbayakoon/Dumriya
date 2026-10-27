import {
  addDays,
  colomboDateOf,
  colomboDateTime,
  colomboIso,
  colomboTimeOf,
  isClockTime,
  isIsoDate,
  toColomboIso,
  weekdayOf,
} from './time';

test('addDays crosses month and year boundaries and leap days', () => {
  expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  expect(addDays('2026-11-30', -30)).toBe('2026-10-31');
});

test('colomboDateTime is +05:30 regardless of the machine time zone', () => {
  expect(colomboDateTime('2026-11-03', '05:55').toISOString()).toBe('2026-11-03T00:25:00.000Z');
  expect(colomboDateTime('2026-11-03', '01:00').toISOString()).toBe('2026-11-02T19:30:00.000Z');
  expect(colomboDateTime('2026-11-03', '06:10', 1).toISOString()).toBe('2026-11-04T00:40:00.000Z');
  expect(colomboIso('2026-11-03', '20:00', 1)).toBe('2026-11-04T20:00:00+05:30');
});

test('Colombo calendar date and time of an instant', () => {
  const lateUtc = new Date('2026-11-03T20:00:00Z'); // 01:30 next day in Colombo
  expect(colomboDateOf(lateUtc)).toBe('2026-11-04');
  expect(colomboTimeOf(lateUtc)).toBe('01:30');
  expect(toColomboIso(lateUtc)).toBe('2026-11-04T01:30:00+05:30');
});

test('weekdayOf', () => {
  expect(weekdayOf('2026-11-01')).toBe(0); // Sunday
  expect(weekdayOf('2026-11-07')).toBe(6); // Saturday
});

test('validators', () => {
  expect(isIsoDate('2026-11-03')).toBe(true);
  expect(isIsoDate('2026-13-03')).toBe(false);
  expect(isIsoDate('03/11/2026')).toBe(false);
  expect(isClockTime('23:59')).toBe(true);
  expect(isClockTime('24:00')).toBe(false);
  expect(isClockTime('7:05')).toBe(false);
});
