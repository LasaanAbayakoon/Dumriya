import type { IsoDate, IsoDateTime, LocalizedName } from './common';

export type TrainStatus = 'not-started' | 'on-time' | 'delayed' | 'cancelled' | 'arrived';

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
