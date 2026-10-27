/**
 * Guards for the policy config: pins every rule's value (so a change is deliberate
 * and reviewed) and checks the README rules table mentions every constant.
 */
import readme from '../../README.md?raw';
import * as policy from './policy';

test('policy values match the documented SLR rules', () => {
  expect(policy).toMatchObject({
    POLICY_TIMEZONE: 'Asia/Colombo',
    BOOKING_WINDOW_DAYS: 30,
    BOOKING_OPEN_TIME: null,
    BOOKING_CLOSE_HOURS_BEFORE: 2,
    BOOKING_CLOSE_USE_BOARDING_STATION: false,
    MAX_SEATS_PER_BOOKING: 5,
    CONVENIENCE_FEE_RATE: 0.05,
    PAYMENT_METHODS: ['card', 'lankaqr'],
    EMAIL_REQUIRED_FOR_ETICKET: true,
    ID_REQUIRED_PER_PASSENGER: true,
    TICKETS_TRANSFERABLE: false,
    ID_MISMATCH_PENALTY_FARE_MULTIPLIER: 2,
    REFUND_TIERS: [
      { moreThanHours: 168, percent: 75 },
      { moreThanHours: 48, percent: 50 },
    ],
    REFUND_FALLBACK_PERCENT: 0,
    SERVICE_CHARGE_REFUNDABLE: false,
    REFUND_IN_PERSON_ONLY: true,
    WARRANT_EXPIRES_DAYS_AFTER_BOOKING: 7,
    WARRANT_EXPIRES_HOURS_BEFORE_JOURNEY: 48,
    PRAVESHA_ADVANCE_DAYS: 7,
    PRAVESHA_MAX_TICKETS_PER_ORDER: 5,
    DISPUTE_TYPE_LABEL: 'Payment issue',
  });
});

test('refund tiers are ordered from highest threshold to lowest', () => {
  const hours = policy.REFUND_TIERS.map((t) => t.moreThanHours);
  expect([...hours].sort((a, b) => b - a)).toEqual(hours);
});

test('README rules table lists every policy constant', () => {
  const missing = Object.keys(policy).filter((name) => !name.startsWith('POLICY_') && !readme.includes(`\`${name}\``));
  expect(missing).toEqual([]);
});
