// settings.js
export const settingsManager = {
    registerSettings: function() {
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
            hint: "Select the GPT model for content generation.",
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
    },

    updateModelDropdown: async function(html) {
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

            const defaultModel = game.settings.get('5e-gpt-populator', 'model') || "gpt-3.5-turbo";
            await game.settings.register('5e-gpt-populator', 'model', {
                name: "Model",
                hint: "Select a model. For pricing information, see [OpenAI Pricing Link].",
                scope: 'world',
                config: true,
                type: String,
                choices: models,
                default: defaultModel
            });

            if (html) {
                const dropdown = html.find('[name="5e-gpt-populator.model"]');
                dropdown.empty();
                $.each(models, function(model) {
                    dropdown.append($("<option></option>")
                        .attr("value", model)
                        .text(model));
                });
                dropdown.val(defaultModel).change();
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    },
    // Additional settings related functions
};

