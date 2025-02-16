import { chromium, test as baseTest, expect } from "@playwright/test";
import path from 'path';

const test = baseTest.extend({
  context: async ({ }, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${path.join(__dirname, '../../src')}`,
        `--load-extension=${path.join(__dirname, '../../src')}`
      ],
    });
    await use(context);
    await context.close();
  }
});

export {
  test,
  expect
};