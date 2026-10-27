import { warrantExpiry } from './warrant';
import { DAY, HOUR } from './time';

const J = new Date('2026-12-20T08:30:00+05:30'); // journey departure
const daysBefore = (d: number) => new Date(J.getTime() - d * DAY);

test('booked well ahead: expires 7 days after booking', () => {
  const booked = daysBefore(30);
  const w = warrantExpiry(booked, J);
  expect(w.reason).toBe('days-after-booking');
  expect(w.expiresAt.getTime()).toBe(booked.getTime() + 7 * DAY);
  expect(w.expiredAtBooking).toBe(false);
});

test('booked close to the journey: expires 48 hours before the journey', () => {
  const w = warrantExpiry(daysBefore(8), J);
  expect(w.reason).toBe('hours-before-journey');
  expect(w.expiresAt.getTime()).toBe(J.getTime() - 48 * HOUR);
});

test('when both limits coincide (booked 9 days ahead) the date is the same either way', () => {
  const w = warrantExpiry(daysBefore(9), J);
  expect(w.expiresAt.getTime()).toBe(J.getTime() - 48 * HOUR);
});

test('booked within 48 hours of the journey: already expired', () => {
  const w = warrantExpiry(daysBefore(1), J);
  expect(w.expiredAtBooking).toBe(true);
});
