import { planBookings, praveshaWindow, splitPassengers, trueTotal } from './booking';

test.each([
  { passengers: 0, groups: [] },
  { passengers: 1, groups: [1] },
  { passengers: 5, groups: [5] },
  { passengers: 6, groups: [5, 1] },
  { passengers: 7, groups: [5, 2] },
  { passengers: 12, groups: [5, 5, 2] },
])('splitPassengers($passengers) → $groups (max 5 per booking)', ({ passengers, groups }) => {
  expect(splitPassengers(passengers)).toEqual(groups);
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
    { fare: 1000, seats: 2, fareTotal: 2000, fee: 100, total: 2100 },
    { fare: 333, seats: 3, fareTotal: 999, fee: 49.95, total: 1048.95 },
    { fare: 101, seats: 1, fareTotal: 101, fee: 5.05, total: 106.05 },
    { fare: 1, seats: 1, fareTotal: 1, fee: 0.05, total: 1.05 },
  ])('$fare × $seats seats = $fareTotal + $fee fee = $total', ({ fare, seats, fareTotal, fee, total }) => {
    expect(trueTotal(fare, seats)).toEqual({ fareTotalLkr: fareTotal, convenienceFeeLkr: fee, totalLkr: total });
  });

  test('rounds the fee UP to the cent, never under-stating the cost', () => {
    expect(trueTotal(10.01, 1).convenienceFeeLkr).toBe(0.51); // 0.5005
  });
});

describe('Pravesha commuter tickets: up to 7 days in advance', () => {
  const at = (iso: string) => new Date(`${iso}+05:30`);
  test.each([
    { now: '2026-12-02T23:59:00', canBuy: false },
    { now: '2026-12-03T00:00:00', canBuy: true },
    { now: '2026-12-10T21:00:00', canBuy: true },
    { now: '2026-12-11T00:00:00', canBuy: false },
  ])('travel 10 Dec, now $now → can buy: $canBuy', ({ now, canBuy }) => {
    const w = praveshaWindow('2026-12-10', at(now));
    expect(w.opensOn).toBe('2026-12-03');
    expect(w.canBuyNow).toBe(canBuy);
  });
});
