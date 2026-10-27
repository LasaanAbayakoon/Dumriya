import { cleanup, screen } from '@testing-library/react';
import en from './en';
import si from './si';
import ta from './ta';
import { setLanguage, type Language } from '.';
import { renderRoute } from '@/test/renderRoute';

type Tree = { [k: string]: string | Tree };

function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [[prefix + k, v] as [string, string]] : leaves(v, `${prefix}${k}.`),
  );
}

const locales = { en, si, ta } as Record<Language, Tree>;

describe.each(Object.keys(locales) as Language[])('%s strings', (lng) => {
  const entries = leaves(locales[lng]);

  test('no string value contains a TODO marker', () => {
    const offenders = entries.filter(([, v]) => /TODO/i.test(v)).map(([k]) => k);
    expect(offenders).toEqual([]);
  });

  test('has exactly the same keys as English', () => {
    expect(entries.map(([k]) => k).sort()).toEqual(leaves(en as Tree).map(([k]) => k).sort());
  });

  test('no string is empty', () => {
    expect(entries.filter(([, v]) => v.trim() === '').map(([k]) => k)).toEqual([]);
  });
});

// Every static route, rendered in every language: nothing visible may contain "TODO".
const routes = ['/', '/results', '/tickets', '/refund', '/dispute', '/reminders', '/stations', '/more', '/settings', '/settings/about'];

describe.each(['en', 'si', 'ta'] as Language[])('rendered UI in %s', (lng) => {
  beforeAll(() => setLanguage(lng));
  afterAll(() => setLanguage('en'));
  afterEach(cleanup);

  test.each(routes)('%s shows no TODO text', async (url) => {
    renderRoute(url);
    await screen.findByRole('heading', { level: 1 });
    expect(document.body.textContent).not.toMatch(/TODO/i);
  });
});
