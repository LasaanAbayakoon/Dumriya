import { getLivePosition, getStationBoard, getTrain, getTrip, searchStations, searchTrains } from '@/api';
import { isCancelled } from '@/api/mock/simulate';
import { addDays } from '@/lib/time';

// 2026-11-01 is a Sunday, 2026-11-02 a Monday.
const SUN = '2026-11-01';
const MON = '2026-11-02';
const SAT = '2026-11-07';

describe('searchStations', () => {
  test.each([
    { query: 'kandy', id: 'kandy' },
    { query: 'KAN', id: 'kandy' },
    { query: 'මහනුවර', id: 'kandy' },
    { query: 'கண்டி', id: 'kandy' },
    { query: 'GLE', id: 'galle' },
    { query: 'fort', id: 'colombo-fort' },
    { query: 'lavinia', id: 'mount-lavinia' },
    { query: 'ගල්කිස්ස', id: 'mount-lavinia' },
  ])('"$query" finds $id first', async ({ query, id }) => {
    const res = await searchStations(query);
    expect(res[0]?.id).toBe(id);
  });

  test('empty query lists all stations; nonsense finds none', async () => {
    expect((await searchStations('')).length).toBeGreaterThan(15);
    expect(await searchStations('zzzz')).toEqual([]);
  });
});

describe('searchTrains', () => {
  test('only returns trains running on that day, sorted by departure', async () => {
    const sun = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'badulla', date: SUN });
    expect(sun.map((t) => t.train.id)).toEqual(['1005', '1015', '1045']);
    const mon = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'badulla', date: MON });
    expect(mon.map((t) => t.train.id)).toEqual(['1005', '1001', '1015', '1045']);
  });

  test('respects direction', async () => {
    const up = await searchTrains({ fromStationId: 'badulla', toStationId: 'colombo-fort', date: MON });
    expect(up.map((t) => t.train.id)).toEqual(['1006', '1046']);
  });

  test('filters by earliest departure time', async () => {
    const res = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'kandy', date: MON, time: '15:00' });
    expect(res.map((t) => t.train.id)).toEqual(['1029', '1161']);
  });

  test('night train arriving the next day has correct times, duration and fares', async () => {
    const [nightMail] = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'ella', date: MON, time: '19:00' });
    expect(nightMail?.train.id).toBe('1045');
    expect(nightMail?.departure).toBe('2026-11-02T20:00:00+05:30');
    expect(nightMail?.arrival).toBe('2026-11-03T06:48:00+05:30');
    expect(nightMail?.durationMin).toBe(648);
    expect(nightMail?.fares.map((f) => f.travelClass)).toEqual(['second', 'third']);
    expect(nightMail?.fares.every((f) => f.amountLkr > 0 && f.amountLkr % 10 === 0)).toBe(true);
  });

  test('boarding a night train after midnight uses the previous service date', async () => {
    const res = await searchTrains({ fromStationId: 'nawalapitiya', toStationId: 'badulla', date: '2026-11-04' });
    const nm = res.find((t) => t.train.id === '1045');
    expect(nm?.serviceDate).toBe('2026-11-03');
    expect(nm?.departure).toBe('2026-11-04T00:35:00+05:30');
  });

  test('flags unreserved-only trains', async () => {
    const res = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'matara', date: MON });
    const byId = Object.fromEntries(res.map((t) => [t.train.id, t]));
    expect(byId['8086']?.reservableOnline).toBe(true);
    expect(byId['8059']?.reservableOnline).toBe(false);
  });

  test('longer journeys cost more', async () => {
    const [short] = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'polgahawela', date: MON, time: '08:00' });
    const [long] = await searchTrains({ fromStationId: 'colombo-fort', toStationId: 'badulla', date: MON, time: '08:00' });
    const second = (t: typeof short) => t!.fares.find((f) => f.travelClass === 'second')!.amountLkr;
    expect(second(long)).toBeGreaterThan(second(short));
  });
});

describe('getTrain / getTrip', () => {
  test('unknown train is null', async () => {
    expect(await getTrain('nope')).toBeNull();
  });

  test('trip defaults to origin and terminus; null when not running', async () => {
    const trip = await getTrip({ trainId: '1029', date: MON });
    expect(trip?.from.stationId).toBe('colombo-fort');
    expect(trip?.to.stationId).toBe('kandy');
    expect(await getTrip({ trainId: '1029', date: SAT })).toBeNull();
  });

  test('returns copies, so callers cannot corrupt mock data', async () => {
    const t = await getTrain('1005');
    t!.stops.length = 0;
    expect((await getTrain('1005'))!.stops.length).toBeGreaterThan(0);
  });
});

describe('Preview: live position and station board (simulated)', () => {
  // Find a service date the simulator doesn't cancel.
  let date = MON;
  while (isCancelled('1015', date)) date = addDays(date, 1);
  const at = (hhmm: string) => new Date(`${date}T${hhmm}:00+05:30`);

  test('before departure, mid-journey and after arrival', async () => {
    expect((await getLivePosition('1015', date, at('07:00')))?.status).toBe('not-started');

    const mid = await getLivePosition('1015', date, at('12:00'));
    expect(['on-time', 'delayed']).toContain(mid?.status);
    expect(mid?.source).toBe('simulated');
    expect(mid?.lng).toBeGreaterThan(79.8);
    expect(mid?.lng).toBeLessThan(81.1);

    expect((await getLivePosition('1015', date, at('23:00')))?.status).toBe('arrived');
  });

  test('reports a position from 2 minutes ago', async () => {
    const now = at('12:00');
    const pos = await getLivePosition('1015', date, now);
    expect(new Date(pos!.updatedAt).getTime()).toBe(now.getTime() - 2 * 60_000);
  });

  test('station board lists upcoming departures in order, within the limit', async () => {
    const board = await getStationBoard('galle', new Date(`${MON}T06:00:00+05:30`), 4);
    expect(board).toHaveLength(4);
    const times = board.map((b) => b.scheduled);
    expect([...times].sort()).toEqual(times);
    expect(board[0]?.trainId).toBe('8058');
  });
});
