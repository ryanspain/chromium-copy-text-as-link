// inject the foreground script into the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    console.log("tab updated", tabId);

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

    chrome.contextMenus.create(
        {
            "id": "copy-text-as-html-link",
            "title": "Copy text as link",
            "contexts": ["selection"],
        }
    );

    // todo: support copying as markdown link
    // chrome.contextMenus.create(
    //     {
    //         "id": "copy-text-as-markdown-link",
    //         "title": "Copy text as link",
    //         "contexts": ["selection"],
    //     }
    // );

    return
});

// register an on click command for the context menu options
chrome.contextMenus.onClicked.addListener(onCommandClicked);

// handle context menu option clicks
function onCommandClicked(info, tab) {

    console.log("info:", info);
    console.log("tab", tab);

    var selectedText = info.selectionText;
    var url = tab.url;

    // send a message to the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

        // tell the active tabe to execute the copy text as link command
        chrome.tabs.sendMessage(
            tabs[0].id,
            {
                message: "copy_text_as_html_link",
                selectedText: selectedText,
                url: url
            },
            function (response) { });
    });
}
