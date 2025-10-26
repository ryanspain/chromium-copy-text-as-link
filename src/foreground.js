// Message handler - receives commands from background script
chrome.runtime.onMessage.addListener((message) => {
    console.debug(`Command received (${window.location.host})`, message);

    try {
        switch (message.command) {
            case 'copy_text_as_page_link':
                handleCopyCommand(() => preparePageLinkData(message.format));
                break;
            case 'copy_text_as_fragment_link':
                handleCopyCommand(() => prepareFragmentLinkData(message.format));
                break;
            case 'write_to_clipboard':
                if (window === window.top) {
                    writeToClipboard(message.data);
                }
                break;
            default:
                throw new Error(`Unsupported command: ${message.command}`);
        }
    } catch (error) {
        console.debug(`Error processing command: ${message.command} on frame ${window.location.host}`, error);
    }
});

// Helper: Handle copy commands with frame-aware routing
function handleCopyCommand(prepareLinkData) {
    const linkData = prepareLinkData();

    if (window === window.top) {
        console.debug(`Copy command in top-level frame (${window.location.host}), writing to clipboard...`);
        writeToClipboard(linkData);
    } else {
        console.debug(`Copy command in nested frame (${window.location.host}), forwarding to background...`);
        chrome.runtime.sendMessage({ command: 'request_clipboard_write', data: linkData });
    }
}

// Prepare page link data
function preparePageLinkData(format) {

    const text = window.getSelection().toString().trim();

    if (!text) {
        throw new Error(`No text selected in frame ${window.location.host}`);
    }

    const url = window.location.href;

    console.debug(`Preparing page link data (${window.location.host})`, { text, url, format });

    return { text, url, format };
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
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (!text) {
        throw new Error(`No text selected in frame (${window.location.host}), ignoring command`);
    }

    let url = window.location.href;
    console.debug(`Preparing fragment link data (${window.location.host})`, { text, url, format });

    const result = exports.generateFragment(selection);

    if (result.status === 0) {
        const prefix = result.fragment.prefix ? `${encodeURIComponent(result.fragment.prefix)}-,` : '';
        const suffix = result.fragment.suffix ? `,-${encodeURIComponent(result.fragment.suffix)}` : '';
        const textStart = encodeURIComponent(result.fragment.textStart);
        const textEnd = result.fragment.textEnd ? `,${encodeURIComponent(result.fragment.textEnd)}` : '';

        url = `${url}#:~:text=${prefix}${textStart}${textEnd}${suffix}`;
    } else {
        handleFragmentGenerationError(result.status);
        return; // Don't send message if fragment generation failed
    }

    return { text, url, format };

    // Handle fragment generation errors with user-friendly messages
    function handleFragmentGenerationError(statusCode) {

        const statusCodeMessages = {
            1: 'The selected text is too short or does not contain enough valid words. Please choose a longer or more specific phrase.',
            2: 'The selected text appears multiple times on this page and no unique link could be created. Try selecting a different text segment.',
            3: 'The process took too long. This may be due to a large page size or slow browser performance. Try selecting a different text segment.',
            4: 'An unexpected error occurred while generating the link.',
        };

        console.error(`Unable to generate fragment link. Status: ${statusCodeMessages[statusCode]}`);

        window.queueMicrotask(() => {
            alert(`Failed to copy the selected text as a unique link.\n\n(${statusCodeMessages[statusCode]})`);
        });
    }
}

// Write prepared link data to clipboard (only called in top-level frame)
function writeToClipboard(linkData) {
    console.debug(`Writing to clipboard (${window.location.host})`, linkData);

    const formatHandlers = {
        'html': copyHtmlLinkToClipboard,
        'markdown': copyMarkdownLinkToClipboard
    };

    const handler = formatHandlers[linkData.format];
    if (!handler) {
        throw new Error(`Unsupported format: ${linkData.format}`);
    }

    handler(linkData.text, linkData.url);
}

function copyHtmlLinkToClipboard(text, url) {
    const link = `<a href="${url}" target="_blank">${text}</a>`;
    const plainText = `${text} (${url})`;

    const data = [new ClipboardItem({
        "text/html": new Blob([link], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" })
    })];

    console.debug(`Copying HTML link to clipboard (${window.location.host})`, { text, url });
    navigator.clipboard.write(data);
    console.debug(`HTML link copied to clipboard (${window.location.host})`, { text, url });
}

function copyMarkdownLinkToClipboard(text, url) {
    // Normalize the text to remove newline breaks and excessive whitespace
    const normalizedText = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
    const link = `[${normalizedText}](${url})`;

    const data = [new ClipboardItem({
        "text/plain": new Blob([link], { type: "text/plain" })
    })];

    console.debug(`Copying Markdown link to clipboard (${window.location.host})`, { text, url });
    navigator.clipboard.write(data);
    console.debug(`Markdown link copied to clipboard (${window.location.host})`, { text, url });
}