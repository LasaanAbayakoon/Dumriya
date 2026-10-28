/**
 * Generates the open-source licence list shown on the About page, from the real
 * dependency tree in node_modules (so it can never drift from what is installed).
 *
 * Included: every package in package.json "dependencies" and everything they depend on,
 * plus build-time packages whose code is copied into the app bundle (BUNDLED_DEV_DEPS).
 * Not included: tools that only run on the developer's machine (Vite, Vitest, ESLint, …).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

/** Dev dependencies whose code ends up in the shipped bundle. */
export const BUNDLED_DEV_DEPS = ['workbox-window'];

export interface LicenseEntry {
  name: string;
  version: string;
  license: string;
  homepage?: string;
}

interface Pkg {
  name: string;
  version: string;
  license?: string | { type?: string };
  licenses?: { type?: string }[];
  homepage?: string;
  repository?: string | { url?: string };
  dependencies?: Record<string, string>;
}

const readPkg = (dir: string): Pkg | null => {
  const file = join(dir, 'package.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Pkg) : null;
};

const licenseOf = (p: Pkg): string => {
  if (typeof p.license === 'string') return p.license;
  if (p.license?.type) return p.license.type;
  if (p.licenses?.length) return p.licenses.map((l) => l.type).filter(Boolean).join(' OR ');
  return 'UNKNOWN';
};

const homepageOf = (p: Pkg): string | undefined => {
  const repo = typeof p.repository === 'string' ? p.repository : p.repository?.url;
  const url = p.homepage ?? repo?.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
  return url && /^https:\/\//.test(url) ? url : undefined;
};

/** Find a package's folder the way Node does: nested node_modules first, then upwards. */
function resolveDir(name: string, from: string, root: string): string | null {
  let dir = from;
  for (;;) {
    const candidate = join(dir, 'node_modules', name);
    if (existsSync(join(candidate, 'package.json'))) return candidate;
    if (dir === root || dirname(dir) === dir) return null;
    dir = dirname(dir);
  }
}

export function collectLicenses(root: string): LicenseEntry[] {
  const app = readPkg(root)!;
  const seen = new Map<string, LicenseEntry>();
  const visit = (name: string, from: string) => {
    const dir = resolveDir(name, from, root);
    if (!dir) return; // optional dependency not installed on this platform
    const p = readPkg(dir);
    if (!p) return;
    const key = `${p.name}@${p.version}`;
    if (seen.has(key)) return;
    const homepage = homepageOf(p);
    seen.set(key, { name: p.name, version: p.version, license: licenseOf(p), ...(homepage ? { homepage } : {}) });
    for (const dep of Object.keys(p.dependencies ?? {})) visit(dep, dir);
  };
  for (const dep of [...Object.keys(app.dependencies ?? {}), ...BUNDLED_DEV_DEPS]) visit(dep, root);
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

const VIRTUAL = 'virtual:dumriya-licenses';

/** `import licenses from 'virtual:dumriya-licenses'` → LicenseEntry[] */
export function licensesPlugin(root: string): Plugin {
  return {
    name: 'dumriya-licenses',
    resolveId: (id) => (id === VIRTUAL ? `\0${VIRTUAL}` : null),
    load: (id) => (id === `\0${VIRTUAL}` ? `export default ${JSON.stringify(collectLicenses(root))};` : null),
  };
}
