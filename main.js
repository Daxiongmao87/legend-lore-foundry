// main.js
import { utils } from './modules/utils.js';
import { settingsManager } from './modules/settings.js';
import { apiManager } from './modules/api.js';
import { dataHandler } from './modules/data.js';
import { uiComponents } from './modules/ui.js';
import { proseMirrorOverride } from './modules/prosemirror-override.js';
import { journalEntryApp } from './modules/journal-entry-app.js';
import { dialogHandler } from './modules/dialog-handler.js';

// Initialize settings
settingsManager.registerSettings();

// FoundryVTT Hook: Ready
Hooks.once('ready', () => {
    console.log("5e-gpt-populator | Ready hook triggered.");
    proseMirrorOverride.customizeProseMirror(); // Customize ProseMirror
});

// FoundryVTT Hook: Render Module Settings
Hooks.on('renderModuleSettings', (app, html, data) => {
    if (data.module === '5e-gpt-populator') {
        settingsManager.updateModelDropdown(html); // Update model dropdown
    }
});

// FoundryVTT Hook: Render Package Configuration
Hooks.on('renderPackageConfiguration', (app, html, data) => {
    // Ensure this code executes only for your module
    if (data.module !== '5e-gpt-populator') {
        return;
    }

    // Update the UI to reflect the current settings
    const apiKeyInput = html.find('[name="5e-gpt-populator.openaiApiKey"]');
    const modelDropdown = html.find('[name="5e-gpt-populator.model"]');

    apiKeyInput.val(game.settings.get('5e-gpt-populator', 'openaiApiKey'));
    modelDropdown.val(game.settings.get('5e-gpt-populator', 'model'));

    // Listen for changes in the API key input to update the model dropdown
    apiKeyInput.on('change', async (event) => {
        const newApiKey = event.target.value;
        await game.settings.set('5e-gpt-populator', 'openaiApiKey', newApiKey);
        // Update model dropdown based on the new API key
        settingsManager.updateModelDropdown(html);
    });

    // Additional code to handle other setting changes can be added here
});


// Make global references to the modules if necessary
// This is to ensure that they are accessible to the rest of the module
window.YourModule = {
    utils,
    apiManager,
    dataHandler,
    uiComponents,
    journalEntryApp,
    dialogHandler,
    // Any other global references
};

// Additional code and hook registrations

