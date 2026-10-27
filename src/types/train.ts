import type { LocalizedName } from './common';
import type { TravelClass } from './fare';
import type { LineId } from './station';
import type { Stop } from './stop';

/** 0 = Sunday … 6 = Saturday, in Asia/Colombo. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type TrainType = 'intercity' | 'express' | 'night-mail' | 'slow';

export interface Train {
  id: string;
  number: string;
  /** Many trains have no name, only a number. */
  name: LocalizedName | null;
  type: TrainType;
  line: LineId;
  runningDays: Weekday[];
  /** Classes on this train and whether each is reservable online. */
  classes: { travelClass: TravelClass; reservable: boolean }[];
  stops: Stop[];
}
