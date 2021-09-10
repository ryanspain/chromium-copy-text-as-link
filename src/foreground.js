// handle message requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === 'copy_text_as_html_link') {

        var selectedText = request.selectedText;
        var url = request.url;

        console.debug(
            "copy_text_as_link message received",
            {
                url: url,
                selectedText: selectedText
            }
        );

        copySelectedTextAsLink(selectedText, url);

        sendResponse({ status: true });
    }
});

function copySelectedTextAsLink(selectedText, url) {

    // Create container for the HTML
    var container = document.createElement('a');
    container.innerText = selectedText;
    container.href = url;
    container.target = "_blank";

    // Style element
    container.style.cursor = 'pointer';
    container.style.fontFamily = "inherit";
    container.style.fontSize = "inherit";

    // Detect all style sheets of the page
    var activeSheets = Array.prototype.slice.call(document.styleSheets)
        .filter(function (sheet) {
            return !sheet.disabled
        })

    // Mount the container to the DOM to make `contentWindow` available
    document.body.appendChild(container)

    // Copy to clipboard
    window.getSelection().removeAllRanges()

    var range = document.createRange()
    range.selectNode(container)
    window.getSelection().addRange(range)

    document.execCommand('copy')

    console.log(container.innerHTML);
    console.log(range);

    for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = true

    document.execCommand('copy')

    for (var i = 0; i < activeSheets.length; i++) activeSheets[i].disabled = false

    // Remove the container
    document.body.removeChild(container)
}
