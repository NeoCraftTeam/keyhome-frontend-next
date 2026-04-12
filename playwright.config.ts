import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for KeyHome.
 *
 * Run against a local dev server (pnpm dev) or the deployed staging environment.
 * Set BASE_URL env var to override the default target.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // Uses Chromium under the hood — no separate browser install needed
      name: 'mobile-android',
      use: { ...devices['Pixel 5'] },
    },
    {
      // Emulates iPhone 13 layout (390×844, touch, 3× DPR, iOS user-agent)
      // but runs on Chromium so no separate WebKit install is required.
      name: 'mobile-ios',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],

  /* Start the Next.js dev server automatically when running locally */
  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
