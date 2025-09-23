import { defineConfig, devices } from "@playwright/test";
import path from "path";
import os from "os";

export default defineConfig({
  testDir: './test/specs',
  outputDir: './test/results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'test/report', open: 'never' }]],
  use: {
    trace: 'on',
  },
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
    // Test against branded browsers
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          // I have Google Chrome installed via Scoop on Windows
          // TODO: Make this work in CI environments
          executablePath: path.join(os.homedir(), 'scoop', 'apps', 'googlechrome', 'current', 'chrome.exe')
        }
      }
    },
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],
});