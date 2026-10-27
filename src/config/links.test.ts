import { directionsUrl, isOfficialUrl, OFFICIAL_RESERVATION_URL, PRAVESHA_URL } from './links';

test('the reservation URL is exactly the official site', () => {
  expect(OFFICIAL_RESERVATION_URL).toBe('https://seatreservation.railway.gov.lk');
  expect(isOfficialUrl(OFFICIAL_RESERVATION_URL)).toBe(true);
});

test.each([
  { url: 'http://seatreservation.railway.gov.lk', why: 'not https' },
  { url: 'https://seatreservation.railway.gov.lk.example.com', why: 'look-alike suffix' },
  { url: 'https://seatreservation-railway.gov.lk', why: 'look-alike hyphen' },
  { url: 'https://railway.gov.lk.evil.test/seatreservation', why: 'path trick' },
  { url: 'not a url', why: 'invalid' },
])('rejects $url ($why)', ({ url }) => {
  expect(isOfficialUrl(url)).toBe(false);
});

test('Pravesha URL is not set yet (the UI shows "Link coming soon")', () => {
  expect(PRAVESHA_URL).toBeNull();
});

test('directions link', () => {
  expect(directionsUrl(6.9339, 79.85)).toBe('https://www.google.com/maps/dir/?api=1&destination=6.9339,79.85');
});
