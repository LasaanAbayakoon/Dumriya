/**
 * The data contract between screens and the backend.
 * The mock implementation (./mock) and the future FastAPI client must both
 * satisfy this interface, so screens never change when the backend does.
 */
import type { BoardEntry, IsoDate, ClockTime, LivePosition, Station, Train, Trip } from '@/types';

export interface SearchTrainsParams {
  fromStationId: string;
  toStationId: string;
  /** Boarding date in Asia/Colombo. */
  date: IsoDate;
  /** Only trains departing at or after this time (Asia/Colombo). Defaults to 00:00. */
  time?: ClockTime;
}

export interface GetTripParams {
  trainId: string;
  /** Boarding date in Asia/Colombo. */
  date: IsoDate;
  /** Defaults to the train's origin / terminus. */
  fromStationId?: string;
  toStationId?: string;
}

export interface DumriyaApi {
  listStations(): Promise<Station[]>;
  /** Matches English, Sinhala and Tamil names and station codes. */
  searchStations(query: string): Promise<Station[]>;
  getStation(id: string): Promise<Station | null>;

  searchTrains(params: SearchTrainsParams): Promise<Trip[]>;
  getTrain(id: string): Promise<Train | null>;
  /** A train between two of its stops on a date, or null if it doesn't run then. */
  getTrip(params: GetTripParams): Promise<Trip | null>;

  /** Preview: simulated live position for a train service (by the date it left its origin). */
  getLivePosition(trainId: string, serviceDate: IsoDate, now?: Date): Promise<LivePosition | null>;
  /** Preview: next departures from a station. */
  getStationBoard(stationId: string, now?: Date, limit?: number): Promise<BoardEntry[]>;
}
