// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { collectLicenses } from './licenses';

const root = fileURLToPath(new URL('..', import.meta.url));
const list = collectLicenses(root);
const names = list.map((l) => l.name);

test('lists the app’s runtime dependencies and what they pull in', () => {
  for (const n of ['react', 'react-dom', 'react-router', 'i18next', 'react-i18next', 'idb-keyval', 'leaflet', 'workbox-window', 'scheduler']) {
    expect(names, n).toContain(n);
  }
});

test('does not list developer-only tools', () => {
  for (const n of ['vite', 'vitest', 'eslint', 'typescript', '@playwright/test', 'happy-dom']) expect(names, n).not.toContain(n);
});

test('every entry has a version and a known licence', () => {
  expect(list.filter((l) => !l.version || l.license === 'UNKNOWN')).toEqual([]);
  expect(list.find((l) => l.name === 'react')?.license).toBe('MIT');
  expect(list.find((l) => l.name === 'leaflet')?.license).toBe('BSD-2-Clause');
});

test('sorted and without duplicates', () => {
  expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  expect(new Set(list.map((l) => `${l.name}@${l.version}`)).size).toBe(list.length);
});
