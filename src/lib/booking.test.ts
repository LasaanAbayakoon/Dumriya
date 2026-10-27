import { planBookings, praveshaWindow, splitPassengers, trueTotal } from './booking';

test.each([
  [0, []],
  [1, [1]],
  [5, [5]],
  [6, [5, 1]],
  [7, [5, 2]],
  [12, [5, 5, 2]],
])('splitPassengers(%i) → %j (max 5 per booking)', (n, groups) => {
  expect(splitPassengers(n)).toEqual(groups);
});

const out = { passengers: 4, boardingStationId: 'colombo-fort', alightingStationId: 'ella' };

describe('planBookings', () => {
  test('one-way group of 7 needs 2 bookings', () => {
    expect(planBookings({ ...out, passengers: 7 }).totalBookings).toBe(2);
  });

  test('simple return (same people, boarding where you got off) can go together', () => {
    const plan = planBookings(out, { passengers: 4, boardingStationId: 'ella', alightingStationId: 'colombo-fort' });
    expect(plan.separateReturnReasons).toEqual([]);
    expect(plan.totalBookings).toBe(1);
  });

  test('return with a different passenger count needs its own booking', () => {
    const plan = planBookings(out, { passengers: 3, boardingStationId: 'ella', alightingStationId: 'colombo-fort' });
    expect(plan.separateReturnReasons).toEqual(['different-passengers']);
    expect(plan.totalBookings).toBe(2);
  });

  test('return from a different boarding station needs its own booking', () => {
    const plan = planBookings(out, { passengers: 4, boardingStationId: 'badulla', alightingStationId: 'colombo-fort' });
    expect(plan.separateReturnReasons).toEqual(['different-boarding-station']);
    expect(plan.totalBookings).toBe(2);
  });

  test('big group with a different return: 7 out (5+2) and 6 back (5+1) = 4 bookings', () => {
    const plan = planBookings(
      { ...out, passengers: 7 },
      { passengers: 6, boardingStationId: 'badulla', alightingStationId: 'colombo-fort' },
    );
    expect(plan.outboundGroups).toEqual([5, 2]);
    expect(plan.returnGroups).toEqual([5, 1]);
    expect(plan.separateReturnReasons).toEqual(['different-passengers', 'different-boarding-station']);
    expect(plan.totalBookings).toBe(4);
  });
});

describe('trueTotal = fare + 5 % convenience fee', () => {
  test.each([
    [1000, 2, 2000, 100, 2100],
    [333, 3, 999, 49.95, 1048.95],
    [101, 1, 101, 5.05, 106.05],
    [1, 1, 1, 0.05, 1.05],
  ])('%d × %d seats', (fare, seats, fareTotal, fee, total) => {
    expect(trueTotal(fare, seats)).toEqual({ fareTotalLkr: fareTotal, convenienceFeeLkr: fee, totalLkr: total });
  });

  test('rounds the fee UP to the cent, never under-stating the cost', () => {
    expect(trueTotal(10.01, 1).convenienceFeeLkr).toBe(0.51); // 0.5005
  });
});

describe('Pravesha commuter tickets: up to 7 days in advance', () => {
  const at = (iso: string) => new Date(`${iso}+05:30`);
  test.each([
    ['2026-12-02T23:59:00', false],
    ['2026-12-03T00:00:00', true],
    ['2026-12-10T21:00:00', true],
    ['2026-12-11T00:00:00', false],
  ])('travel 10 Dec, now %s → can buy: %s', (now, can) => {
    const w = praveshaWindow('2026-12-10', at(now));
    expect(w.opensOn).toBe('2026-12-03');
    expect(w.canBuyNow).toBe(can);
  });
});
