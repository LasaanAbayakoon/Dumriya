/**
 * Simulated live running for the Preview screens. Deterministic per train and
 * date so the UI is stable between reloads. Nothing here is real data.
 */
import { DELAYED_THRESHOLD_MIN } from '@/config/app';
import { colomboDateTime, MINUTE } from '@/lib/time';
import type { IsoDate, Train, TrainStatus } from '@/types';
import { stationById } from './data';

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function isCancelled(trainId: string, serviceDate: IsoDate): boolean {
  return hash(`${trainId}|${serviceDate}|c`) % 17 === 0;
}

/** Delay in minutes at each stop: grows from 0 at the origin up to a per-service maximum (0–25 min). */
export function delayProfile(train: Train, serviceDate: IsoDate): number[] {
  const max = hash(`${train.id}|${serviceDate}`) % 26;
  const n = train.stops.length;
  return train.stops.map((_, i) => (n <= 1 ? 0 : Math.round((max * i) / (n - 1))));
}

export interface StopTimes {
  scheduledArr: Date | null;
  scheduledDep: Date | null;
  actualArr: Date | null;
  actualDep: Date | null;
  delayMin: number;
}

export function stopTimes(train: Train, serviceDate: IsoDate): StopTimes[] {
  const delays = delayProfile(train, serviceDate);
  return train.stops.map((s, i) => {
    const d = delays[i] ?? 0;
    const sa = s.arrival ? colomboDateTime(serviceDate, s.arrival, s.dayOffset) : null;
    const sd = s.departure ? colomboDateTime(serviceDate, s.departure, s.dayOffset) : null;
    const plus = (x: Date | null) => (x ? new Date(x.getTime() + d * MINUTE) : null);
    return { scheduledArr: sa, scheduledDep: sd, actualArr: plus(sa), actualDep: plus(sd), delayMin: d };
  });
}

export interface SimulatedState {
  status: TrainStatus;
  lat: number;
  lng: number;
  lastIndex: number;
  nextIndex: number;
  delayMin: number;
}

export function simulate(train: Train, serviceDate: IsoDate, at: Date): SimulatedState {
  const times = stopTimes(train, serviceDate);
  const coords = train.stops.map((s) => stationById.get(s.stationId)!);
  const last = train.stops.length - 1;
  const t = at.getTime();
  const statusFor = (delay: number): TrainStatus => (delay >= DELAYED_THRESHOLD_MIN ? 'delayed' : 'on-time');
  const at0 = (i: number, status: TrainStatus, delayMin: number): SimulatedState => ({
    status,
    lat: coords[i]!.lat,
    lng: coords[i]!.lng,
    lastIndex: i,
    nextIndex: i,
    delayMin,
  });

  if (isCancelled(train.id, serviceDate)) return at0(0, 'cancelled', 0);
  if (t < times[0]!.actualDep!.getTime()) return at0(0, 'not-started', 0);
  if (t >= times[last]!.actualArr!.getTime()) return at0(last, 'arrived', times[last]!.delayMin);

  for (let i = 0; i < last; i++) {
    const here = times[i]!;
    const next = times[i + 1]!;
    // Standing at station i (between its arrival and departure).
    if (here.actualArr && t >= here.actualArr.getTime() && t < here.actualDep!.getTime()) {
      return at0(i, statusFor(here.delayMin), here.delayMin);
    }
    // Running between i and i+1.
    const dep = here.actualDep!.getTime();
    const arr = next.actualArr!.getTime();
    if (t >= dep && t < arr) {
      const f = (t - dep) / (arr - dep);
      const a = coords[i]!;
      const b = coords[i + 1]!;
      const delay = Math.round(here.delayMin + (next.delayMin - here.delayMin) * f);
      return {
        status: statusFor(delay),
        lat: a.lat + (b.lat - a.lat) * f,
        lng: a.lng + (b.lng - a.lng) * f,
        lastIndex: i,
        nextIndex: i + 1,
        delayMin: delay,
      };
    }
  }
  return at0(last, 'arrived', times[last]!.delayMin);
}
