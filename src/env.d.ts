/** Injected by vite.config.ts (define). */
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

declare module 'virtual:dumriya-licenses' {
  const licenses: { name: string; version: string; license: string; homepage?: string }[];
  export default licenses;
}
