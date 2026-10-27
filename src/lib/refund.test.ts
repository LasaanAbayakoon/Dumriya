import { defaultServiceCharge, refundPercent, refundQuote } from './refund';
import { HOUR, MINUTE } from './time';

const D = new Date('2026-12-10T08:30:00+05:30'); // departure
const before = (ms: number) => new Date(D.getTime() - ms);

describe('refund tier boundaries (lower refund on an exact boundary)', () => {
  test.each([
    ['168 h + 1 min before', 168 * HOUR + MINUTE, 75],
    ['exactly 168 h before', 168 * HOUR, 50],
    ['168 h − 1 min before', 168 * HOUR - MINUTE, 50],
    ['48 h + 1 min before', 48 * HOUR + MINUTE, 50],
    ['exactly 48 h before', 48 * HOUR, 0],
    ['48 h − 1 min before', 48 * HOUR - MINUTE, 0],
  ])('%s → %i %%', (_label, msLeft, expected) => {
    expect(refundPercent(msLeft)).toBe(expected);
    expect(refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, before(msLeft)).percent).toBe(expected);
  });

  test('far ahead is 75 %, after departure is 0 %', () => {
    expect(refundPercent(60 * 24 * HOUR)).toBe(75);
    expect(refundPercent(0)).toBe(0);
    expect(refundPercent(-HOUR)).toBe(0);
  });
});

describe('refundQuote amounts', () => {
  test('refund is a percentage of the fare only; the service charge is never refunded', () => {
    const q = refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, before(200 * HOUR));
    expect(q.refundLkr).toBe(750);
    expect(q.notRefundedLkr).toBe(300); // 250 fare + 50 service charge
    expect(q.serviceChargeLkr).toBe(50);
  });

  test('50 % tier', () => {
    const q = refundQuote({ departure: D, fareLkr: 1240, serviceChargeLkr: 62 }, before(100 * HOUR));
    expect(q.refundLkr).toBe(620);
    expect(q.notRefundedLkr).toBe(682);
  });

  test('rounds DOWN to the cent so it never over-promises', () => {
    const q = refundQuote({ departure: D, fareLkr: 333.33, serviceChargeLkr: 16.67 }, before(200 * HOUR));
    expect(q.refundLkr).toBe(249.99); // 249.9975
  });

  test('after departure: departed, nothing refunded, no next drop', () => {
    const q = refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, new Date(D.getTime() + HOUR));
    expect(q.departed).toBe(true);
    expect(q.refundLkr).toBe(0);
    expect(q.nextDropAt).toBeNull();
  });
});

describe('tier deadlines and next drop', () => {
  test('each tier has the exact deadline', () => {
    const q = refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, before(300 * HOUR));
    expect(q.tiers.map((t) => t.percent)).toEqual([75, 50, 0]);
    expect(q.tiers[0]!.until!.toISOString()).toBe(before(168 * HOUR).toISOString());
    expect(q.tiers[1]!.from!.toISOString()).toBe(before(168 * HOUR).toISOString());
    expect(q.tiers[1]!.until!.toISOString()).toBe(before(48 * HOUR).toISOString());
    expect(q.tiers[2]!.from!.toISOString()).toBe(before(48 * HOUR).toISOString());
    expect(q.tiers[2]!.until).toBeNull();
  });

  test.each([
    [300 * HOUR, 168 * HOUR],
    [168 * HOUR, 48 * HOUR], // exactly on the boundary we're already in the 50 % tier
    [100 * HOUR, 48 * HOUR],
  ])('with %d ms left the next drop is at departure − %d ms', (left, dropBefore) => {
    const q = refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, before(left));
    expect(q.nextDropAt?.toISOString()).toBe(before(dropBefore).toISOString());
  });

  test('no next drop once at 0 %', () => {
    expect(refundQuote({ departure: D, fareLkr: 1000, serviceChargeLkr: 50 }, before(10 * HOUR)).nextDropAt).toBeNull();
  });
});

test('default service charge is 5 % of the fare', () => {
  expect(defaultServiceCharge(1000)).toBe(50);
  expect(defaultServiceCharge(333)).toBe(16.65);
  expect(defaultServiceCharge(0)).toBe(0);
});
