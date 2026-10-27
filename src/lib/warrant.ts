/**
 * Temporary warrant reservations expire 7 days after booking or 48 hours before
 * the journey, whichever comes first, and must be confirmed at a station.
 */
import { WARRANT_EXPIRES_DAYS_AFTER_BOOKING, WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY } from '@/config/policy';
import { DAY, HOUR } from './time';

export interface WarrantExpiry {
  expiresAt: Date;
  /** Which limit applied. */
  reason: 'days-after-booking' | 'hours-before-journey';
  /** Already past the deadline at booking time (booked too close to the journey). */
  expiredAtBooking: boolean;
}

/** `journeyDeparture` should be the train's origin departure (the earlier, safer time). */
export function warrantExpiry(bookedAt: Date, journeyDeparture: Date): WarrantExpiry {
  const afterBooking = bookedAt.getTime() + WARRANT_EXPIRES_DAYS_AFTER_BOOKING * DAY;
  const beforeJourney = journeyDeparture.getTime() - WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY * HOUR;
  const useJourney = beforeJourney <= afterBooking;
  const expiresAt = new Date(useJourney ? beforeJourney : afterBooking);
  return {
    expiresAt,
    reason: useJourney ? 'hours-before-journey' : 'days-after-booking',
    expiredAtBooking: expiresAt.getTime() <= bookedAt.getTime(),
  };
}
