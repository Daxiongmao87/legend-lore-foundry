import { log } from './utils.js';
/**
 * @constant {number} MAX_TOKENS Maximum number of tokens that can be sent in a single request to the OpenAI API.
 */
export const MAX_TOKENS = 4096;
/**
 * @constant {string} BASE_URL Base URL for the OpenAI API.
 */
export const BASE_URL = 'https://api.openai.com/v1/chat/completions';
/**
 * Registers the module's settings in Foundry VTT. It includes settings for the OpenAI API key,
 * available models, temperature settings, journal entry templates, and global context.
 */
export function registerSettings() {
    game.settings.register('legend-lore', 'openaiApiKey', {
        name: "OpenAI API Key",
        hint: "Enter your OpenAI API key here.",
        scope: 'world',
        config: true,
        type: String,
        default: ""
    });
    game.settings.register('legend-lore', 'models', {
        name: "Models",
        hint: "Enter models you wish to have available in a space-separated list.  Only models with JSON mode are supported. For model information, see [OpenAI Models]. For pricing information, see [OpenAI Pricing].",
        scope: 'world',
        config: true,
        type: String,
        default: "gpt-3.5-turbo-1106 gpt-4-preview" 
    });
    game.settings.register('legend-lore', 'temperature', {
        name: "Temperature",
        hint: "Enter a desired temperature (higher is more creative, lower is more consistent).",
        scope: 'world',
        config: true,
        type: Number,
        default: "0.3"
    });
    game.settings.registerMenu("legend-lore", "templateSettingMenu", {
        name: "Journal Entry Templates",
        label: "Select Templates", 
        hint: "Select journal entry templates for your module.",
        icon: "fas fa-bars",
        type: JournalEntrySelectionApplication,
        restricted: true
    });
    game.settings.register('legend-lore', 'globalContext', {
        name: "Global Context",
        hint: "Context that will be considered when generating content.",
        scope: 'world',
        config: true,
        type: String,
        default: ''
    });
      game.settings.register('legend-lore', 'journalEntryTemplates', {
        scope: 'world',
        config: false,
        type: Object,
        default: ["legend-lore.journal-entry-templates"]
    });
    log({message: "Game settings registered successfully."});
}
/**
 * @class
 * @classdesc A form application for selecting journal entry templates in Foundry VTT.
 * Provides functionality to select and manage journal entries from compendiums.
 */
class JournalEntrySelectionApplication extends FormApplication {
    /**
     * Constructs a new JournalEntrySelectionApplication instance.
     * Initializes journalEntries with the available JournalEntry compendiums.
     * @param {...*} args - Arguments passed to the FormApplication constructor.
     */
    constructor(...args) {
      super(...args);
      this.journalEntries = this._getJournalEntryCompendiums();
    }
    /**
     * Defines the default options for the JournalEntrySelectionApplication.
     * @returns {Object} The default options for this application.
     */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        id: "journal-entry-selection",
        classes: ["legend-lore"],
        title: "Select Journal Entries",
        template: "modules/legend-lore/templates/journal-entry-selection.html",
        width: 640,
        height: "auto",
        resizable: true
      });
    }
    /**
     * Prepares data for rendering the template. This includes the current selection of journal entries.
     * @returns {Object} Data to be used in rendering the template.
     */
    getData() {
        const selectedIds = new Set(game.settings.get('legend-lore', 'journalEntryTemplates'));
        return {
            entries: this.journalEntries.map(entry => ({
                ...entry,
                isSelected: selectedIds.has(entry.id)
            }))
        };
    }
    /**
     * Updates the journal entry selections based on form data.
     * @param {Event} event - The DOM event that triggered the update.
     * @param {Object} formData - The form data from the application's HTML form.
     */
    async _updateObject(event, formData) {
        const selectedEntries = Object.entries(formData)
            .filter(([key, value]) => value)
            .map(([key]) => key); 
        await game.settings.set('legend-lore', 'journalEntryTemplates', selectedEntries);
    }
    /**
     * Activates interactive listeners for the application's HTML, such as input filters.
     * @param {JQuery} html - The jQuery object representing the HTML of the app.
     */
    activateListeners(html) {
        super.activateListeners(html);
        const filterInput = html.find("#filter-input");
        const entryContainer = html.find("#journal-entries-container");
        filterInput.on("keyup", event => {
            const searchTerm = event.target.value.toLowerCase();
            entryContainer.find(".checkbox").each(function() {
                const label = $(this).find("label").text().toLowerCase();
                const isMatch = label.includes(searchTerm);
                $(this).toggle(isMatch);
            });
        });
    }
    /**
     * Retrieves a list of JournalEntry compendiums available in the game.
     * @returns {Array} An array of objects, each representing a journal entry compendium.
     */
    _getJournalEntryCompendiums() {
        const packs = Array.from(game.packs);
        return packs
            .filter(pack => pack.metadata.type === "JournalEntry")
            .map(pack => ({
                id: pack.metadata.id,
                name: pack.metadata.name,
                label: `${pack.metadata.label} `,
                group: `${pack.metadata.id.split('.')[0]}`
            }));
    }
  }
/**
 * Hook for modifying the OpenAI API key input field in the Foundry VTT package configuration UI.
 * @param {Application} app - The application instance.
 * @param {JQuery} html - The jQuery object representing the HTML of the app.
 * @param {Object} data - Data provided to the template.
 */
Hooks.on('renderPackageConfiguration', (app, html, data) => {
    const apiKeyInput = $(html).find('[name="legend-lore.openaiApiKey"]')[0];
    if (apiKeyInput) {
        apiKeyInput.type = 'password';
        apiKeyInput.autocomplete = 'one-time-code';
    }
    const openAIModelsNote = $(html).find("[data-setting-id='legend-lore.models']").find('.notes').first()[0];
    openAIModelsNote.innerHTML = openAIModelsNote.innerHTML.replace("[OpenAI Models]", "<a href='https://platform.openai.com/docs/models/overview'>OpenAI Models</a>");
    openAIModelsNote.innerHTML = openAIModelsNote.innerHTML.replace("[OpenAI Pricing]", "<a href='https://openai.com/pricing'>OpenAI Pricing</a>");
});
/**
 * Hook for Foundry VTT's 'ready' event. It calls the registerSettings function to initialize
 * the module's settings when Foundry VTT is ready.
 */
Hooks.once('ready', () => {
    registerSettings();
});
