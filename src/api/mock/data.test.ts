import stationsJson from '@/mocks/stations.json';
import trainsJson from '@/mocks/trains.json';
import faresJson from '@/mocks/fares.json';
import { clockToMinutes } from '@/lib/time';
import { stationById, stations, trains } from './data';

test('every mock file is clearly marked as sample data', () => {
  for (const file of [stationsJson, trainsJson, faresJson]) {
    expect(file._notice).toMatch(/^SAMPLE DATA – NOT OFFICIAL/);
  }
});

test('stations have unique ids and codes and names in all three languages', () => {
  expect(new Set(stations.map((s) => s.id)).size).toBe(stations.length);
  expect(new Set(stations.map((s) => s.code)).size).toBe(stations.length);
  for (const s of stations) {
    expect(s.name.en && s.name.si && s.name.ta).toBeTruthy();
    expect(s.lat).toBeGreaterThan(5.8);
    expect(s.lat).toBeLessThan(9.9);
    expect(s.lng).toBeGreaterThan(79.5);
    expect(s.lng).toBeLessThan(82);
  }
});

test('covers the Main line to Badulla via Kandy and Ella, and the Coastal line to Matara', () => {
  for (const id of ['colombo-fort', 'kandy', 'ella', 'badulla', 'galle', 'matara']) expect(stationById.has(id)).toBe(true);
});

describe.each(trains.map((t) => [t.id, t] as const))('train %s', (_id, train) => {
  test('stops reference real stations on its line, once each', () => {
    const ids = train.stops.map((s) => s.stationId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const st = stationById.get(id);
      expect(st, id).toBeDefined();
      expect(st!.lines).toContain(train.line);
    }
  });

  test('origin has no arrival, terminus has no departure, others have both', () => {
    const last = train.stops.length - 1;
    train.stops.forEach((s, i) => {
      expect(s.arrival === null).toBe(i === 0);
      expect(s.departure === null).toBe(i === last);
    });
  });

  test('times and distances only move forward', () => {
    const abs = (t: string | null, day: number) => (t === null ? null : day * 1440 + clockToMinutes(t));
    let prev = -1;
    let prevKm = -1;
    for (const s of train.stops) {
      const a = abs(s.arrival, s.dayOffset);
      const d = abs(s.departure, s.dayOffset);
      if (a !== null) expect(a).toBeGreaterThan(prev);
      if (a !== null && d !== null) expect(d).toBeGreaterThanOrEqual(a);
      prev = d ?? a ?? prev;
      expect(s.km).toBeGreaterThan(prevKm);
      prevKm = s.km;
    }
    expect(train.stops[0]!.km).toBe(0);
  });

  test('has running days and classes', () => {
    expect(train.runningDays.length).toBeGreaterThan(0);
    expect(train.runningDays.every((d) => d >= 0 && d <= 6)).toBe(true);
    expect(train.classes.length).toBeGreaterThan(0);
  });
});
