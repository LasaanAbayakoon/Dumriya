import { useCallback, useEffect, useState, type DependencyList } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined; reload: () => void; /** Last successful result, while reloading. */ stale?: T }
  | { status: 'error'; data?: undefined; error: unknown; reload: () => void }
  | { status: 'ready'; data: T; error?: undefined; reload: () => void };

/**
 * Run an async loader whenever `deps` change. Results from stale runs are ignored.
 * State is keyed by the deps, so "loading" is derived rather than set in the effect.
 */
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([...deps, attempt]);
  const [result, setResult] = useState<{ key: string; data?: T; error?: unknown; failed?: boolean } | null>(null);

  useEffect(() => {
    let live = true;
    load().then(
      (data) => live && setResult({ key, data }),
      (error: unknown) => live && setResult({ key, error, failed: true }),
    );
    return () => {
      live = false;
    };
    // `load` is a fresh closure each render; `key` captures everything it depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  if (!result || result.key !== key) return { status: 'loading', reload, stale: result?.failed ? undefined : result?.data };
  if (result.failed) return { status: 'error', error: result.error, reload };
  return { status: 'ready', data: result.data as T, reload };
}
