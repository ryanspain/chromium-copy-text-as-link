import { expect, test } from '../../../fixtures/context';

const TEST_DATA = [
  {
    id: 2,
    text: 'Chrome extensions',
    url: 'https://playwright.dev/docs/chrome-extensions',
    expectedText: 'Chrome extensions',
    expectedUrl: 'https://playwright.dev/docs/chrome-extensions',
  },
  {
    id: 1,
    text: 'The Free Encyclopedia',
    url: 'https://www.wikipedia.org/',
    expectedText: 'The Free Encyclopedia',
    expectedUrl: 'https://www.wikipedia.org/'
  },
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

  test(`copy text as page link from top frame in Markdown format (${id}/${TEST_DATA.length})`, async ({ page }) => {

    // Wait for service worker to be available
    await page.waitForTimeout(1000);

    // Get the service worker and set the preferred format to markdown
    const serviceWorker = page.context().serviceWorkers()[0];
    if (!serviceWorker) {
      throw new Error('Service worker not found');
    }

    await serviceWorker.evaluate(() => {
      // @ts-ignore
      chrome.storage.sync.set({ preferred_format: 'markdown' });
    });

    // Wait for storage to be set (increased timeout for reliability)
    await page.waitForTimeout(1000);

    // Navigate to the test page
    await page.goto(url);

    // Find text and select it
    await page.getByText(text, { exact: false }).first().selectText();

    // Copy the selected text by invoking the command implementation
    await serviceWorker.evaluate(() => {
      // @ts-ignore
      chrome.tabs.query({ active: true }, (tabs) => {
        // @ts-ignore
        chrome.commands.onCommand.dispatch('copy_text_as_page_link', tabs[0]);
      });
    });

    // Navigate to a rich-text editor to verify pasting
    await page.goto('https://trix-editor.org/');
    await page.getByRole('textbox').clear();
    await page.keyboard.press('Control+v');

    // Verify the markdown format: [text](url)
    const expectedMarkdown = `[${expectedText}](${expectedUrl})`;

    await page.waitForTimeout(500);

    // Get the pasted text content from the editor
    const pastedText = await page.getByRole('textbox').textContent();

    // Assert the pasted text matches the expected markdown format
    expect(pastedText, 'Pasted text contains correct markdown link').toBe(expectedMarkdown);
  });
});
