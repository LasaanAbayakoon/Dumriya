import { MAX_RECENT_SEARCHES } from '@/config/app';
import { readJsonPref, writeJsonPref, writePref } from './prefs';

export interface RecentSearch {
  fromStationId: string;
  toStationId: string;
}

const KEY = 'recentSearches';

export function getRecentSearches(): RecentSearch[] {
  const list = readJsonPref<unknown>(KEY, []);
  return Array.isArray(list)
    ? list.filter((r): r is RecentSearch => typeof r?.fromStationId === 'string' && typeof r?.toStationId === 'string')
    : [];
}

/** Most recent first, no duplicates, at most MAX_RECENT_SEARCHES. */
export function addRecentSearch(s: RecentSearch): RecentSearch[] {
  const next = [s, ...getRecentSearches().filter((r) => r.fromStationId !== s.fromStationId || r.toStationId !== s.toStationId)].slice(
    0,
    MAX_RECENT_SEARCHES,
  );
  writeJsonPref(KEY, next);
  return next;
}

export function clearRecentSearches(): void {
  writePref(KEY, null);
}
