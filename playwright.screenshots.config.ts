import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.ts';

/** `npm run screenshots`: regenerates the README screenshots in docs/screenshots (360px phone). */
export default defineConfig({
  ...base,
  testMatch: 'screenshots.ts',
  projects: [
    {
      name: 'screenshots',
      use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 },
    },
  ],
});
