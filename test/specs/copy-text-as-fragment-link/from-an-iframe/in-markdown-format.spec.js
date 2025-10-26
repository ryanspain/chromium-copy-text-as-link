import { expect, test } from '../../../fixtures/context';

const TEST_DATA = [
  {
    id: 1,
    text: 'A number of geranium species are cultivated for horticultural use and for pharmaceutical products. Some of the more commonly grown species include:',
    url: 'https://en.wikipedia.org/wiki/Geranium',
    expectedText: 'A number of geranium species are cultivated for horticultural use and for pharmaceutical products. Some of the more commonly grown species include:',
    expectedUrl: 'https://en.wikipedia.org/wiki/Geranium#:~:text=a%20number%20of%20geranium%20species%20are%20cultivated%20for%20horticultural%20use%20and%20for%20pharmaceutical%20products.%20some%20of%20the%20more%20commonly%20grown%20species%20include%3A%20'
  },
  {
    id: 2,
    text: 'Extensions only work in Chromium when launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
    url: 'https://playwright.dev/docs/chrome-extensions',
    expectedText: 'Extensions only work in Chromium when launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
    expectedUrl: 'https://playwright.dev/docs/chrome-extensions#:~:text=extensions%20only%20work%20in%20chromium%20when%20launched%20with%20a%20persistent%20context.%20use%20custom%20browser%20args%20at%20your%20own%20risk%2C%20as%20some%20of%20them%20may%20break%20playwright%20functionality.',
  }
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

  test(`copy text as fragment link from an iframe in Markdown format (${id}/${TEST_DATA.length})`, async ({ page }) => {

    // Listen for console errors related to fragment link generation
    let fragmentLinkError = null;
    page.on('console', (msg) => {
      if (msg.text().startsWith('Unable to generate fragment link')) {
        fragmentLinkError = msg.text();
      }
    });

    // Wait for service worker to be available
    await page.waitForTimeout(1000);

    // Get the service worker
    const serviceWorker = page.context().serviceWorkers()[0];
    if (!serviceWorker) {
      throw new Error('Service worker not found');
    }

    // Set the preferred format to markdown in chrome storage
    await serviceWorker.evaluate(() => {
        // @ts-ignore
        chrome.storage.sync.set({ preferred_format: 'markdown' });
    });

    // Wait for storage to be set (increased timeout for reliability)
    await page.waitForTimeout(1000);

    // Navigate to the iframe tester and open the target URL in an iframe
    await page.goto('https://www.iframe-tester.com/');

    // Fill in the URL and load it in the iframe
    const urlInput = page.getByRole('textbox', { name: 'Enter Url to Test' });
    await urlInput.fill(url);
    await page.getByRole('button', { name: 'Check URL' }).click();

    // Wait for the iframe to load
    await page.waitForTimeout(1000);

    // Get the iframe
    const iframe = page.locator('iframe').contentFrame();

    // Find text within the iframe and select it by triple-clicking
    await iframe.getByText(text, { exact: false }).first().selectText();

    // Wait a moment to ensure selection is established
    await page.waitForTimeout(100);

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

    // Verify the markdown format: [text](url)
    const expectedMarkdown = `[${expectedText}](${expectedUrl})`;

    // Get the pasted text content from the editor
    const pastedText = await page.getByRole('textbox').textContent();

    // If fragment link generation failed, provide detailed error message
    if (fragmentLinkError) {
      throw new Error(`Fragment link generation failed: ${fragmentLinkError}`);
    }
    // Assert the pasted text matches the expected markdown format
    expect(pastedText, 'Pasted text contains correct markdown link').toBe(expectedMarkdown);
  });
});
