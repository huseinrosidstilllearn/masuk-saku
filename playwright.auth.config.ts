import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/auth-e2e',
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:5177',
    headless: true,
    launchOptions: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_BROWSER_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    env: {
      VITE_SUPABASE_URL: 'https://session-fixture.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-only-publishable-key',
    },
    command: 'npm run dev -- --mode development --port 5177 --strictPort',
    url: 'http://127.0.0.1:5177',
    reuseExistingServer: false,
  },
  outputDir: 'work/playwright-auth-results',
});
