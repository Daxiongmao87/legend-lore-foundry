import { log } from './utils.js';
/**
 * Registers the module's settings in Foundry VTT.  This allows for flexible API endpoint configuration.
 */
export function registerSettings() {
    /**
     * Default payload JSON based on the OpenAI API documentation.
     */

    const defaultPayloadJson = `# Example payload JSON for the OpenAI GPT-4o model.
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a narrative generator for role-playing game journals. The content must be diegetic. Avoid anachronistic references. Your output must be a valid JSON object. The following JSON contains your output instructions."
    },
    {
      "role": "user",
      "content": "{{UserInput}}"
    }
  ],
  "response_format": {{ContentTemplate}},
}`
    game.settings.register('legend-lore', 'https', {
        name: 'Enable HTTPS',
        hint: 'Whether to use HTTPS or HTTP for the API URL. Disable this if using localhost',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
    });
    game.settings.register('legend-lore', 'textGenerationApiUrl', {
        name: 'Text Generation API URL',
        hint: 'Enter the target URL for the text generation API endpoint.',
        scope: 'world',
        config: true,
        type: String,
        default: 'api.openai.com/v1/chat/completions',
    });
    game.settings.register('legend-lore', 'apiKey', {
        name: "API Key",
        hint: "Enter your API key here. (optional)",
        scope: 'world',
        config: true,
        type: String,
        default: ""
    });
    game.settings.register('legend-lore', 'payloadJson', {
        name: "Payload JSON",
        hint: "Enter the JSON payload for the API request.",
        scope: 'world',
        config: true,
        type: String,
        default: defaultPayloadJson
    });
    game.settings.register('legend-lore', 'responseJsonPath', {
        name: "Response JSON Path",
        hint: "Enter the path to the response JSON in dot notation.",
        scope: 'world',
        config: true,
        type: String,
        default: 'choices.0.message.content'
    });
    game.settings.register('legend-lore', 'reasoningEndTag', {
        name: "Reasoning End Tag",
        hint: "Enter the tag that indicates the end of the reasoning section. (optional)",
        scope: 'world',
        config: true,
        type: String,
        default: ''
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
// Hooks.on('renderPackageConfiguration', (app, html, data) => {
//     const apiKeyInput = $(html).find('[name="legend-lore.openaiApiKey"]')[0];
//     if (apiKeyInput) {
//         apiKeyInput.type = 'password';
//         apiKeyInput.autocomplete = 'one-time-code';
//     }
//     const apiModelsNote = $(html).find("[data-setting-id='legend-lore.models']").find('.notes').first()[0];
//     apiModelsNote.innerHTML = apiModelsNote.innerHTML.replace("[OpenAI Models]", "<a href='https://platform.openai.com/docs/models/overview'>OpenAI Models</a>");
//     apiModelsNote.innerHTML = apiModelsNote.innerHTML.replace("[OpenAI Pricing]", "<a href='https://openai.com/pricing'>OpenAI Pricing</a>");
// });
/**
 * Hook to place a call-to-action panel right below the h2 header in the settings section of the module to provide the URL to the github page for further guidance
 * @param {Application} app - The application instance.
 * @param {JQuery} html - The jQuery object representing the HTML of the app.
 * @param {Object} data - Data provided to the template.
 */
Hooks.on('renderPackageConfiguration', (app, html, data) => {
    const ctaPanel = $(`
        <div style="border: solid; border-width: 1px; padding: 0.75rem; padding-bottom: 0.25rem; border-radius:8px; border-color: #5d142b; margin-bottom:1rem; background-color: rgba(255,255,255,0.35);">
            <h4><b> <i class="fa-regular fa-circle-question"></i> Need Help?</b></h4>
            <p>Visit Legend Lore's <a href="https://www.github.com/Daxiongmao87/legend-lore-foundry">Github Repository</a> for information on these settings.</p>
        </div>
        `);
    const apiModal = $(html).find("[data-tab='legend-lore']").find('h2').first();
    //we need to make sure the ctaPanel is directly after the h2 header
    apiModal.after(ctaPanel);
});

/**
 * Helper function that converts an input field for a setting into a textarea.
 * Retrieves the stored setting value via game.settings.get(), decodes newline escapes,
 * replaces the input with a textarea styled per the provided style string, and binds a change
 * event to re-escape newlines on save.
 *
 * @param {JQuery} html - The rendered settings HTML.
 * @param {string} moduleId - The module namespace (e.g., "legend-lore").
 * @param {string} settingKey - The key of the setting to modify.
 * @param {string} textareaStyle - CSS styles to apply to the textarea.
 * @param {Function} [repositionCallback] - Optional callback to reposition parts of the setting's container.
 */
function convertSettingToTextarea(html, moduleId, settingKey, textareaStyle, repositionCallback) {
  const fullSettingId = `${moduleId}.${settingKey}`;
  const settingDiv = html.find(`[data-setting-id="${fullSettingId}"]`);
  if (!settingDiv.length) return;

  // Retrieve the stored value from Foundry's settings and decode escaped newlines.
  let storedValue = game.settings.get(moduleId, settingKey) || "";
  storedValue = storedValue.replace(/\\n/g, "\n");

  // Locate the original input element by its name attribute.
  const inputEl = settingDiv.find(`input[name="${fullSettingId}"]`);
  if (inputEl.length) {
    // Build the textarea element with the provided styles and desired attributes.
    const textarea = $(`
      <textarea name="${fullSettingId}"
                style="white-space: pre; overflow-x: auto; ${textareaStyle}"
                wrap="off">${storedValue}</textarea>
    `);
    // Replace the input with our new textarea.
    inputEl.replaceWith(textarea);

    // When the user changes the textarea, re-escape newline characters and update the setting.
    textarea.on("change", async (ev) => {
      const newRaw = ev.target.value;
      const escaped = newRaw.replace(/\n/g, "\\n");
      await game.settings.set(moduleId, settingKey, escaped);
    });
  }

  // If a reposition callback is provided, execute it.
  if (typeof repositionCallback === "function") {
    repositionCallback(settingDiv);
  }
}

Hooks.on("renderSettingsConfig", (app, html, data) => {
  // Convert the payloadJson setting field.
  convertSettingToTextarea(
    html,
    "legend-lore",
    "payloadJson",
    "width: 518px; min-height: 120px; height: 336px;",
    (settingDiv) => {
      // Reposition the form-fields div so that it appears after the <p class="notes"> element.
      const notesEl = settingDiv.find("p.notes");
      const formFieldsEl = settingDiv.find("div.form-fields");
      if (notesEl.length && formFieldsEl.length) {
        notesEl.after(formFieldsEl);
      }
    }
  );

  // Convert the globalContext setting field.
  convertSettingToTextarea(
    html,
    "legend-lore",
    "globalContext",
    "width: 518px; min-height: 80px; height: 120px;",
    (settingDiv) => {
      // Reposition the form-fields div so that it appears after the <p class="notes"> element.
      const notesEl = settingDiv.find("p.notes");
      const formFieldsEl = settingDiv.find("div.form-fields");
      if (notesEl.length && formFieldsEl.length) {
        notesEl.after(formFieldsEl);
      }
    }
  );
});

Hooks.once('ready', () => {
  registerSettings();
});

