/**
 * Small per-device preferences kept in localStorage (theme, language, recent
 * searches). Every access is guarded: storage can be blocked or throw in
 * private mode, and the app must still work without it.
 */
const PREFIX = 'dumriya.';

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, value);
  } catch {
    /* ignore: preference simply won't persist */
  }
}

export function readJsonPref<T>(key: string, fallback: T): T {
  const raw = readPref(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJsonPref(key: string, value: unknown): void {
  writePref(key, JSON.stringify(value));
}

export function clearAllPrefs(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
