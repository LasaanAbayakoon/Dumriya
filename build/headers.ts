/**
 * Reads public/_headers (Cloudflare Pages format) so `vite preview` sends the same headers as the
 * deployed demo. Playwright runs against `vite preview`, so every e2e test runs under the real
 * Content-Security-Policy.
 */
import { readFileSync } from 'node:fs';

export type HeaderRules = Record<string, Record<string, string>>;

/** `/path` lines start a rule; indented `Name: value` lines belong to it; `#` lines are comments. */
export function parseHeaders(text: string): HeaderRules {
  const rules: HeaderRules = {};
  let current: Record<string, string> | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = rules[line.trim()] ??= {};
      continue;
    }
    const colon = line.indexOf(':');
    if (!current || colon < 0) throw new Error(`_headers: cannot read "${line.trim()}"`);
    current[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return rules;
}

/** The headers every response gets (the `/*` rule). */
export function siteHeaders(headersFile: string): Record<string, string> {
  return parseHeaders(readFileSync(headersFile, 'utf8'))['/*'] ?? {};
}
