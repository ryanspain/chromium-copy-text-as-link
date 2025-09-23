import { expect, test } from '../fixtures/context';

const TEST_DATA = [
  {
    id: 1,
    text: 'You should use other methods of protecting user accounts where multi-factor authentication is turned off to support scenarios like described here. Such methods include IP address restrictions. i.e. the IP address of the continuous integration server, and your local network for testing.',
    url: 'https://www.ryanspain.net/posts/automated-model-driven-power-app-tests-using-playwright',
    expectedText: 'You should use other methods of protecting user accounts where multi-factor authentication is turned off to support scenarios like described here. Such methods include IP address restrictions. i.e. the IP address of the continuous integration server, and your local network for testing.',
    expectedUrl: 'https://www.ryanspain.net/posts/automated-model-driven-power-app-tests-using-playwright'
  },
  {
    id: 2,
    text: 'Extensions only work in Chrome / Chromium launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
    url: 'https://playwright.dev/docs/chrome-extensions',
    expectedText: 'Extensions only work in Chrome / Chromium launched with a persistent context. Use custom browser args at your own risk, as some of them may break Playwright functionality.',
    expectedUrl: 'https://playwright.dev/docs/chrome-extensions',
  }
]

TEST_DATA.forEach(({ id, url, text, expectedText, expectedUrl }) => {

  test(`test ${id}/${TEST_DATA.length} copy text as page link`, async ({ page }) => {

    test.setTimeout(10000);

    // TODO: add text steps to improve the test report

    // go to the website
    await page.goto(url);

    // select some text
    await page.getByText(text, { exact: false }).first().selectText();

    // copy the selected text by invoking the command implementation
    await page.context().serviceWorkers()[0].evaluate(() => {
      // @ts-ignore
      chrome.tabs.query({ active: true }, (tabs) => {
        // @ts-ignore
        chrome.commands.onCommand.dispatch('copy_text_as_page_link', tabs[0]);
      });
    });

    // go to a rich-text editor
    await page.goto('https://richtexteditor.com/demos/');

    // find the toolbar and content
    const toolbar = page.locator('rte-toolbar');
    const content = page.locator('rte-content iframe').contentFrame();

    // find the toolbar buttons
    const selectAllButton = toolbar.locator('.rte_command_selectall');
    const deleteButton = toolbar.locator('.rte_command_delete');

    // clear the existing content
    await selectAllButton.click();
    await deleteButton.click();

    // paste text from clipboard
    await page.keyboard.press('Control+v');

    // find the pasted link
    const pastedLink = content.getByRole('link', { name: text }).first();

    // assert the pasted link is correct
    await expect(pastedLink, 'Pasted link found in the content area').toBeVisible();
    await expect(pastedLink, 'Pasted link has expected text').toContainText(expectedText);
    await expect(pastedLink, 'Pasted link has expected URL').toHaveAttribute('href', expectedUrl);
  });
});
