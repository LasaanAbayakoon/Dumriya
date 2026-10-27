// SAMPLE DATA – NOT OFFICIAL. See the _notice field in each src/mocks/*.json file.
import stationsJson from '@/mocks/stations.json';
import trainsJson from '@/mocks/trains.json';
import faresJson from '@/mocks/fares.json';
import type { Station, Train, TravelClass } from '@/types';

export const stations = stationsJson.stations as unknown as Station[];
export const trains = trainsJson.trains as unknown as Train[];
export const fareTable = faresJson as unknown as {
  perKm: Record<TravelClass, number>;
  minimum: Record<TravelClass, number>;
  roundTo: number;
};

export const stationById = new Map(stations.map((s) => [s.id, s]));
export const trainById = new Map(trains.map((t) => [t.id, t]));

export const NOTICES = [stationsJson._notice, trainsJson._notice, faresJson._notice];
