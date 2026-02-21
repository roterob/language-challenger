import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd server && npx tsx src/index.ts',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
    {
      command: 'cd client && npx vite',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      cwd: '..',
    },
  ],
});
