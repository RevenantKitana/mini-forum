import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker on CI to avoid flakiness */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: process.env.CI
    ? {
        // In CI: serve pre-built frontend via vite preview
        command: 'npm run preview -- --port 5173',
        cwd: path.join(__dirname, 'frontend'),
        url: 'http://localhost:5173',
        reuseExistingServer: false,
        env: {
          VITE_API_URL: process.env.VITE_API_URL ?? 'http://localhost:5000',
        },
      }
    : {
        // Locally: use vite dev server
        command: 'npm run dev',
        cwd: path.join(__dirname, 'frontend'),
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        env: {
          VITE_API_URL: process.env.VITE_API_URL ?? 'http://localhost:5000',
        },
      },
});
