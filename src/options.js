// Check if we're running in a Chrome extension context
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

if (!isExtension) {
    document.querySelector('.preview-notice').style.display = 'block';
}

function loadPreference() {
    if (!isExtension) return;

    chrome.storage.sync.get(['preferred_command'], function(settings) {
        if (settings.preferred_command) {
            const card = document.querySelector(`[data-command="${settings.preferred_command}"]`);
            if (card) card.classList.add('selected');
        }
    });
}

function savePreference(command) {
    if (!isExtension) return;

    chrome.storage.sync.set({ preferred_command: command }, function() {
        console.log('Preferred command saved:', command);
    });
}

// Handle card selection
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', function() {
        // Remove selection from all cards
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));

        // Add selection to clicked card
        this.classList.add('selected');

        // Save preference
        const command = this.dataset.command;
        savePreference(command);
    });
});

// Load initial preference
loadPreference();