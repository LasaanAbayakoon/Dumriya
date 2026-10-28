/** Display formatting. Dates and times are always shown in Asia/Colombo time. */
import i18n from '@/i18n';
import type { IsoDate, LocalizedName, Station, Train, Weekday } from '@/types';
import { colomboDateOf, colomboTimeOf, weekdayOf } from './time';

export type Lang = 'en' | 'si' | 'ta';

const LOCALES: Record<Lang, string> = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };

export const asLang = (lng: string): Lang => (lng === 'si' || lng === 'ta' ? lng : 'en');
const loc = (lng: string) => LOCALES[asLang(lng)];

type MonthKey = `format.months.${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type WeekdayKey = `format.${'weekdays' | 'weekdaysShort'}.${Weekday}`;

/** Colombo calendar date of an IsoDate or an instant. */
const colomboDate = (d: IsoDate | Date | string): IsoDate =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : colomboDateOf(new Date(d));

function weekdayName(day: Weekday, lng: string, width: 'short' | 'long'): string {
  const key = `format.${width === 'short' ? 'weekdaysShort' : 'weekdays'}.${day}` as WeekdayKey;
  return i18n.getFixedT(asLang(lng))(key);
}

/**
 * Dates are assembled from month and weekday names in the translation files rather
 * than Intl, because many Android WebViews ship without Sinhala/Tamil locale data and
 * silently fall back to US English. Word order comes from `format.date`.
 */
function dateParts(d: IsoDate | Date | string, lng: string) {
  const date = colomboDate(d);
  const [year, month, day] = date.split('-').map(Number) as [number, number, number];
  return {
    year,
    day,
    month: i18n.getFixedT(asLang(lng))(`format.months.${month}` as MonthKey),
    weekday: weekdayName(weekdayOf(date), lng, 'short'),
  };
}

/** e.g. "Tue, 10 Nov 2026" (order and names per language). */
export function formatDate(d: IsoDate | Date | string, lng: string): string {
  return i18n.getFixedT(asLang(lng))('format.date', dateParts(d, lng));
}

/** e.g. "10 Nov" */
export function formatShortDate(d: IsoDate | Date | string, lng: string): string {
  return i18n.getFixedT(asLang(lng))('format.shortDate', dateParts(d, lng));
}

/**
 * 24-hour "HH:mm" in Colombo time, the same in every language, as printed on
 * tickets and timetables. (The Sinhala locale default would be "06.30".)
 */
export function formatTime(d: Date | string, _lng?: string): string {
  return colomboTimeOf(new Date(d));
}

export function formatWeekday(day: Weekday, lng: string, width: 'short' | 'long' = 'short'): string {
  return weekdayName(day, lng, width);
}

/**
 * Rupee amounts: always exactly two decimals ("382.50", "1,240.00") in every language.
 * Digits are Latin in all three languages; only grouping comes from Intl.
 */
export function formatMoney(n: number, lng: string): string {
  return new Intl.NumberFormat(loc(lng), { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/** A prefilled amount for an input box: "25.50" (no grouping, so it parses back cleanly). */
export const moneyInput = (n: number): string => n.toFixed(2);

/** A money value from a URL parameter, shown as "510.00"; anything unparseable is kept as typed. */
export function prefillMoney(raw: string | null): string {
  if (raw === null || raw.trim() === '') return '';
  const n = Number(raw);
  return Number.isFinite(n) ? moneyInput(n) : raw;
}

/** Plain numbers (not money). */
export function formatNumber(n: number, lng: string): string {
  return new Intl.NumberFormat(loc(lng), { maximumFractionDigits: 2 }).format(n);
}

export const nameIn = (name: LocalizedName, lng: string): string => name[asLang(lng)];
export const stationName = (s: Station | undefined | null, lng: string): string => (s ? nameIn(s.name, lng) : '…');

/** "1015 Udarata Menike", or just "1015" when the train has no name. */
export function trainLabel(train: Pick<Train, 'number' | 'name'>, lng: string): string {
  return train.name ? `${train.number} ${nameIn(train.name, lng)}` : train.number;
}
