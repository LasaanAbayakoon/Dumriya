/**
 * Refund calculator. Rules come from REFUND_TIERS in config/policy.ts:
 * a tier applies only while the time left is STRICTLY MORE than its threshold,
 * so on an exact boundary the lower refund applies.
 */
import {
  CONVENIENCE_FEE_RATE,
  REFUND_COUNT_FROM_BOARDING_STATION,
  REFUND_FALLBACK_PERCENT,
  REFUND_TIERS,
  SERVICE_CHARGE_REFUNDABLE,
} from '@/config/policy';
import type { Trip } from '@/types';
import { colomboDateTime, HOUR } from './time';

/** Refund percentage for a given amount of time left before departure (ms). */
export function refundPercent(msBeforeDeparture: number): number {
  for (const tier of REFUND_TIERS) {
    if (msBeforeDeparture > tier.moreThanHours * HOUR) return tier.percent;
  }
  return REFUND_FALLBACK_PERCENT;
}

/** Round down to the cent: when in doubt, never promise more money than the user will get. */
const floorCents = (n: number) => Math.floor(Math.round(n * 1000) / 10) / 100;
/** Round to the nearest cent. */
const roundCents = (n: number) => Math.round(n * 100) / 100;

/** Pre-filled (editable) service charge for a fare. */
export function defaultServiceCharge(fareLkr: number): number {
  return roundCents(fareLkr * CONVENIENCE_FEE_RATE);
}

export interface RefundTierInfo {
  percent: number;
  /** This tier applies while now is before `until` (exclusive). Null for the last (0 %) tier. */
  until: Date | null;
  /** This tier applies from `from` (inclusive). Null for the first tier. */
  from: Date | null;
}

export interface RefundQuote {
  departed: boolean;
  msLeft: number;
  percent: number;
  refundLkr: number;
  /** Fare minus refund, plus the service charge. */
  notRefundedLkr: number;
  serviceChargeLkr: number;
  tiers: RefundTierInfo[];
  /** When the refund next drops to a lower tier, or null if already 0 %. */
  nextDropAt: Date | null;
}

export function refundQuote(
  { departure, fareLkr, serviceChargeLkr }: { departure: Date; fareLkr: number; serviceChargeLkr: number },
  now: Date = new Date(),
): RefundQuote {
  const msLeft = departure.getTime() - now.getTime();
  const percent = refundPercent(msLeft);
  const refundable = fareLkr + (SERVICE_CHARGE_REFUNDABLE ? serviceChargeLkr : 0);
  const refundLkr = floorCents((refundable * percent) / 100);

  const deadlines = REFUND_TIERS.map((t) => new Date(departure.getTime() - t.moreThanHours * HOUR));
  const tiers: RefundTierInfo[] = [
    ...REFUND_TIERS.map((t, i) => ({ percent: t.percent, until: deadlines[i]!, from: i === 0 ? null : deadlines[i - 1]! })),
    { percent: REFUND_FALLBACK_PERCENT, until: null, from: deadlines[deadlines.length - 1] ?? null },
  ];
  const nextDropAt = deadlines.find((d) => now.getTime() < d.getTime()) ?? null;

  return {
    departed: msLeft <= 0,
    msLeft,
    percent,
    refundLkr,
    notRefundedLkr: roundCents(fareLkr + serviceChargeLkr - refundLkr),
    serviceChargeLkr,
    tiers,
    nextDropAt: percent === REFUND_FALLBACK_PERCENT ? null : nextDropAt,
  };
}

/**
 * The departure that refund deadlines count from for a trip. Uses the train's origin
 * departure (earliest, so nobody misses a tier) unless REFUND_COUNT_FROM_BOARDING_STATION.
 */
export function refundDepartureForTrip(
  trip: Pick<Trip, 'train' | 'serviceDate' | 'departure'>,
  fromBoarding: boolean = REFUND_COUNT_FROM_BOARDING_STATION,
): Date {
  if (fromBoarding) return new Date(trip.departure);
  const origin = trip.train.stops[0]!;
  return colomboDateTime(trip.serviceDate, origin.departure!, origin.dayOffset);
}
