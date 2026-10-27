/**
 * Offline storage in IndexedDB (via idb-keyval). Each collection is its own small
 * database. Data never leaves the device.
 */
import { clear, createStore, del, get, set, values, type UseStore } from 'idb-keyval';
import type { Reminder } from '@/types';

export class StorageUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Offline storage is not available in this browser (private mode or blocked site data).');
    this.name = 'StorageUnavailableError';
    this.cause = cause;
  }
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
    if (typeof indexedDB === 'undefined') throw new StorageUnavailableError();
    store = createStore(`dumriya-${name}`, name);
    return store;
  };
  const run = async <R>(fn: (s: UseStore) => Promise<R>): Promise<R> => {
    try {
      return await fn(open());
    } catch (e) {
      throw e instanceof StorageUnavailableError ? e : new StorageUnavailableError(e);
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
