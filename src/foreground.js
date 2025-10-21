// Message handler - receives commands from background script
chrome.runtime.onMessage.addListener((message) => {

    console.debug(`Command received (${window.location.host})`, message);

    switch (message.command) {
        case 'copy_text_as_page_link':
            let pageLinkData = preparePageLinkData(message.format);

            if (window === window.top) {
                // Top-level frame: write directly to clipboard
                writeToClipboard(pageLinkData);
            } else {
                // Nested frame: send to background script to forward to top-level frame
                chrome.runtime.sendMessage({ command: 'request_clipboard_write', data: pageLinkData });
            }
            break;
        case 'copy_text_as_fragment_link':
            let fragmentLinkData = prepareFragmentLinkData(message.format);

            if (window === window.top) {
                // Top-level frame: write directly to clipboard
                writeToClipboard(fragmentLinkData);
            } else {
                // Nested frame: send to background script to forward to top-level frame
                chrome.runtime.sendMessage({ command: 'request_clipboard_write', data: fragmentLinkData });
            }
            break;
        case 'write_to_clipboard':
            // Only top-level frames should handle clipboard writes
            if (window !== window.top)
                return;

            writeToClipboard(message.data);
            break;
        default:
            throw new Error(`Unsupported command: ${message.command}`);
    }
});

// Prepare page link data and send to background for clipboard writing
function preparePageLinkData(format) {
    // Try to get selected text from window selection or from active input/textarea
    let text = window.getSelection().toString().trim();

    // Only proceed if we actually have selected text
    if (!text) {
        console.debug(`No text selected in frame (${window.location.host}), ignoring command`);
        return;
    }

    var url = window.location.href;

    console.debug(`Preparing page link data (${window.location.host})`, { text, url, format });

    const linkData = {
        type: 'page_link',
        text: text,
        url: url,
        format: format
    };

    return linkData;
}

/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function prepareFragmentLinkData(format) {

    var selection = window.getSelection();
    var text = selection.toString().trim();

    // Only proceed if we actually have selected text
    if (!text) {
        console.debug(`No text selected in frame (${window.location.host}), ignoring command`);
        return;
    }

    var url = window.location.href;

    console.debug(`Preparing fragment link data (${window.location.host})`, { text, url, format });

    const result = exports.generateFragment(selection);

    if (result.status === 0) {
        const fragment = result.fragment;
        const prefix = fragment.prefix
            ? `${encodeURIComponent(fragment.prefix)}-,`
            : '';
        const suffix = fragment.suffix
            ? `,-${encodeURIComponent(fragment.suffix)}`
            : '';
        const textStart = encodeURIComponent(fragment.textStart);
        const textEnd = fragment.textEnd
            ? `,${encodeURIComponent(fragment.textEnd)}`
            : '';
        url = `${url}#:~:text=${prefix}${textStart}${textEnd}${suffix}`;
    }
    else {
        console.error(`Unable to generate fragment link. ${result.status}`);

        const statusCodeMessages = {
            1: 'The selected text is too short or does not contain enough valid words. Please choose a longer or more specific phrase.',
            2: 'The selected text appears multiple times on this page and no unique link could be created. Try selecting a different text segment.',
            3: 'The process took too long. This may be due to a large page size or slow browser performance. Try selecting a different text segment.',
            4: 'An unexpected error occurred while generating the link.',
        };

        window.queueMicrotask(() => {
            alert(
                `Failed to copy the selected text as a unique link.
                \n\n
                (${statusCodeMessages[result.status]})`
            );
        });

        return; // Don't send message if fragment generation failed
    }

    const linkData = {
        type: 'fragment_link',
        text: text,
        url: url,
        format: format
    };

    return linkData;
}

// Write prepared link data to clipboard (only called in top-level frame)
function writeToClipboard(linkData) {
    console.debug(`Writing to clipboard (${window.location.host})`, linkData);

    try {
        switch (linkData.format) {
            case 'html':
                copyHtmlLinkToClipboard(linkData.text, linkData.url);
                break;
            case 'markdown':
                copyMarkdownLinkToClipboard(linkData.text, linkData.url);
                break;
            default:
                throw new Error(`Unsupported format: ${linkData.format}`);
        }
    } catch (error) {
        console.error(`Failed to write to clipboard (${window.location.host})`, error);
    }
}

function copyHtmlLinkToClipboard(text, url) {
    var link = `<a href="${url}" target="_blank">${text}</a>`;

    // Create both HTML and plain text versions for better clipboard preview support
    var htmlBlob = new Blob([link], { type: "text/html" });
    var plainText = `${text} (${url})`;
    var textBlob = new Blob([plainText], { type: "text/plain" });

    // Create clipboard item for both HTML and plain text links
    var data = [new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob
    })];

    // Write HTML link to clipboard
    console.debug(`Copying HTML link to clipboard (${window.location.host})`, { text, url });
    navigator.clipboard.write(data);
    console.debug(`HTML link copied to clipboard (${window.location.host})`, { text, url });
}

function copyMarkdownLinkToClipboard(text, url) {

    // Normalize the text to remove newline breaks and excessive whitespace
    text = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();

    var link = `[${text}](${url})`;

    var type = "text/plain";
    var blob = new Blob([link], { type });
    var data = [new ClipboardItem({ [type]: blob })];

    // Write Markdown link to clipboard
    console.debug(`Copying Markdown link to clipboard (${window.location.host})`, { text, url });
    navigator.clipboard.write(data);
    console.debug(`Markdown link copied to clipboard (${window.location.host})`, { text, url });
}