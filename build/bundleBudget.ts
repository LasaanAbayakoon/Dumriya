import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

type ChunkLike = { type: 'chunk'; fileName: string; code: string; isEntry: boolean; imports: string[] };
type BundleLike = Record<string, ChunkLike | { type: 'asset' }>;

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

/** Entry chunks plus everything they import statically: the JS a phone must download before first render. */
export function initialChunks(bundle: BundleLike): ChunkLike[] {
  const chunks = new Map<string, ChunkLike>();
  for (const item of Object.values(bundle)) if (item.type === 'chunk') chunks.set(item.fileName, item);

  const seen = new Set<string>();
  const visit = (name: string) => {
    if (seen.has(name)) return;
    seen.add(name);
    chunks.get(name)?.imports.forEach(visit);
  };
  [...chunks.values()].filter((c) => c.isEntry).forEach((c) => visit(c.fileName));
  return [...seen].map((n) => chunks.get(n)).filter((c): c is ChunkLike => Boolean(c));
}

/**
 * Fails the production build if the initial JS (gzipped) exceeds the budget.
 * Lazy-loaded route chunks, Sinhala/Tamil strings and Leaflet are not counted.
 */
export function bundleBudget({ maxInitialGzipKb }: { maxInitialGzipKb: number }): Plugin {
  let report = '';
  return {
    name: 'dumriya-bundle-budget',
    apply: 'build',
    generateBundle(_options, bundle) {
      const initial = initialChunks(bundle as unknown as BundleLike);
      const rows = initial
        .map((c) => ({ file: c.fileName, gzip: gzipSync(c.code, { level: 9 }).length }))
        .sort((a, b) => b.gzip - a.gzip);
      const total = rows.reduce((sum, r) => sum + r.gzip, 0);
      const limit = maxInitialGzipKb * 1024;

      report = [
        '',
        `Initial JS budget: ${kb(total)} gzipped of ${kb(limit)} allowed (${Math.round((total / limit) * 100)}%)`,
        ...rows.map((r) => `  ${kb(r.gzip).padStart(9)}  ${r.file}`),
        '',
      ].join('\n');

      if (total > limit) {
        this.error(`Bundle budget exceeded.${report}\nMove code behind a lazy import or remove a dependency.`);
      }
    },
    closeBundle() {
      if (report) console.log(report);
    },
  };
}
