import { expect, test } from '../../../fixtures/context';

const TEST_DATA = [
  {
    id: 1,
    text: 'The Free Encyclopedia',
    url: 'https://www.wikipedia.org/',
    expectedText: 'The Free Encyclopedia',
    expectedUrl: 'https://www.wikipedia.org/'
  },
  {
    id: 2,
    text: 'Chrome extensions',
    url: 'https://playwright.dev/docs/chrome-extensions',
    expectedText: 'Chrome extensions',
    expectedUrl: 'https://playwright.dev/docs/chrome-extensions',
  }
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

  test(`copy text as page link from top frame in HTML format (${id}/${TEST_DATA.length})`, async ({ page }) => {

    // Navigate to the iframe tester
    await page.goto(url);

    // Find text and select it
    await page.getByText(text, { exact: false }).first().selectText();

    // Copy the selected text by invoking the command implementation
    await page.context().serviceWorkers()[0].evaluate(() => {
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

    // find the pasted link
    const pastedLink = page.getByRole('link', { name: expectedText }).first();

    // assert the pasted link is correct
    await expect(pastedLink, 'Pasted link found in the content area').toBeVisible();
    await expect(pastedLink, 'Pasted link has expected text').toContainText(expectedText);
    await expect(pastedLink, 'Pasted link has expected URL').toHaveAttribute('href', expectedUrl);
  });
});
