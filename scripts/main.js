import './module/settings.js';
import './module/prosemirrorPlugin.js';
import './module/api.js';
import './module/uiHelpers.js';
import './module/journalManager.js';
import './module/utils.js';
/**
 * Initializes the Legend Lore module. This function sets up a hook that is
 * triggered when Foundry VTT is ready, logging a message to indicate the module is ready.
 */
function initializeModule() {
    log({message: "Ready hook triggered."});
}

/**
 * A Foundry VTT hook that is called once when the VTT environment is fully loaded and ready.
 * It initializes the Legend Lore module.
 */
Hooks.once('ready', initializeModule);
