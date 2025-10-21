import { expect, test } from '../fixtures/context';

test('copy text as page link from within iframe', async ({ page }) => {

    // Test data
    let expectedText = "The Free Encyclopedia";
    let expectedUrl = "https://www.wikipedia.org/";

    // Navigate to the iframe tester and open the target URL in an iframe
    await page.goto('https://www.iframe-tester.com/');
    const urlInput = page.getByRole('textbox', { name: 'Enter Url to Test' });
    await urlInput.fill(expectedUrl);
    await page.getByRole('button', { name: 'Check URL' }).click();

    // Wait for the iframe to load
    await page.waitForTimeout(1000);

    // Get the iframe
    const iframe = page.locator('iframe').contentFrame();

    // Find text within the iframe and select it by triple-clicking
    await iframe.getByText(expectedText, { exact: false }).first().selectText();

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

    // find the pasted link
    const pastedLink = page.getByRole('link', { name: expectedText }).first();

    // assert the pasted link is correct
    await expect(pastedLink, 'Pasted link found in the content area').toBeVisible();
    await expect(pastedLink, 'Pasted link has expected text').toContainText(expectedText);
    await expect(pastedLink, 'Pasted link has expected URL').toHaveAttribute('href', expectedUrl);
});
