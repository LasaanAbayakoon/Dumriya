import { setLanguage } from '@/i18n';
import { formatDate, formatMoney, formatShortDate, formatTime, formatWeekday, moneyInput, prefillMoney } from './format';

beforeAll(async () => {
  // Make sure the Sinhala and Tamil bundles are loaded, then return to English.
  await setLanguage('si');
  await setLanguage('ta');
  await setLanguage('en');
});

test.each([
  { lng: 'en', date: 'Tue, 10 Nov 2026', short: '10 Nov' },
  { lng: 'si', date: '2026 නොවැ 10, අඟහ', short: 'නොවැ 10' },
  { lng: 'ta', date: 'செவ்., 10 நவ. 2026', short: '10 நவ.' },
])('$lng dates use translated names, not browser locale data: $date', ({ lng, date, short }) => {
  expect(formatDate('2026-11-10', lng)).toBe(date);
  expect(formatShortDate('2026-11-10', lng)).toBe(short);
});

test('instants are formatted by their Colombo date, whatever the machine time zone', () => {
  // 20:00 UTC on 9 Nov is 01:30 on 10 Nov in Colombo.
  expect(formatDate(new Date('2026-11-09T20:00:00Z'), 'en')).toBe('Tue, 10 Nov 2026');
  expect(formatTime(new Date('2026-11-09T20:00:00Z'))).toBe('01:30');
});

test('times are HH:mm in every language', () => {
  for (const lng of ['en', 'si', 'ta']) expect(formatTime('2026-11-10T06:30:00+05:30', lng)).toBe('06:30');
});

test('weekday names', () => {
  expect(formatWeekday(1, 'en', 'long')).toBe('Monday');
  expect(formatWeekday(0, 'si')).toBe('ඉරිදා');
  expect(formatWeekday(6, 'ta', 'long')).toBe('சனி');
});

test.each([
  { lng: 'en', n: 382.5, expected: '382.50' },
  { lng: 'en', n: 1240, expected: '1,240.00' },
  { lng: 'en', n: 0.05, expected: '0.05' },
  { lng: 'si', n: 382.5, expected: '382.50' },
  { lng: 'ta', n: 1240, expected: '1,240.00' },
])('money in $lng always has two decimals: $n → $expected', ({ lng, n, expected }) => {
  expect(formatMoney(n, lng)).toBe(expected);
});

test('prefilled amounts in input boxes have two decimals', () => {
  expect(moneyInput(25.5)).toBe('25.50');
  expect(prefillMoney('510')).toBe('510.00');
  expect(prefillMoney('25.5')).toBe('25.50');
  expect(prefillMoney('')).toBe('');
  expect(prefillMoney(null)).toBe('');
  expect(prefillMoney('abc')).toBe('abc');
});
