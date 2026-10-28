/**
 * Mock implementation of the Dumriya API, backed by SAMPLE JSON in src/mocks.
 * Replace with an HTTP client implementing the same DumriyaApi interface.
 */
import { DELAYED_THRESHOLD_MIN, SIMULATED_POSITION_AGE_MIN } from '@/config/app';
import { addDays, colomboDateOf, colomboIso, colomboTimeOf, minutesBetween, MINUTE, toColomboIso, weekdayOf } from '@/lib/time';
import type { BoardEntry, Fare, FollowEvent, FollowOptions, IsoDate, LivePosition, Station, Train, TravelClass, Trip } from '@/types';
import type { DumriyaApi, GetTripParams, SearchTrainsParams } from '../contract';
import { fareTable, stationById, stations, trainById, trains } from './data';
import { respond } from './delay';
import { isCancelled, simulate, stopTimes } from './simulate';

// ── Stations ────────────────────────────────────────────────────────────────

/** Lowercase and strip Latin accents; Sinhala/Tamil are compared as-is (NFC). */
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC')
    .toLowerCase()
    .trim();

function stationScore(st: Station, q: string): number {
  if (normalize(st.code) === q) return 0;
  const names = [st.name.en, st.name.si, st.name.ta].map(normalize);
  if (names.some((n) => n.startsWith(q))) return 1;
  if (names.some((n) => n.split(/\s+/).some((w) => w.startsWith(q)))) return 2;
  if (names.some((n) => n.includes(q))) return 3;
  return -1;
}

export function findStations(query: string): Station[] {
  const q = normalize(query);
  if (!q) return [...stations].sort((a, b) => a.name.en.localeCompare(b.name.en));
  return stations
    .map((s) => ({ s, score: stationScore(s, q) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score || a.s.name.en.localeCompare(b.s.name.en))
    .map((x) => x.s);
}

// ── Fares and trips ─────────────────────────────────────────────────────────

export function fareFor(travelClass: TravelClass, km: number): number {
  const raw = Math.max(fareTable.minimum[travelClass], km * fareTable.perKm[travelClass]);
  return Math.ceil(raw / fareTable.roundTo) * fareTable.roundTo;
}

/** Build a Trip for a train between two stop indexes, boarding on `date`. Null if the train doesn't run. */
export function buildTrip(train: Train, fromIdx: number, toIdx: number, date: IsoDate): Trip | null {
  const from = train.stops[fromIdx];
  const to = train.stops[toIdx];
  if (!from || !to || fromIdx >= toIdx || !from.departure || !to.arrival) return null;

  const serviceDate = addDays(date, -from.dayOffset);
  if (!train.runningDays.includes(weekdayOf(serviceDate))) return null;

  const departure = colomboIso(serviceDate, from.departure, from.dayOffset);
  const arrival = colomboIso(serviceDate, to.arrival, to.dayOffset);
  const km = to.km - from.km;
  const fares: Fare[] = train.classes.map((c) => ({
    travelClass: c.travelClass,
    reservable: c.reservable,
    amountLkr: fareFor(c.travelClass, km),
  }));

  return {
    train,
    date,
    serviceDate,
    from,
    to,
    departure,
    arrival,
    durationMin: minutesBetween(departure, arrival),
    fares,
    reservableOnline: train.classes.some((c) => c.reservable),
  };
}

export function findTrips({ fromStationId, toStationId, date, time = '00:00' }: SearchTrainsParams): Trip[] {
  const trips: Trip[] = [];
  for (const train of trains) {
    const fromIdx = train.stops.findIndex((s) => s.stationId === fromStationId);
    const toIdx = train.stops.findIndex((s) => s.stationId === toStationId);
    if (fromIdx < 0 || toIdx <= fromIdx) continue;
    const trip = buildTrip(train, fromIdx, toIdx, date);
    if (!trip) continue;
    const dep = new Date(trip.departure);
    if (colomboDateOf(dep) !== date || colomboTimeOf(dep) < time) continue;
    trips.push(trip);
  }
  return trips.sort((a, b) => a.departure.localeCompare(b.departure));
}

function findTrip({ trainId, date, fromStationId, toStationId }: GetTripParams): Trip | null {
  const train = trainById.get(trainId);
  if (!train) return null;
  const fromIdx = fromStationId ? train.stops.findIndex((s) => s.stationId === fromStationId) : 0;
  const toIdx = toStationId ? train.stops.findIndex((s) => s.stationId === toStationId) : train.stops.length - 1;
  return buildTrip(train, fromIdx, toIdx, date);
}

// ── Live (Preview, simulated) ───────────────────────────────────────────────

function livePosition(trainId: string, serviceDate: IsoDate, now: Date): LivePosition | null {
  const train = trainById.get(trainId);
  if (!train) return null;
  const updatedAt = new Date(now.getTime() - SIMULATED_POSITION_AGE_MIN * MINUTE);
  const sim = simulate(train, serviceDate, updatedAt);
  const times = stopTimes(train, serviceDate);
  const next = times[sim.nextIndex]!;
  const sched = next.scheduledArr ?? next.scheduledDep;
  const pred = next.actualArr ?? next.actualDep;
  return {
    trainId,
    date: serviceDate,
    status: sim.status,
    lat: sim.lat,
    lng: sim.lng,
    lastStopId: train.stops[sim.lastIndex]!.stationId,
    nextStopId: train.stops[sim.nextIndex]!.stationId,
    delayMin: sim.delayMin,
    nextStopScheduled: sched ? toColomboIso(sched) : null,
    nextStopPredicted: pred && sim.status !== 'cancelled' ? toColomboIso(pred) : null,
    updatedAt: toColomboIso(updatedAt),
    source: 'simulated' as const,
    stops: train.stops.map((st, i) => {
      const t = times[i]!;
      const cancelled = sim.status === 'cancelled';
      const iso = (d: Date | null) => (d ? toColomboIso(d) : null);
      const leftAt = t.actualDep ?? t.actualArr;
      return {
        stationId: st.stationId,
        scheduledArrival: iso(t.scheduledArr),
        scheduledDeparture: iso(t.scheduledDep),
        predictedArrival: cancelled ? null : iso(t.actualArr),
        predictedDeparture: cancelled ? null : iso(t.actualDep),
        passed: !cancelled && leftAt !== null && leftAt.getTime() <= updatedAt.getTime(),
      };
    }),
  };
}

/**
 * Simulated follow events: a delay event at the first stop where the simulated delay is
 * MORE than the limit, and a cancellation announced 2 h before the train leaves its origin.
 */
function followEvents(trainId: string, serviceDate: IsoDate, options: FollowOptions): FollowEvent[] {
  const train = trainById.get(trainId);
  if (!train || !train.runningDays.includes(weekdayOf(serviceDate))) return [];
  const times = stopTimes(train, serviceDate);
  if (isCancelled(trainId, serviceDate)) {
    if (!options.cancellation) return [];
    const announced = new Date(times[0]!.scheduledDep!.getTime() - 2 * 60 * MINUTE);
    return [{ kind: 'cancelled', at: toColomboIso(announced) }];
  }
  if (options.delayOverMin === null) return [];
  const i = times.findIndex((t) => t.delayMin > options.delayOverMin!);
  if (i < 0) return [];
  const t = times[i]!;
  return [{ kind: 'delay', at: toColomboIso((t.actualArr ?? t.actualDep)!), delayMin: t.delayMin, stationId: train.stops[i]!.stationId }];
}

function stationBoard(stationId: string, now: Date, limit: number): BoardEntry[] {
  const today = colomboDateOf(now);
  const entries: BoardEntry[] = [];
  for (const train of trains) {
    const idx = train.stops.findIndex((s) => s.stationId === stationId && s.departure);
    if (idx < 0) continue;
    // Yesterday's service covers night trains that reach this station after midnight.
    for (const serviceDate of [addDays(today, -1), today, addDays(today, 1)]) {
      if (!train.runningDays.includes(weekdayOf(serviceDate))) continue;
      const t = stopTimes(train, serviceDate)[idx]!;
      const sim = simulate(train, serviceDate, now);
      const cancelled = sim.status === 'cancelled';
      const predicted = cancelled ? null : t.actualDep!;
      // Show departures from 5 minutes ago up to 24 hours ahead.
      const ref = (predicted ?? t.scheduledDep!).getTime();
      if (ref < now.getTime() - 5 * MINUTE || ref > now.getTime() + 24 * 60 * MINUTE) continue;
      entries.push({
        trainId: train.id,
        trainNumber: train.number,
        trainName: train.name,
        destinationStationId: train.stops[train.stops.length - 1]!.stationId,
        scheduled: toColomboIso(t.scheduledDep!),
        predicted: predicted ? toColomboIso(predicted) : null,
        status: cancelled ? 'cancelled' : t.delayMin >= DELAYED_THRESHOLD_MIN ? 'delayed' : 'on-time',
        delayMin: cancelled ? 0 : t.delayMin,
        platform: train.stops[idx]!.platform ?? null,
      });
    }
  }
  return entries.sort((a, b) => a.scheduled.localeCompare(b.scheduled)).slice(0, limit);
}

// ── Public mock API ─────────────────────────────────────────────────────────

export const mockApi: DumriyaApi = {
  listStations: () => respond(stations),
  searchStations: (query) => respond(findStations(query)),
  getStation: (id) => respond(stationById.get(id) ?? null),
  searchTrains: (params) => respond(findTrips(params)),
  getTrain: (id) => respond(trainById.get(id) ?? null),
  getTrip: (params) => respond(findTrip(params)),
  getLivePosition: (trainId, serviceDate, now = new Date()) => respond(livePosition(trainId, serviceDate, now)),
  getFollowEvents: (trainId, serviceDate, options) => respond(followEvents(trainId, serviceDate, options)),
  getStationBoard: (stationId, now = new Date(), limit = 10) => respond(stationBoard(stationId, now, limit)),
};
