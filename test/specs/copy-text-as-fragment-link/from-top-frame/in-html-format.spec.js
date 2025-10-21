import { expect, test } from '../../../fixtures/context';

const TEST_DATA = [
  {
    id: 1,
    text: 'The Free Encyclopedia',
    url: 'https://www.wikipedia.org/',
    expectedText: 'The Free Encyclopedia',
    expectedUrl: 'https://www.wikipedia.org/#:~:text=Wikipedia%0A%0AThe%20Free-,encyclopedia,-English%0A7%2C069%2C000%2B%20articles'
  },
  {
    id: 2,
    text: 'Extensions only work in Chromium when launched with a persistent context',
    url: 'https://playwright.dev/docs/chrome-extensions',
    expectedText: 'Extensions only work in Chromium when launched with a persistent context',
    expectedUrl: 'https://playwright.dev/docs/chrome-extensions#:~:text=extensions%20only%20work%20in%20chromium%20when%20launched%20with%20a%20persistent%20context.%20use%20custom%20browser%20args%20at%20your%20own%20risk%2C%20as%20some%20of%20them%20may%20break%20playwright%20functionality.',
  }
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

  test(`copy text as fragment link from top frame in HTML format (${id}/${TEST_DATA.length})`, async ({ page }) => {

    // Wait for service worker to be available
    await page.waitForTimeout(1000);

    // Get the service worker
    const serviceWorker = page.context().serviceWorkers()[0];
    if (!serviceWorker) {
      throw new Error('Service worker not found');
    }

    // Navigate to the iframe tester
    await page.goto(url);

    // Find text and select it
    await page.getByText(text, { exact: false }).first().selectText();

    // Copy the selected text by invoking the command implementation
    await serviceWorker.evaluate(() => {
        // @ts-ignore
        chrome.tabs.query({ active: true }, (tabs) => {
            // @ts-ignore
            chrome.commands.onCommand.dispatch('copy_text_as_fragment_link', tabs[0]);
        });
    });

    // Wait for clipboard write to complete (fragment generation may take time)
    await page.waitForTimeout(1000);

    // Navigate to a rich-text editor to verify pasting
    await page.goto('https://trix-editor.org/');
    await page.getByRole('textbox').clear();
    await page.keyboard.press('Control+v');

    // Wait for paste to complete
    await page.waitForTimeout(500);

    // find the pasted link
    const pastedLink = page.getByRole('link', { name: expectedText }).first();

    // assert the pasted link is correct
    await expect(pastedLink, 'Pasted link found in the content area').toBeVisible();
    await expect(pastedLink, 'Pasted link has expected text').toContainText(expectedText);
    await expect(pastedLink, 'Pasted link has expected URL').toHaveAttribute('href', expectedUrl);
  });
});
