var CopyTextAsLink = {
    Constants: {
        CopyMode: {
            COPY_TEXT_AS_PAGE_LINK: 'copy_text_as_page_link',
            COPY_TEXT_AS_FRAGMENT_LINK: 'copy_text_as_fragment_link'
        },
        LinkFormat: {
            COPY_AS_MARKDOWN: 'markdown',
            COPY_AS_HTML: 'html'
        }
    },
    onLoad: function () {
        // Load user settings from storage
        CopyTextAsLink.restoreUserSettings();

        // Listen for changes to copy mode
        document.getElementsByName('copy-mode-option').forEach(function (option) {
            option.addEventListener('change', (event) => CopyTextAsLink.onChangeCopyMode(event));
        });

        // Listen for changes to link format
        document.getElementsByName('copy-as-markdown-switch').forEach(function (toggle) {
            toggle.addEventListener('change', (event) => CopyTextAsLink.onChangeLinkFormat(event));
        });
    },
    restoreUserSettings: function () {
        if (CopyTextAsLink.isDebugMode) return;
        chrome.storage.sync.get(['preferred_command', 'preferred_format'], function (settings) {
            if (settings.preferred_command) CopyTextAsLink.setCopyMode(settings.preferred_command);
            if (settings.preferred_format) CopyTextAsLink.setLinkFormat(settings.preferred_format);
        });
    },
    getCopyMode: function () {
        var checked = document.querySelector('input[name="copy-mode-option"]:checked');
        return checked ? checked.value : undefined;
    },
    setCopyMode: function (mode) {
        var radio = document.querySelector(`input[name="copy-mode-option"][value="${mode}"]`);
        if (radio) radio.checked = true;
        else console.debug(`Invalid copy mode: ${mode}`);
    },
    onChangeCopyMode: function (event) {
        var copyCommand = event.target.value;
        console.log(`Preferred copy command changed to: ${copyCommand}`);

        if (CopyTextAsLink.isDebugMode) return;

        chrome.storage.sync.set({ preferred_command: copyCommand }, function () {
            console.debug(`Preferred copy command saved: ${copyCommand}`);
        });
    },
    getLinkFormat: function () {
        return document.querySelector('input[name="copy-as-markdown-switch"]').checked ? 'markdown' : 'html';
    },
    setLinkFormat: function (format) {
        var switchElement = document.querySelector('input[name="copy-as-markdown-switch"]');
        switch (format) {
            case CopyTextAsLink.Constants.LinkFormat.COPY_AS_MARKDOWN:
                switchElement.checked = true;
                break;
            case CopyTextAsLink.Constants.LinkFormat.COPY_AS_HTML:
                switchElement.checked = false;
                break;
            default:
                console.debug(`Invalid link format: ${format}`);
        }
    },
    onChangeLinkFormat: function (event) {
        var linkFormat = event.target.checked ? 'markdown' : 'html';
        console.log(`Preferred link format changed to: ${linkFormat}`);

        if (CopyTextAsLink.isDebugMode) return;

        chrome.storage.sync.set({ preferred_format: linkFormat }, function () {
            console.debug(`Preferred link format saved: ${linkFormat}`);
        });
    },
    isDebugMode: typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync ? false : true
};

CopyTextAsLink.onLoad();