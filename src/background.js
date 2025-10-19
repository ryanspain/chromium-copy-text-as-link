// when the extension is installed or updated, set default values
chrome.runtime.onInstalled.addListener(function() {

    chrome.storage.sync.get(['preferred_command', 'preferred_format'], function(settings) {

        const default_command = 'copy_text_as_page_link';
        const default_format = 'html';

        console.debug(`Current preferred copy command: ${settings.preferred_command}`);
        console.debug(`Current preferred link format: ${settings.preferred_format}`);

        // if the preferred command is not set, set it to the default command (first install)
        if (settings.preferred_command === undefined) {
            chrome.storage.sync.set({ preferred_command: default_command }, function() {
                console.debug(`Preferred copy command defaulted to ${default_command}`);
            });
        }

        // if the preferred format is not set, set it to the default format (first install)
        if (settings.preferred_format === undefined) {
            chrome.storage.sync.set({ preferred_format: default_format }, function() {
                console.debug(`Preferred link format defaulted to ${default_format}`);
            });
        }
    });
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

    chrome.storage.sync.get(['preferred_command', 'preferred_format'], function(settings) {

        let command = settings.preferred_command || 'copy_text_as_page_link';
        let format = settings.preferred_format || 'html';

        var message = { command: command, format: format };

        console.debug(`Sending message to tab with ID: ${tab.id}`, message);

        // tell the active tab to execute the command
        chrome.tabs.sendMessage(tab.id, message);
    });
});

// scenario 2: the user uses the keyboard shortcut
// register an on command listener for the keyboard shortcuts
chrome.commands.onCommand.addListener(function (command, tab) {

    console.debug('Keyboard shortcut command received', command);

    chrome.storage.sync.get(['preferred_format'], function(settings) {

        let format = settings.preferred_format || 'html';

        var message = { command: command, format: format };

        console.debug(`Sending message to tab with ID: ${tab.id}`, message);

        // tell the active tab to execute the command
        chrome.tabs.sendMessage(tab.id, message);
    });
});

// scenario 3: foreground script requests clipboard write
// receive link data from any frame and forward to top-level frame only
chrome.runtime.onMessage.addListener((message, sender) => {

    if (message.command === 'request_clipboard_write') {
        console.debug('Received clipboard write request from tab', sender.tab.id, message.data);

        // Forward the data to the top-level frame only (frameId: 0)
        chrome.tabs.sendMessage(
            sender.tab.id,
            {
                command: 'write_to_clipboard',
                data: message.data
            },
            {
                frameId: 0  // Send only to top-level frame that has clipboard access
            }
        );
    }
});
