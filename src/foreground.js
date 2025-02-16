const exports = {};

// handle message requests
chrome.runtime.onMessage.addListener((message) => {

    console.debug(`${message.command} message received`, message);

    switch (message.command) {
        case 'copy_text_as_page_link':
            copySelectedTextAsPageLink()
            break;
        case 'copy_text_as_fragment_link':
            copySelectedTextAsFragmentLink()
            break;
        default:
            throw new Error("Unsupported message");
    }
});

function copySelectedTextAsPageLink() {

    var selection = window.getSelection();
    var url = window.location.href;

    var link = `<a href="${url}" target="_blank">${selection}</a>`;

    var type = "text/html";
    var blob = new Blob([link], { type });
    var data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data);
}

function copySelectedTextAsFragmentLink() {

    var selection = window.getSelection();
    var url = window.location.href;

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

    var link = `<a href="${url}" target="_blank">${selection}</a>`;

    var type = "text/html";
    var blob = new Blob([link], { type });
    var data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data);
}

const reportFailure = (status) => {
    const statusCodeMessages = {
        1: 'The selected text is too short or does not contain enough valid words. Please choose a longer or more specific phrase.',
        2: 'The selected text appears multiple times on this page and no unique link could be created. Try selecting a different text segment.',
        3: 'The process took too long. This may be due to a large page size or slow browser performance. Try selecting a different text segment.',
        4: 'An unexpected error occurred while generating the link.',
    };

    window.queueMicrotask(() => {
        alert(
            `Failed to copy the selected text as a unique link, please select a longer sequence of words.
        \n\n
        (${statusCodeMessages[status]})`
        );
    });
    return true;
};