// inject the foreground script into the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {

        // load the foreground script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["./foreground.js", "./fragment-generation-utils.js"]
        });

    }
});

// refresh context menu items
chrome.contextMenus.removeAll(function () {

    chrome.contextMenus.create({
        "id": "copy_text_as_page_link",
        "title": "Copy text as page link",
        "contexts": ["selection"],
    });

});

// register an on click command for the context menu options
chrome.contextMenus.onClicked.addListener(function (_, tab) {

    var message = {
        command: "copy_text_as_page_link",
        url: tab.url
    };

    // tell the active tab to execute the copy text as link command
    chrome.tabs.sendMessage(tab.id, message);

}
