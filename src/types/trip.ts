import type { IsoDate, IsoDateTime } from './common';
import type { Fare } from './fare';
import type { Stop } from './stop';
import type { Train } from './train';

/** One train, between two of its stops, on one date. This is what search returns. */
export interface Trip {
  train: Train;
  /** The date the passenger boards (Asia/Colombo). */
  date: IsoDate;
  /** The date the train left its origin (differs from `date` when boarding a night train after midnight). */
  serviceDate: IsoDate;
  from: Stop;
  to: Stop;
  /** Departure from `from` and arrival at `to`, as full timestamps. */
  departure: IsoDateTime;
  arrival: IsoDateTime;
  durationMin: number;
  fares: Fare[];
  /** True if at least one class can be reserved on the official site. */
  reservableOnline: boolean;
}
