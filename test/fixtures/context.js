import { chromium, test as baseTest, expect } from "@playwright/test";
import path from 'path';

const test = baseTest.extend({
  context: async ({}, use) => {

    // Launch Chromium with the extension loaded
    const context = await chromium.launchPersistentContext('', {
      args: [
        `--disable-extensions-except=${path.join(__dirname, '../../src')}`,
        `--load-extension=${path.join(__dirname, '../../src')}`
      ],
    });

    // Grant clipboard permissions
    context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await use(context);
    await context.close();
  }
});

export {
  test,
  expect
};