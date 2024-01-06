// Register game settings
export const max_tokens=4096;
export const base_url='https://api.openai.com/v1/chat/completions';
export function registerSettings() {
    game.settings.register('5e-gpt-populator', 'openaiApiKey', {
        name: "OpenAI API Key",
        hint: "Enter your OpenAI API key here.",
        scope: 'world',
        config: true,
        type: String,
        default: ""
    });
    game.settings.register('5e-gpt-populator', 'model', {
        name: "Model",
        hint: "Please enter a valid API Key.",
        scope: 'world',
        config: true,
        type: String,
        choices: {},
        default: "None"
    });
    game.settings.register('5e-gpt-populator', 'temperature', {
        name: "Temperature",
        hint: "Enter a desired temperature (higher is more creative, lower is more consistent).",
        scope: 'world',
        config: true,
        type: Number,
        default: "0.3"
    });
    updateModelDropdown();
}

function setBaseUrl(url) {
    let baseURL=url;
    return url;
}
async function updateModelDropdown(html) {
    return new Promise(async (resolve, reject) => {
        const apiKey = game.settings.get('5e-gpt-populator', 'openaiApiKey');
        if (!apiKey) {
            game.settings.register('5e-gpt-populator', 'model', {
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
            const defaultModel=(game.settings.get('5e-gpt-populator', 'model')) ? game.settings.get('5e-gpt-populator', 'model') : "gpt-3.5-turbo"
            await game.settings.register('5e-gpt-populator', 'model', {
                name: "Model",
                hint: "Select a model. For pricing information, see [OpenAI Pricing Link].",
                scope: 'world',
                config: true,
                type: String,
                choices: models,
                default: defaultModel // or set a default model if desired
            });
            if (html) {
              html.find('[data-setting-id="5e-gpt-populator.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.'
              let dropdown = html.find('[name="5e-gpt-populator.model"]');
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

Hooks.on('renderModuleSettings', (app, html, data) => {
    // Check if this is your module's settings
    if (data.module === '5e-gpt-populator') {
        // Load your HTML template
        fetch('modules/5e-gpt-populator/templates/settings.html')
            .then(response => response.text())
            .then(template => {
                // Append or replace existing HTML with your template
                html.find('.settings-body').html(template);

                // Set the value of the input from saved settings
                html.find('#openai-api-key').val(game.settings.get('5e-gpt-populator', 'openaiApiKey'));

                // Add event listener for form submission
                html.on('submit', 'form', async (event) => {
                    event.preventDefault();
                    const apiKey = html.find('#openai-api-key').val();
                    await game.settings.set('5e-gpt-populator', 'openaiApiKey', apiKey);
                });
            });
    }
});

Hooks.on('renderPackageConfiguration', (app, html, data) => {
    const apiKeyInput = html.find('[name="5e-gpt-populator.openaiApiKey"]');
    html.find('[data-setting-id="5e-gpt-populator.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.'
    let debouncedApiKeychange = debounce(updateModelDropdown, 1000);
    // Only proceed if the input exists and does not have the listener attached.
    if (apiKeyInput.length > 0 && !apiKeyInput.data('listener-attached')) {
      // Add an 'input' event listener to the input field.
      apiKeyInput.on('input', (event) => {
        // Whenever the input value changes, log the new value to the console.
        let newValue=event.target.value;
        game.settings.set('5e-gpt-populator', 'openaiApiKey', newValue);
        debouncedApiKeychange(html);

        console.log('OpenAI API Key changed:', newValue);
        // Additional handling code for the new value can go here.
      });

      // Set a data attribute to prevent attaching the listener multiple times.
      if(html) {}
        apiKeyInput.data('listener-attached', true);
    }

});
Hooks.once('ready', () => {
    registerSettings();
});