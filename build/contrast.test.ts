// @vitest-environment node
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { contrast, contrastReport, loadTokens, readTokens } from './contrast';

const tokens = loadTokens(fileURLToPath(new URL('../src/styles/index.css', import.meta.url)));

test('reads both themes from index.css', () => {
  expect(tokens.light.ok).toMatch(/^#[0-9a-f]{6}$/);
  expect(tokens.dark.ok).toMatch(/^#[0-9a-f]{6}$/);
  expect(tokens.dark.ok).not.toBe(tokens.light.ok);
});

test('contrast() matches the WCAG reference values', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  expect(readTokens(':root {\n  --a: #FFFFFF;\n}\n.dark {\n  --a: #000000;\n}').dark.a).toBe('#000000');
});

test.each(contrastReport(tokens))('$label meets WCAG AA (4.5:1) in both themes', ({ light, dark }) => {
  expect(light).toBeGreaterThanOrEqual(4.5);
  expect(dark).toBeGreaterThanOrEqual(4.5);
});
