import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: './test/specs',
  outputDir: './test/results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['html', { outputFolder: 'test/report', open: 'never' }]],
  use: {
    trace: 'on',
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
});