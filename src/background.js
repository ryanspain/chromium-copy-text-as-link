// inject the foreground script into the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {

        // load the foreground script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./foreground.js"]
        });

    }
});

// refresh context menu items
chrome.contextMenus.removeAll(function () {

    chrome.contextMenus.create({
        "id": "copy-text-as-html-link",
        "title": "Copy text as link",
        "contexts": ["selection"],
    });

});

// register an on click command for the context menu options
chrome.contextMenus.onClicked.addListener(onCommandClicked);

// handle context menu option clicks
function onCommandClicked(info, tab) {

    var message = {
        command: "copy_text_as_plain_html_link",
        selectedText: info.selectionText,
        url: tab.url
    };

    // tell the active tab to execute the copy text as link command
    chrome.tabs.sendMessage(tab.id, message);

}
