// handle message requests (from keyboard shortcuts or context menu)
chrome.runtime.onMessage.addListener((message) => {

    console.debug('Command received', message);

    switch (message.command) {
        case 'copy_text_as_page_link':
            copySelectedTextAsPageLink(message.format)
            break;
        case 'copy_text_as_fragment_link':
            copySelectedTextAsFragmentLink(message.format);
            break;
        default:
            throw new Error(`Unsupported command: ${message.command}`);
    }
});

function copyHtmlLinkToClipboard(text, url) {
    var link = `<a href="${url}" target="_blank">${text}</a>`;

    // Create both HTML and plain text versions for better clipboard preview support
    var htmlBlob = new Blob([link], { type: "text/html" });
    var plainText = `${text} (${url})`;
    var textBlob = new Blob([plainText], { type: "text/plain" });
    
    var data = [new ClipboardItem({ 
        "text/html": htmlBlob,
        "text/plain": textBlob
    })];

    console.debug('Copying HTML link to clipboard', { text, url });

    navigator.clipboard.write(data);
}

function copyMarkdownLinkToClipboard(text, url) {

    // Normalize the text to remove newline breaks and excessive whitespace
    text = text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();

    var link = `[${text}](${url})`;

    var type = "text/plain";
    var blob = new Blob([link], { type });
    var data = [new ClipboardItem({ [type]: blob })];

    console.debug('Copying Markdown link to clipboard', { text, url });

    navigator.clipboard.write(data);
}

function copySelectedTextAsPageLink(format) {

    var text = window.getSelection().toString().trim();
    var url = window.location.href;

    console.debug('Copying selected text as page link', { text: text, url: url });

    switch (format) {
        case 'html':
            copyHtmlLinkToClipboard(text, url);
            return;
        case 'markdown':
            copyMarkdownLinkToClipboard(text, url);
            return;
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
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
function copySelectedTextAsFragmentLink(format) {

    var selection = window.getSelection();
    var url = window.location.href;

    console.debug('Copying selected text as fragment link', { text: selection.toString(), url: url });

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
        reportFailure(result.status);
    }

    var text = selection.toString().trim();

    switch (format) {
        case 'html':
            copyHtmlLinkToClipboard(text, url);
            return;
        case 'markdown':
            copyMarkdownLinkToClipboard(text, url);
            return;
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
}

function reportFailure(status) {

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
            (${statusCodeMessages[status]})`
        );
    });

    return true;
};