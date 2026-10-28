/**
 * The ONLY module that imports Leaflet (enforced by build/source-guards.test.ts), so the
 * map library and its CSS load only when a map is shown. Tiles and attribution come from
 * config/app.ts; the attribution control is always on.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM, MAP_MAX_ZOOM, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '@/config/app';
import type { Coords } from '@/lib/geo';
import type { Station } from '@/types';

type Props = {
  stations: Station[];
  label: (s: Station) => string;
  openLabel: (s: Station) => string;
  ariaLabel: string;
  youAreHere?: { coords: Coords; label: string } | null;
  focusId?: string | null;
};

export default function StationMap({ stations, label, openLabel, ariaLabel, youAreHere, focusId }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { center: MAP_DEFAULT_CENTER, zoom: MAP_DEFAULT_ZOOM, attributionControl: true });
    // CORS requests, so the service worker can cache real (not opaque) responses.
    L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: MAP_MAX_ZOOM, crossOrigin: true }).addTo(map);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0b5f6b';

    const points: L.LatLngExpression[] = [];
    for (const s of stations) {
      const marker = L.circleMarker([s.lat, s.lng], { radius: 8, color: accent, weight: 2, fillOpacity: 0.85 }).addTo(map);
      // Popup with a real button that navigates inside the app.
      const box = document.createElement('div');
      const name = document.createElement('p');
      name.textContent = label(s);
      name.style.fontWeight = '700';
      name.style.margin = '0 0 4px';
      const open = document.createElement('button');
      open.type = 'button';
      open.textContent = openLabel(s);
      open.style.minHeight = '44px';
      open.style.textDecoration = 'underline';
      open.addEventListener('click', () => void navigate(`/stations/${encodeURIComponent(s.id)}`));
      box.append(name, open);
      marker.bindPopup(box).bindTooltip(label(s));
      if (s.id === focusId) marker.openPopup();
      points.push([s.lat, s.lng]);
    }
    if (youAreHere) {
      L.circleMarker([youAreHere.coords.lat, youAreHere.coords.lng], { radius: 7, color: '#1d4ed8', fillOpacity: 1 })
        .addTo(map)
        .bindTooltip(youAreHere.label);
      points.push([youAreHere.coords.lat, youAreHere.coords.lng]);
    }

    const focused = stations.find((s) => s.id === focusId);
    if (focused) map.setView([focused.lat, focused.lng], 12);
    else if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    else if (points.length === 1) map.setView(points[0]!, 12);

    return () => {
      map.remove();
    };
  }, [stations, label, openLabel, youAreHere, focusId, navigate]);

  return <div ref={el} role="region" aria-label={ariaLabel} className="h-[60dvh] min-h-72 w-full rounded-2xl border border-border" data-testid="station-map" />;
}
