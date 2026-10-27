import { acceptLast4, buildDisputeText, EMPTY_DISPUTE, normalizeMobile, validateDispute, type DisputeFields } from './dispute';

const valid: DisputeFields = {
  name: 'A. Perera',
  mobile: '077 123 4567',
  location: 'Kandy',
  paidDate: '2026-11-10',
  paidTime: '14:30',
  reference: 'SR123456789',
  last4: '4242',
  email: 'a.perera@example.com',
};

describe('last 4 card digits: never a full card number', () => {
  test.each([
    { input: '4242', expected: { value: '4242' } },
    { input: '42', expected: { value: '42' } },
    { input: '4 2-4', expected: { value: '424' } },
    { input: '', expected: { value: '' } },
  ])('accepts "$input"', ({ input, expected }) => {
    expect(acceptLast4(input)).toEqual(expected);
  });

  test.each([
    { input: '42424', why: '5 digits' },
    { input: '4111111111111111', why: 'a full card number' },
    { input: '4111 1111 1111 1111', why: 'a spaced card number' },
    { input: '4111-1111-1111-1111', why: 'a dashed card number' },
  ])('refuses "$input" ($why) instead of truncating it', ({ input }) => {
    expect(acceptLast4(input)).toEqual({ refused: true });
  });
});

test.each([
  { raw: '0771234567', ok: '0771234567' },
  { raw: '077 123 4567', ok: '0771234567' },
  { raw: '+94 77 123 4567', ok: '0771234567' },
  { raw: '94771234567', ok: '0771234567' },
  { raw: '0112345678', ok: null }, // landline
  { raw: '07712345', ok: null },
])('mobile "$raw" → $ok', ({ raw, ok }) => {
  expect(normalizeMobile(raw)).toBe(ok);
});

test('validation', () => {
  expect(validateDispute(valid)).toEqual({});
  expect(Object.values(validateDispute(EMPTY_DISPUTE)).every((e) => e === 'required')).toBe(true);
  expect(Object.keys(validateDispute(EMPTY_DISPUTE))).toHaveLength(8);
  expect(validateDispute({ ...valid, last4: '42' })).toEqual({ last4: 'last4' });
  expect(validateDispute({ ...valid, email: 'not-an-email' })).toEqual({ email: 'email' });
  expect(validateDispute({ ...valid, mobile: '12345' })).toEqual({ mobile: 'mobile' });
});

test('the copied block is clean English text with the dispute type', () => {
  expect(buildDisputeText(valid)).toBe(
    [
      'Dispute type: Payment issue',
      'Problem: my card was charged but I did not receive an e-ticket.',
      '',
      'Name: A. Perera',
      'Mobile: 0771234567',
      'Location: Kandy',
      'Date and time of payment: Tue, 10 Nov 2026, 14:30 (Sri Lanka time)',
      'Reference number: SR123456789',
      'Card used: last 4 digits 4242',
      'Email used for the booking: a.perera@example.com',
    ].join('\n'),
  );
});
