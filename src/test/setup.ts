import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import '@/i18n';

// jsdom does not implement these browser APIs.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
window.scrollTo = () => {};

// ── Fail any test that logs console.error (this includes React act() warnings) ──
// A test that expects an error can call `allowConsoleError(/pattern/)` first.
/** Minimal printf-style formatting, like console's own (React passes %s placeholders). */
function format(...args: unknown[]): string {
  const [first, ...rest] = args;
  const str = (v: unknown): string => {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return v.message;
    try {
      return JSON.stringify(v) ?? String(v);
    } catch {
      return String(v); // circular structures
    }
  };
  if (typeof first !== 'string') return args.map(str).join(' ');
  const msg = first.replace(/%[sdifoOjc]/g, () => (rest.length ? str(rest.shift()) : ''));
  return [msg, ...rest.map(str)].join(' ');
}

let errors: string[] = [];
let allowed: RegExp[] = [];

export function allowConsoleError(pattern: RegExp): void {
  allowed.push(pattern);
}

beforeEach(() => {
  errors = [];
  allowed = [];
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const message = format(...args);
    if (!allowed.some((p) => p.test(message))) errors.push(message);
  });
});

// Registered here (in setup) so it runs AFTER each test file's own afterEach hooks,
// catching updates those hooks cause too. Unmount first so nothing updates late.
afterEach(() => {
  cleanup();
  vi.mocked(console.error).mockRestore();
  if (errors.length > 0) {
    const summary = errors.map((e, i) => `  [${i + 1}] ${e.split('\n')[0]}`).join('\n');
    throw new Error(`Test logged ${errors.length} console.error call(s):\n${summary}`);
  }
});
