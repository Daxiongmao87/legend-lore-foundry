import './module/settings.js';
import './module/prosemirrorPlugin.js';
import './module/api.js';
import './module/uiHelpers.js';
import './module/journalManager.js';
import './module/utils.js';

// Initialize the module
Hooks.once('ready', () => {
    console.log("legend-lore | Ready hook triggered.");
    // Other initialization code...
});
