/**
 * Offline storage in IndexedDB (via idb-keyval). Each collection is its own small
 * database. Data never leaves the device.
 */
import { clear, createStore, del, get, set, values, type UseStore } from 'idb-keyval';
import type { Reminder, SavedTicket } from '@/types';
import { clearAllPrefs } from './prefs';

/** Why storage failed, so the UI can explain it in plain words. */
export type StorageFailure = 'unavailable' | 'full' | 'unknown';

export class StorageError extends Error {
  readonly reason: StorageFailure;
  constructor(reason: StorageFailure, cause?: unknown) {
    super(
      reason === 'full'
        ? 'Not enough storage space on this device.'
        : reason === 'unavailable'
          ? 'Offline storage is not available in this browser (private mode or blocked site data).'
          : 'Offline storage failed.',
    );
    this.name = 'StorageError';
    this.reason = reason;
    this.cause = cause;
  }
}

export function classifyStorageError(e: unknown): StorageError {
  if (e instanceof StorageError) return e;
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') return new StorageError('full', e);
  if (['SecurityError', 'InvalidStateError', 'NotAllowedError', 'UnknownError'].includes(name)) return new StorageError('unavailable', e);
  return new StorageError('unknown', e);
}

export interface Collection<T extends { id: string }> {
  put(item: T): Promise<void>;
  get(id: string): Promise<T | undefined>;
  list(): Promise<T[]>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

function collection<T extends { id: string }>(name: string): Collection<T> {
  let store: UseStore | null = null;
  const open = (): UseStore => {
    if (store) return store;
    if (typeof indexedDB === 'undefined') throw new StorageError('unavailable');
    store = createStore(`dumriya-${name}`, name);
    return store;
  };
  const run = async <R>(fn: (s: UseStore) => Promise<R>): Promise<R> => {
    try {
      return await fn(open());
    } catch (e) {
      throw classifyStorageError(e);
    }
  };
  return {
    put: (item) => run((s) => set(item.id, item, s)),
    get: (id) => run((s) => get<T>(id, s)),
    list: () => run((s) => values<T>(s)),
    remove: (id) => run((s) => del(id, s)),
    clear: () => run((s) => clear(s)),
  };
}

export const reminders = collection<Reminder>('reminders');
export const tickets = collection<SavedTicket>('tickets');

/** Browser-wide storage estimate, if the browser offers one. */
export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    const e = await navigator.storage?.estimate?.();
    return e && typeof e.usage === 'number' && typeof e.quota === 'number' ? { usage: e.usage, quota: e.quota } : null;
  } catch {
    return null;
  }
}

/** Ask the browser not to evict our data under storage pressure. Returns whether it agreed. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function isPersisted(): Promise<boolean | null> {
  try {
    return (await navigator.storage?.persisted?.()) ?? null;
  } catch {
    return null;
  }
}

/** "Delete all my data": tickets, reminders and every local preference. */
export async function clearAllData(): Promise<{ ok: boolean }> {
  clearAllPrefs();
  const results = await Promise.allSettled([tickets.clear(), reminders.clear()]);
  return { ok: results.every((r) => r.status === 'fulfilled') };
}
