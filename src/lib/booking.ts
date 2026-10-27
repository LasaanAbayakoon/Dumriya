/**
 * Booking-helper maths: how many separate online bookings a group needs,
 * the true total including the convenience fee, and the Pravesha window.
 */
import { CONVENIENCE_FEE_RATE, MAX_SEATS_PER_BOOKING, PRAVESHA_ADVANCE_DAYS } from '@/config/policy';
import type { IsoDate } from '@/types';
import { addDays, colomboDateOf } from './time';

/** Split a passenger count into bookings of at most MAX_SEATS_PER_BOOKING, e.g. 7 → [5, 2]. */
export function splitPassengers(passengers: number): number[] {
  const n = Math.max(0, Math.floor(passengers));
  const groups: number[] = [];
  for (let left = n; left > 0; left -= MAX_SEATS_PER_BOOKING) groups.push(Math.min(left, MAX_SEATS_PER_BOOKING));
  return groups;
}

export interface Leg {
  passengers: number;
  boardingStationId: string;
  alightingStationId: string;
}

export type SeparateReturnReason = 'different-passengers' | 'different-boarding-station';

export interface BookingPlan {
  outboundGroups: number[];
  returnGroups: number[];
  /** Return can't be combined with the outbound booking; these are the reasons. */
  separateReturnReasons: SeparateReturnReason[];
  totalBookings: number;
}

/**
 * A return is a simple reverse of the outbound (same passengers, boarding where the outbound
 * ended) and can be booked together. Otherwise it needs its own booking(s).
 */
export function planBookings(outbound: Leg, ret?: Leg | null): BookingPlan {
  const outboundGroups = splitPassengers(outbound.passengers);
  if (!ret) return { outboundGroups, returnGroups: [], separateReturnReasons: [], totalBookings: outboundGroups.length };

  const reasons: SeparateReturnReason[] = [];
  if (ret.passengers !== outbound.passengers) reasons.push('different-passengers');
  if (ret.boardingStationId !== outbound.alightingStationId) reasons.push('different-boarding-station');

  const returnGroups = splitPassengers(ret.passengers);
  const totalBookings = reasons.length === 0 ? outboundGroups.length : outboundGroups.length + returnGroups.length;
  return { outboundGroups, returnGroups, separateReturnReasons: reasons, totalBookings };
}

export interface TrueTotal {
  fareTotalLkr: number;
  convenienceFeeLkr: number;
  totalLkr: number;
}

/** Round UP to the cent: when in doubt, show the user the higher cost. */
const ceilCents = (n: number) => Math.ceil(Math.round(n * 1000) / 10) / 100;

/** What the user will actually pay: fare × seats + 5 % convenience fee. */
export function trueTotal(farePerSeatLkr: number, seats: number): TrueTotal {
  const fareTotalLkr = farePerSeatLkr * seats;
  const convenienceFeeLkr = ceilCents(fareTotalLkr * CONVENIENCE_FEE_RATE);
  return { fareTotalLkr, convenienceFeeLkr, totalLkr: ceilCents(fareTotalLkr + convenienceFeeLkr) };
}

export interface PraveshaWindow {
  /** First date commuter tickets can be bought for this journey. */
  opensOn: IsoDate;
  canBuyNow: boolean;
}

/** Pravesha commuter tickets can be bought up to PRAVESHA_ADVANCE_DAYS before travel. */
export function praveshaWindow(travelDate: IsoDate, now: Date = new Date()): PraveshaWindow {
  const opensOn = addDays(travelDate, -PRAVESHA_ADVANCE_DAYS);
  const today = colomboDateOf(now);
  return { opensOn, canBuyNow: today >= opensOn && today <= travelDate };
}
