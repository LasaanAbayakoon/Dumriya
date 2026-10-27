import type { IsoDateTime } from './common';
import type { TravelClass } from './fare';

/** An e-ticket the user stored on this device (IndexedDB). Never leaves the phone. */
export interface SavedTicket {
  id: string;
  createdAt: IsoDateTime;
  file: { name: string; type: string; size: number; blob: Blob };
  trainNumber: string;
  trainName?: string;
  fromStationId?: string;
  toStationId?: string;
  fromLabel: string;
  toLabel: string;
  departure: IsoDateTime;
  travelClass?: TravelClass;
  coach?: string;
  seat?: string;
  reference?: string;
  fareLkr?: number;
  serviceChargeLkr?: number;
  notes?: string;
}
