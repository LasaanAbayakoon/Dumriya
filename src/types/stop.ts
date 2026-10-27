import type { ClockTime } from './common';

export interface Stop {
  stationId: string;
  /** Scheduled arrival, null at the origin. */
  arrival: ClockTime | null;
  /** Scheduled departure, null at the terminus. */
  departure: ClockTime | null;
  /** Days after the train's start date (night trains cross midnight). */
  dayOffset: number;
  /** Distance from the origin along this train's route, in km. */
  km: number;
  platform?: string;
}
