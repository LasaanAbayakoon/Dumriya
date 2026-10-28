/**
 * "Near me". The position is requested only when the user taps the button, kept in
 * component state for sorting, and never stored or sent anywhere.
 */

export interface Coords {
  lat: number;
  lng: number;
}

export type GeoFailure = 'denied' | 'unavailable' | 'unsupported';

/** Ask the browser for the current position once. */
export function getCurrentPosition(timeoutMs = 15_000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject('unsupported' satisfies GeoFailure);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => reject((e.code === 1 ? 'denied' : 'unavailable') satisfies GeoFailure),
      // Low accuracy is enough to sort stations and is faster and kinder to the battery.
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 5 * 60_000 },
    );
  });
}

/** Great-circle distance in km (haversine). */
export function distanceKm(a: Coords, b: Coords): number {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
