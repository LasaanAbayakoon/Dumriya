/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { bundleBudget } from './build/bundleBudget.ts';
import { runtimeCaching } from './build/runtimeCaching.ts';
import { licensesPlugin } from './build/licenses.ts';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // Shown on the About page.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    bundleBudget({ maxInitialGzipKb: 150 }),
    licensesPlugin(fileURLToPath(new URL('.', import.meta.url))),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png', 'sw-notifications.js'],
      manifest: {
        name: 'Dumriya – train companion (unofficial)',
        short_name: 'Dumriya',
        description:
          'Unofficial companion for Sri Lanka train passengers: find trains, track booking windows and refund deadlines.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0b5f6b',
        background_color: '#f7f8f8',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        // Tapping an alert opens the app on the Reminders screen.
        importScripts: ['sw-notifications.js'],
        runtimeCaching,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
    css: false,
  },
});
