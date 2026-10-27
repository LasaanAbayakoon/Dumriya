import type { LocalizedName } from './common';

export type LineId = 'main' | 'coastal';

export interface Station {
  id: string;
  /** Short station code (sample values; may not match official codes). */
  code: string;
  name: LocalizedName;
  lines: LineId[];
  lat: number;
  lng: number;
  facilities: {
    /** Has a counter for reserved-seat bookings and refunds. */
    reservationCounter: boolean;
    /** Has an mTicketing / commuter ticket counter. */
    mTicketing: boolean;
  };
}
