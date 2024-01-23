// Register game settings
export const max_tokens=4096;
export const base_url='https://api.openai.com/v1/chat/completions';
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
        hint: "Enter models you wish to have available in a space-separated list.  Only models with JSON mode are supported. For model information, see [OpenAI Models]. For pricing information, see [OpenAI Pricing Link].",
        scope: 'world',
        config: true,
        type: String,
        default: "gpt-3.5-turbo-1106 gpt-4-1106-preview" // or set a default model if desired
    });
    game.settings.register('legend-lore', 'temperature', {
        name: "Temperature",
        hint: "Enter a desired temperature (higher is more creative, lower is more consistent).",
        scope: 'world',
        config: true,
        type: Number,
        default: "0.3"
    });
    // Register the settings menu
    game.settings.registerMenu("legend-lore", "templateSettingMenu", {
        name: "Journal Entry Templates",
        label: "Select Templates", 
        hint: "Select journal entry templates for your module.",
        icon: "fas fa-bars",
        type: JournalEntrySelectionApplication,
        restricted: true
      });
      game.settings.register('legend-lore', 'globalContext', {
        scope: 'world',
        label: "Global Context",
        hint: "Context that will be considered when generating content.",
        config: true,
        type: String,
        default: ''
      });

      game.settings.register('legend-lore', 'journalEntryTemplates', {
        scope: 'world',
        config: false,
        type: Object,
        default: ["journal-entry-templates"]
      });

      
    //updateModelDropdown();
}

class JournalEntrySelectionApplication extends FormApplication {
    constructor(...args) {
      super(...args);
      this.journalEntries = this._getJournalEntryCompendiums();
    }
  
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
  
    getData() {
        const selectedIds = new Set(game.settings.get('legend-lore', 'journalEntryTemplates'));
        return {
            entries: this.journalEntries.map(entry => ({
                ...entry,
                isSelected: selectedIds.has(entry.id)
            }))
        };
    }

    async _updateObject(event, formData) {
        const selectedEntries = Object.entries(formData)
            .filter(([key, value]) => value)
            .map(([key]) => key); // key is now the id
        await game.settings.set('legend-lore', 'journalEntryTemplates', selectedEntries);
    }

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
  

async function updateModelDropdown(html) {
    return new Promise(async (resolve, reject) => {
        const apiKey = game.settings.get('legend-lore', 'openaiApiKey');
        if (!apiKey) {
            game.settings.register('legend-lore', 'model', {
              name: "Model",
              hint: "Please enter a valid API Key.",
              scope: 'world',
              config: true,
              type: String,
              choices: {},
              default: "None"
            });
            resolve();
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            const data = await response.json();
            const models = data.data
                .filter(model => model.id.includes('gpt'))
                .reduce((choices, model) => {
                    choices[model.id] = model.id;
                    return choices;
                }, {});
            const defaultModel=(game.settings.get('legend-lore', 'model')) ? game.settings.get('legend-lore', 'model') : "gpt-3.5-turbo"
            await game.settings.register('legend-lore', 'model', {
                name: "Model",
                hint: "Select a model. For pricing information, see [OpenAI Pricing Link].",
                scope: 'world',
                config: true,
                type: String,
                choices: models,
                default: defaultModel // or set a default model if desired
            });
            if (html) {
              html.find('[data-setting-id="legend-lore.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.'
              let dropdown = html.find('[name="legend-lore.model"]');
              $.each(models, function(model) {
                dropdown.append($("<option></option>")
                  .attr("value", model)
                  .text(model));
              });
              dropdown.val(defaultModel).change();
            }
            resolve();

        } catch (error) {
            console.error('Error fetching models:', error);
            reject(error);
        }
    });
}

function getJournalEntryCompendiums() {
    const packs = Array.from(game.packs);
    let journalEntryPacks = [];
    for (let i = 0; i < packs.length; i++) {
    if(packs[i].metadata.type == "JournalEntry") {
        journalEntryPacks.push(packs[i].metadata);
    }
    }
    return journalEntryPacks;
}

function handleApiKeyInput(html) {
    const apiKeyInput = html.find('[name="legend-lore.openaiApiKey"]');
    html.find('[data-setting-id="legend-lore.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.';

    let debouncedApiKeyChange = debounce(updateModelDropdown, 1000);

    // Only proceed if the input exists and does not have the listener attached.
    if (apiKeyInput.length > 0 && !apiKeyInput.data('listener-attached')) {
        apiKeyInput.on('input', (event) => {
            let newValue = event.target.value;
            game.settings.set('legend-lore', 'openaiApiKey', newValue);
            debouncedApiKeyChange(html);
            console.log('OpenAI API Key changed:', newValue);
        });

        apiKeyInput.data('listener-attached', true);
    }
}

Hooks.on('renderPackageConfiguration', (app, html, data) => {
    let apiKeyInput = $('[name="legend-lore.openaiApiKey"]')[0];
    if (apiKeyInput) {
        apiKeyInput.type = 'password';
        apiKeyInput.autocomplete = 'one-time-code';
    }
});

Hooks.once('ready', () => {
    registerSettings();
});