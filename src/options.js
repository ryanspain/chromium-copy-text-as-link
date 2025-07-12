// Check if we're running in a Chrome extension context
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

if (!isExtension) {
    document.querySelector('.preview-notice').style.display = 'block';
}

function loadPreferences() {

    if (!isExtension) return;

    chrome.storage.sync.get(['preferred_command', 'preferred_format'], (settings) => {
        if (settings.preferred_command) {
            const copyCommandToggle = document.querySelector(`[data-command="${settings.preferred_command}"]`);
            if (copyCommandToggle) copyCommandToggle.classList.add('selected');
        }

        if (settings.preferred_format) {
            const linkFormatSelect = document.getElementById('link-format-input');
            if (linkFormatSelect) linkFormatSelect.value = settings.preferred_format;
        }
    });
}

// Handle copy command preference selection
document.getElementsByName('copy-command-option').forEach(copyCommandToggle => {
    copyCommandToggle.addEventListener('click', function () {

        // Remove selected class from all other copy command options
        document
            .getElementsByName('copy-command-option')
            .forEach(c => c.classList.remove('selected'));

        // Add selected class to clicked copy command option
        this.classList.add('selected');

        const selectedCommand = this.dataset.command;

        if (!isExtension) return;

        chrome.storage.sync.set({ preferred_command: selectedCommand }, function() {
            console.debug('Preferred copy command saved:', selectedCommand);
        });
    });
});

// Handle link format preference selection
document.getElementById('link-format-input').addEventListener('change', function() {

    const selectedFormat = this.value;

    if (!isExtension) return;

    chrome.storage.sync.set({ preferred_format: selectedFormat }, function() {
        console.debug('Preferred link format saved:', selectedFormat);
    });
});

// Load initial preferences
loadPreferences();