// Check if we're running in a Chrome extension context
const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

if (!isExtension) {
    document.querySelector('.preview-notice').style.display = 'block';
}

function loadPreference() {
    if (!isExtension) return;

    chrome.storage.sync.get(['copy_text_as_link_mode'], function(result) {
        if (result.copy_text_as_link_mode) {
            const card = document.querySelector(`[data-mode="${result.copy_text_as_link_mode}"]`);
            if (card) card.classList.add('selected');
        }
    });
}

function savePreference(mode) {
    if (!isExtension) return;

    chrome.storage.sync.set({ copy_text_as_link_mode: mode }, function() {
        console.log('Mode saved:', mode);
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
        const mode = this.dataset.mode;
        savePreference(mode);
    });
});

// Load initial preference
loadPreference();