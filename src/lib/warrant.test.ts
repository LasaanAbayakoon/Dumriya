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

describe('already expired = the JOURNEY is less than 48 h after booking (not "booked in the last 48 h")', () => {
  const booked = new Date('2026-11-01T10:00:00+05:30');
  const hoursAfter = (h: number) => new Date(booked.getTime() + h * HOUR);

  test('journey 47 h after booking: already expired', () => {
    const w = warrantExpiry(booked, hoursAfter(47));
    expect(w.expiredAtBooking).toBe(true);
    expect(w.reason).toBe('hours-before-journey');
  });

  test('journey exactly 48 h after booking: already expired (the earlier reading)', () => {
    expect(warrantExpiry(booked, hoursAfter(48)).expiredAtBooking).toBe(true);
  });

  test('journey 49 h after booking: not expired, expires 1 h after booking', () => {
    const w = warrantExpiry(booked, hoursAfter(49));
    expect(w.expiredAtBooking).toBe(false);
    expect(w.reason).toBe('hours-before-journey');
    expect(w.expiresAt.toISOString()).toBe(hoursAfter(1).toISOString());
  });

  test('booked 1 h ago for a journey 30 days away: not expired, expires 7 days after booking', () => {
    const bookedAt = new Date(Date.parse('2026-11-01T12:00:00+05:30') - HOUR);
    const w = warrantExpiry(bookedAt, new Date(bookedAt.getTime() + 30 * DAY));
    expect(w.expiredAtBooking).toBe(false);
    expect(w.reason).toBe('days-after-booking');
    expect(w.expiresAt.toISOString()).toBe(new Date(bookedAt.getTime() + 7 * DAY).toISOString());
  });
});
