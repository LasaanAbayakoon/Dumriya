import { MOCK_DELAY_MS } from '@/config/app';

/** Simulate network latency, then return a deep copy so callers can't mutate mock state. */
export async function respond<T>(value: T): Promise<T> {
  const [min, max] = MOCK_DELAY_MS;
  if (max > 0) await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
  return structuredClone(value);
}
