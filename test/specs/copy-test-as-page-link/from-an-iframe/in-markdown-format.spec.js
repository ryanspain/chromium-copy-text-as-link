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
        text: 'Extensions only work in Chromium when launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
        url: 'https://playwright.dev/docs/chrome-extensions',
        expectedText: 'Extensions only work in Chromium when launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
        expectedUrl: 'https://playwright.dev/docs/chrome-extensions',
    }
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

    test(`copy text as page link from an iframe in Markdown format (${id}/${TEST_DATA.length})`, async ({ page }) => {

        // Set the preferred format to markdown in chrome storage
        await page.context().serviceWorkers()[0].evaluate(() => {
            // @ts-ignore
            chrome.storage.sync.set({ preferred_format: 'markdown' });
        });

        let value =await page.context().serviceWorkers()[0].evaluate(() => {
            // @ts-ignore
            return chrome.storage.sync.get({ preferred_format: 'markdown' });
        });
        console.debug('Preferred format set to:', value);

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
        await page.context().serviceWorkers()[0].evaluate(() => {
            // @ts-ignore
            chrome.tabs.query({ active: true }, (tabs) => {
                // @ts-ignore
                chrome.commands.onCommand.dispatch('copy_text_as_page_link', tabs[0]);
            });
        });

        // Wait for clipboard write to complete
        await page.waitForTimeout(500);

        // Navigate to a rich-text editor to verify pasting
        await page.goto('https://trix-editor.org/');
        await page.getByRole('textbox').clear();
        await page.keyboard.press('Control+v');

        // Verify the markdown format: [text](url)
        const expectedMarkdown = `[${expectedText}](${expectedUrl})`;

        // Get the pasted text content from the editor
        const pastedText = await page.getByRole('textbox').textContent();

        // Assert the pasted text matches the expected markdown format
        expect(pastedText, 'Pasted text contains correct markdown link').toBe(expectedMarkdown);
    });
});
