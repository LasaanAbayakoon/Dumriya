import { MOCK_DELAY_MS } from '@/config/app';

declare global {
  /**
   * Mock calls still waiting on their fake delay. Playwright waits for this to reach 0, because
   * the delay is a timer that "network idle" cannot see. Gone with the real API, where real
   * requests are.
   */
  var __dumriyaMockPending: number | undefined;
}

/** Simulate network latency, then return a deep copy so callers can't mutate mock state. */
export async function respond<T>(value: T): Promise<T> {
  const [min, max] = MOCK_DELAY_MS;
  if (max > 0) {
    globalThis.__dumriyaMockPending = (globalThis.__dumriyaMockPending ?? 0) + 1;
    try {
      await new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
    } finally {
      globalThis.__dumriyaMockPending -= 1;
    }
  }
  return structuredClone(value);
}
