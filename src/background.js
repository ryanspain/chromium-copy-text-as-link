// when the extension is installed or updated, set default values
chrome.runtime.onInstalled.addListener(function() {

    chrome.storage.sync.get(['preferred_command'], function(settings) {

        const default_command = 'copy_text_as_page_link';

        console.debug(`Current preferred copy command: ${settings.preferred_command}`);

        // if the preferred command is not set, set it to the default command (first install)
        if (settings.preferred_command === undefined) {
            chrome.storage.sync.set({ preferred_command: default_command }, function() {
                console.debug(`Preferred copy command defaulted to ${default_command}`);
            });
        }
    });
});

// inject the foreground script into the tab
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    const scripts = ["./fragment-generation-utils.js", "./foreground.js"];

    if (changeInfo.status === 'complete' && /^http/.test(tab.url)) {

        console.debug(`Injecting foreground script(s) into tab with ID: ${tabId}`, scripts);

        // measure the time taken to inject the script
        const startTime = performance.now();

        // load the foreground script
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: scripts,
        })
        .then(() => {
            const duration = (performance.now() - startTime).toFixed(2);
            console.debug(`Foreground script(s) successfully injected into tab with ID: ${tabId} in ${duration} ms`);
        })
        .catch((error) => {
            const duration = (performance.now() - startTime).toFixed(2);
            console.error(`Error injecting foreground script(s) into tab with ID: ${tabId} after ${duration} ms`, error);
        });
    }
});

// refresh context menu items
chrome.contextMenus.removeAll(function () {

    console.debug('Refreshing context menu items');

    chrome.contextMenus.create({
        "id": "copy_text_as_link",
        "title": "Copy text as link",
        "contexts": ["selection"],
    });

    console.debug('Context menu items refreshed');
});

// scenario 1: the user uses the context menu
// register an on click command for the context menu options
chrome.contextMenus.onClicked.addListener(function (_, tab) {

    console.debug('Context menu item clicked');

    chrome.storage.sync.get(['preferred_command'], function(settings) {

        let command = settings.preferred_command || 'copy_text_as_page_link';

        var message = { command: command, format: 'html' };

        console.debug(`Sending message to tab with ID: ${tab.id}`, message);

        // tell the active tab to execute the command
        chrome.tabs.sendMessage(tab.id, message);
    });
});

// scenario 2: the user uses the keyboard shortcut
// register an on command listener for the keyboard shortcuts
chrome.commands.onCommand.addListener(function (command, tab) {

    console.debug('Keyboard shortcut command received', command);

    var message = { command: command, format: 'html' };

    console.debug(`Sending message to tab with ID: ${tab.id}`, message);

    // tell the active tab to execute the command
    chrome.tabs.sendMessage(tab.id, message);
});
