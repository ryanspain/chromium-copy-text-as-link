// handle message requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    console.debug(`${message.command} message received`, message);

    switch (message.command) {
        case 'copy_text_as_plain_html_link':
            copySelectedTextAsPlainHtmlLink(message.selectedText, message.url)
            break;
        case 'copy_text_as_markdown_link':
            throw new Error(`${message.command} not implemented yet`);
        default:
            throw new Error("Unsupported message");
    }
});

function copySelectedTextAsPlainHtmlLink(selectedText, url) {

    var link = `<a href="${url}" target="_blank">${selectedText}</a>`;

    var type = "text/html";
    var blob = new Blob([link], { type });
    var data = [new ClipboardItem({ [type]: blob })];

    navigator.clipboard.write(data);
}