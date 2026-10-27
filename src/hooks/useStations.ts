import { listStations } from '@/api';
import type { Station } from '@/types';
import { useAsync } from './useAsync';

// The station list is small and rarely changes: load it once per session.
let cache: Promise<Map<string, Station>> | null = null;

function loadStations(): Promise<Map<string, Station>> {
  cache ??= listStations()
    .then((list) => new Map(list.map((s) => [s.id, s])))
    .catch((e: unknown) => {
      cache = null;
      throw e;
    });
  return cache;
}

/** All stations by id, or null while loading. */
export function useStations(): Map<string, Station> | null {
  const state = useAsync(loadStations, []);
  return state.status === 'ready' ? state.data : null;
}
