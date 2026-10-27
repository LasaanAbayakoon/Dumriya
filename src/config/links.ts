/**
 * The ONLY external booking destinations the app may send users to.
 * Never build booking links anywhere else.
 */

/** Official reserved-seat booking site. */
export const OFFICIAL_RESERVATION_URL = 'https://seatreservation.railway.gov.lk';

/**
 * Official Pravesha site for commuter (unreserved) tickets.
 * Source: Ada Derana (Aug 2024), Newswire (Sep 2026); checked in a browser by the project owner.
 * If this is ever set back to null, the app shows a non-clickable "Pravesha: link coming soon"
 * instead of a button and tells users to buy at the station counter.
 */
export const PRAVESHA_URL: string | null = 'https://www.pravesha.lk';

/** Hosts we treat as official, used to double-check every outbound booking link. */
const OFFICIAL_HOSTS = [new URL(OFFICIAL_RESERVATION_URL).host, ...(PRAVESHA_URL ? [new URL(PRAVESHA_URL).host] : [])];

export function isOfficialUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && OFFICIAL_HOSTS.includes(u.host);
  } catch {
    return false;
  }
}

/** Google Maps directions to a coordinate (opens the Maps app on phones). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
