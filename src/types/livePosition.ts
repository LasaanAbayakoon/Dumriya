import type { IsoDate, IsoDateTime, LocalizedName } from './common';

export type TrainStatus = 'not-started' | 'on-time' | 'delayed' | 'cancelled' | 'arrived';

/** One stop of a running train, scheduled vs predicted (simulated in the mock). */
export interface LiveStop {
  stationId: string;
  scheduledArrival: IsoDateTime | null;
  scheduledDeparture: IsoDateTime | null;
  predictedArrival: IsoDateTime | null;
  predictedDeparture: IsoDateTime | null;
  /** The train has left (or, at the terminus, reached) this stop. */
  passed: boolean;
}

/** Something a "follow this train" alert reacts to. */
export type FollowEvent =
  | { kind: 'delay'; at: IsoDateTime; delayMin: number; stationId: string }
  | { kind: 'cancelled'; at: IsoDateTime };

export interface FollowOptions {
  /** Alert when the delay is MORE than this many minutes; null = no delay alerts. */
  delayOverMin: number | null;
  cancellation: boolean;
}

export interface LivePosition {
  trainId: string;
  date: IsoDate;
  status: TrainStatus;
  lat: number;
  lng: number;
  /** Last stop passed and next stop ahead (equal when standing at a station). */
  lastStopId: string;
  nextStopId: string;
  /** Minutes late (negative = early). */
  delayMin: number;
  /** Predicted arrival at `nextStopId`. */
  nextStopPredicted: IsoDateTime | null;
  nextStopScheduled: IsoDateTime | null;
  updatedAt: IsoDateTime;
  /** Where this position came from. Only `simulated` exists until a real feed is connected. */
  source: 'simulated' | 'crowd' | 'official';
  /** Every stop, for the text alternative to the map. */
  stops: LiveStop[];
}

export interface BoardEntry {
  trainId: string;
  trainNumber: string;
  trainName: LocalizedName | null;
  destinationStationId: string;
  scheduled: IsoDateTime;
  predicted: IsoDateTime | null;
  status: TrainStatus;
  delayMin: number;
  platform: string | null;
}
