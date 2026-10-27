/**
 * Date/time helpers that always work in Asia/Colombo time, whatever time zone
 * the phone is set to. Sri Lanka uses a fixed +05:30 offset with no DST, so a
 * fixed offset is exact.
 */
import { POLICY_UTC_OFFSET } from '@/config/policy';
import type { ClockTime, IsoDate, IsoDateTime, Weekday } from '@/types';

const OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isIsoDate = (s: string): s is IsoDate => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const isClockTime = (s: string): s is ClockTime => TIME_RE.test(s);

/** Add whole calendar days to a `YYYY-MM-DD` date. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The instant of a Colombo wall-clock time on a date, plus an optional day offset. */
export function colomboDateTime(date: IsoDate, time: ClockTime, dayOffset = 0): Date {
  return new Date(`${addDays(date, dayOffset)}T${time}:00${POLICY_UTC_OFFSET}`);
}

/** Same as colomboDateTime but returned as an ISO string with the +05:30 offset. */
export function colomboIso(date: IsoDate, time: ClockTime, dayOffset = 0): IsoDateTime {
  return `${addDays(date, dayOffset)}T${time}:00${POLICY_UTC_OFFSET}`;
}

/** Convert any instant to an ISO string in Colombo time (`…+05:30`). */
export function toColomboIso(d: Date): IsoDateTime {
  const shifted = new Date(d.getTime() + OFFSET_MS).toISOString();
  return `${shifted.slice(0, 19)}${POLICY_UTC_OFFSET}`;
}

/** Calendar date in Colombo for an instant. */
export function colomboDateOf(d: Date): IsoDate {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Wall-clock `HH:mm` in Colombo for an instant. */
export function colomboTimeOf(d: Date): ClockTime {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

/** Day of week (0 = Sunday) for a calendar date. */
export function weekdayOf(date: IsoDate): Weekday {
  return new Date(`${date}T00:00:00Z`).getUTCDay() as Weekday;
}

export function todayInColombo(now: Date = new Date()): IsoDate {
  return colomboDateOf(now);
}

/** Minutes since midnight for an `HH:mm` time. */
export function clockToMinutes(t: ClockTime): number {
  const [h, m] = t.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

export function minutesBetween(a: Date | string, b: Date | string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / MINUTE);
}
