/**
 * WCAG 2.x contrast ratios for the colour tokens in src/styles/index.css. Used by
 * contrast.test.ts so a token change can never quietly drop the status colours or the
 * banners below AA.
 */
import { readFileSync } from 'node:fs';

export type Theme = 'light' | 'dark';
export type Tokens = Record<string, string>;

/** Reads the `--name: #hex;` tokens of `:root` (light) and `.dark`. */
export function readTokens(css: string): Record<Theme, Tokens> {
  const block = (selector: string) => {
    const start = css.search(new RegExp(`^${selector.replace('.', '\\.')} \\{`, 'm'));
    if (start < 0) throw new Error(`no ${selector} block in index.css`);
    const body = css.slice(start, css.indexOf('}', start));
    return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
  };
  return { light: block(':root'), dark: block('.dark') };
}

export function loadTokens(cssPath: string): Record<Theme, Tokens> {
  return readTokens(readFileSync(cssPath, 'utf8'));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Foreground/background token pairs that carry meaning; all are normal-size text, so AA is 4.5:1. */
export const PAIRS: { label: string; fg: string; bg: string }[] = [
  { label: 'On time badge', fg: 'ok', bg: 'ok-soft' },
  { label: 'Delayed badge', fg: 'warn', bg: 'warn-soft' },
  { label: 'Cancelled badge', fg: 'danger', bg: 'danger-soft' },
  { label: 'On time text on a card', fg: 'ok', bg: 'surface' },
  { label: 'Delayed text on a card', fg: 'warn', bg: 'surface' },
  { label: 'Cancelled / error text on a card', fg: 'danger', bg: 'surface' },
  { label: 'On time text on the page', fg: 'ok', bg: 'bg' },
  { label: 'Delayed text on the page', fg: 'warn', bg: 'bg' },
  { label: 'Cancelled / error text on the page', fg: 'danger', bg: 'bg' },
  { label: 'Sample-data banner', fg: 'warn', bg: 'warn-soft' },
  { label: 'Preview banner', fg: 'accent', bg: 'accent-soft' },
];

export function contrastReport(tokens: Record<Theme, Tokens>) {
  return PAIRS.map((p) => ({
    ...p,
    light: contrast(tokens.light[p.fg]!, tokens.light[p.bg]!),
    dark: contrast(tokens.dark[p.fg]!, tokens.dark[p.bg]!),
  }));
}
