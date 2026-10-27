/** A name in all three supported languages. */
export interface LocalizedName {
  en: string;
  si: string;
  ta: string;
}

/** Calendar date in Asia/Colombo, `YYYY-MM-DD`. */
export type IsoDate = string;

/** Wall-clock time in Asia/Colombo, `HH:mm` (24h). */
export type ClockTime = string;

/** Full timestamp with offset, e.g. `2026-11-03T05:55:00+05:30`. */
export type IsoDateTime = string;
