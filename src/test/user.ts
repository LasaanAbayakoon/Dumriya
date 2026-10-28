import userEvent from '@testing-library/user-event';

/**
 * userEvent with no pause between keystrokes (`delay: null`), so tests never wait on
 * real time while typing. Measured faster than driving userEvent with fake timers
 * (dispute tests: 3.2 s vs 4.4 s), and it leaves the clock alone, so tests that freeze
 * "now" with vi.setSystemTime keep an exact time while typing.
 */
export function setupUser(options: Parameters<typeof userEvent.setup>[0] = {}): ReturnType<typeof userEvent.setup> {
  return userEvent.setup({ delay: null, ...options });
}

/**
 * In-memory clipboard. Install AFTER setupUser()/userEvent.setup(), which replace
 * navigator.clipboard with their own stub.
 */
export function fakeClipboard() {
  let text = '';
  const clipboard = {
    writeText: vi.fn(async (t: string) => {
      text = t;
    }),
    readText: vi.fn(async () => text),
  };
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  return { read: () => text, writeText: clipboard.writeText };
}
