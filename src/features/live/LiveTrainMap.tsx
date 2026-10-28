/**
 * Live (simulated) train map. One of the only two modules allowed to import Leaflet
 * (build/source-guards.test.ts); lazy-loaded by LiveScreen. The route and stops are drawn
 * once; only the train marker moves on each refresh.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_MAX_ZOOM, MAP_TILE_ATTRIBUTION, MAP_TILE_URL } from '@/config/app';

export interface MapStop {
  lat: number;
  lng: number;
  label: string;
  passed: boolean;
}

type Props = {
  stops: MapStop[];
  train: { lat: number; lng: number; label: string } | null;
  ariaLabel: string;
};

export default function LiveTrainMap({ stops, train, ariaLabel }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const trainRef = useRef<L.CircleMarker | null>(null);
  const stopsLayer = useRef<L.LayerGroup | null>(null);

  // Map, tiles and route line: once.
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, { attributionControl: true });
    L.tileLayer(MAP_TILE_URL, { attribution: MAP_TILE_ATTRIBUTION, maxZoom: MAP_MAX_ZOOM, crossOrigin: true }).addTo(map);
    mapRef.current = map;
    stopsLayer.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
      trainRef.current = null;
    };
  }, []);

  // Route and stop markers (passed stops filled).
  useEffect(() => {
    const map = mapRef.current;
    const layer = stopsLayer.current;
    if (!map || !layer || stops.length === 0) return;
    layer.clearLayers();
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0b5f6b';
    const points = stops.map((s) => [s.lat, s.lng] as L.LatLngTuple);
    L.polyline(points, { color: accent, weight: 4, opacity: 0.7 }).addTo(layer);
    for (const s of stops) {
      L.circleMarker([s.lat, s.lng], { radius: 6, color: accent, weight: 2, fillColor: s.passed ? accent : '#ffffff', fillOpacity: 1 })
        .bindTooltip(s.label)
        .addTo(layer);
    }
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
  }, [stops]);

  // The (simulated) train: moved, not recreated.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!train) {
      trainRef.current?.remove();
      trainRef.current = null;
      return;
    }
    if (!trainRef.current) {
      trainRef.current = L.circleMarker([train.lat, train.lng], { radius: 11, color: '#ffffff', weight: 3, fillColor: '#1d4ed8', fillOpacity: 1 })
        .bindTooltip(train.label, { permanent: false })
        .addTo(map);
    } else {
      trainRef.current.setLatLng([train.lat, train.lng]);
    }
  }, [train]);

  return <div ref={el} role="region" aria-label={ariaLabel} className="h-[50dvh] min-h-64 w-full rounded-2xl border border-border" data-testid="live-map" />;
}
