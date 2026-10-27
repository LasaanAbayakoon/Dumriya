/**
 * The ONLY module screens import data from.
 *
 * ── Swap point ──────────────────────────────────────────────────────────────
 * To switch to the real FastAPI backend, write `./http.ts` exporting an object
 * that implements `DumriyaApi` (see ./contract.ts) and change the line below.
 * No screen needs to change.
 */
import type { DumriyaApi } from './contract';
import { mockApi } from './mock';

const api: DumriyaApi = mockApi;

/**
 * True while the mock (sample) data is in use. Screens showing train data display a
 * permanent "Sample timetable" bar while this is true; it disappears on its own once
 * `api` above points at the real backend.
 */
export const IS_SAMPLE_DATA: boolean = api === mockApi;

export type { DumriyaApi, GetTripParams, SearchTrainsParams } from './contract';

export const listStations: DumriyaApi['listStations'] = (...a) => api.listStations(...a);
export const searchStations: DumriyaApi['searchStations'] = (...a) => api.searchStations(...a);
export const getStation: DumriyaApi['getStation'] = (...a) => api.getStation(...a);
export const searchTrains: DumriyaApi['searchTrains'] = (...a) => api.searchTrains(...a);
export const getTrain: DumriyaApi['getTrain'] = (...a) => api.getTrain(...a);
export const getTrip: DumriyaApi['getTrip'] = (...a) => api.getTrip(...a);
export const getLivePosition: DumriyaApi['getLivePosition'] = (...a) => api.getLivePosition(...a);
export const getStationBoard: DumriyaApi['getStationBoard'] = (...a) => api.getStationBoard(...a);
