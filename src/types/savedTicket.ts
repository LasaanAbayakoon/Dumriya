import type { IsoDate, IsoDateTime } from './common';
import type { TravelClass } from './fare';

/**
 * An e-ticket the user stored on this device (IndexedDB). Never leaves the phone.
 * Details are typed or confirmed by the user; the file is never read or parsed.
 */
export interface SavedTicket {
  id: string;
  createdAt: IsoDateTime;
  /** The file bytes are stored as an ArrayBuffer (more portable in IndexedDB than Blob). */
  file: { name: string; type: string; size: number; data: ArrayBuffer };
  trainNumber: string;
  /** Set when the number matches a train in the timetable. */
  trainId?: string;
  fromStationId: string;
  toStationId: string;
  travelDate: IsoDate;
  /** Departure from the boarding station, as entered by the user. */
  departure: IsoDateTime;
  /**
   * Departure that refund deadlines count from: the earlier of the entered departure and
   * the train's origin departure (if the train is in the timetable). Worked out when saved,
   * so the countdown also works offline.
   */
  refundDeparture: IsoDateTime;
  refundBasis: 'origin' | 'entered';
  /** The train's origin station, when refundBasis is 'origin' (for the explanation). */
  originStationId?: string;
  travelClass?: TravelClass;
  coach?: string;
  seat?: string;
  reference?: string;
  fareLkr: number;
  serviceChargeLkr: number;
}
