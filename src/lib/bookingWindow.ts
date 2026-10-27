/**
 * Reserved-seat booking window. Where SLR's rule is ambiguous we always pick
 * the EARLIER time, so a user never misses opening or closing.
 */
import {
  BOOKING_CLOSE_HOURS_BEFORE,
  BOOKING_CLOSE_USE_BOARDING_STATION,
  BOOKING_OPEN_TIME,
  BOOKING_WINDOW_DAYS,
} from '@/config/policy';
import type { ClockTime, IsoDate, Trip } from '@/types';
import { addDays, colomboDateOf, colomboDateTime, HOUR } from './time';

export type BookingWindowStatus =
  /** Before the earliest possible opening date. */
  | 'not-yet-open'
  /** It is the opening date but the opening time isn't confirmed. */
  | 'opens-today'
  /** Between the two possible opening dates (boarding after midnight): may already be open. */
  | 'may-be-open'
  | 'open'
  | 'closed';

export interface BookingWindow {
  /** Earliest possible opening date: 30 days before the train leaves its origin. */
  opensOn: IsoDate;
  /** Second possible opening date (30 days before the boarding date), when that differs. */
  altOpensOn: IsoDate | null;
  /** Exact opening instant, only when BOOKING_OPEN_TIME is configured. */
  opensAt: Date | null;
  timeConfirmed: boolean;
  closesAt: Date;
  /** True when closing is measured from the origin but the passenger boards later on the route. */
  closesMayBeLater: boolean;
  status: BookingWindowStatus;
}

export interface BookingWindowInput {
  /** Date the train leaves its origin. */
  serviceDate: IsoDate;
  /** Date the passenger boards. */
  boardingDate: IsoDate;
  originDeparture: Date;
  boardingDeparture: Date;
  /** Override for tests; defaults to BOOKING_OPEN_TIME. */
  openTime?: ClockTime | null;
  /** Override for tests; defaults to BOOKING_CLOSE_USE_BOARDING_STATION. */
  closeFromBoarding?: boolean;
}

export function bookingWindow(input: BookingWindowInput, now: Date = new Date()): BookingWindow {
  const openTime = input.openTime === undefined ? BOOKING_OPEN_TIME : input.openTime;
  const closeFromBoarding = input.closeFromBoarding ?? BOOKING_CLOSE_USE_BOARDING_STATION;

  const opensOn = addDays(input.serviceDate, -BOOKING_WINDOW_DAYS);
  const boardingOpensOn = addDays(input.boardingDate, -BOOKING_WINDOW_DAYS);
  const altOpensOn = boardingOpensOn !== opensOn ? boardingOpensOn : null;
  const opensAt = openTime ? colomboDateTime(opensOn, openTime) : null;

  const closeBase = closeFromBoarding ? input.boardingDeparture : input.originDeparture;
  const closesAt = new Date(closeBase.getTime() - BOOKING_CLOSE_HOURS_BEFORE * HOUR);
  const closesMayBeLater = !closeFromBoarding && input.boardingDeparture.getTime() > input.originDeparture.getTime();

  const today = colomboDateOf(now);
  let status: BookingWindowStatus;
  if (now.getTime() >= closesAt.getTime()) status = 'closed';
  else if (opensAt) status = now.getTime() < opensAt.getTime() ? 'not-yet-open' : 'open';
  else if (today < opensOn) status = 'not-yet-open';
  else if (today === opensOn) status = 'opens-today';
  else if (altOpensOn && today <= altOpensOn) status = 'may-be-open';
  else status = 'open';

  // With a confirmed time, still flag the uncertainty window between the two possible dates.
  if (opensAt && status === 'open' && altOpensOn && now.getTime() < colomboDateTime(altOpensOn, openTime!).getTime()) {
    status = 'may-be-open';
  }

  return { opensOn, altOpensOn, opensAt, timeConfirmed: opensAt !== null, closesAt, closesMayBeLater, status };
}

export function bookingWindowForTrip(trip: Trip, now: Date = new Date()): BookingWindow {
  const origin = trip.train.stops[0]!;
  return bookingWindow(
    {
      serviceDate: trip.serviceDate,
      boardingDate: trip.date,
      originDeparture: colomboDateTime(trip.serviceDate, origin.departure!, origin.dayOffset),
      boardingDeparture: new Date(trip.departure),
    },
    now,
  );
}

/**
 * When a "booking opens" reminder should fire: the exact opening time if known,
 * otherwise the start (00:00 Colombo) of the earliest possible opening date.
 */
export function bookingOpenReminderAt(w: BookingWindow): Date {
  return w.opensAt ?? colomboDateTime(w.opensOn, '00:00');
}
