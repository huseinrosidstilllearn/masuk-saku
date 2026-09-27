import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:5175',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: 'npm run dev:demo -- --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  },
  outputDir: 'work/playwright-results',
});
