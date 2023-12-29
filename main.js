Hooks.once('init', async function() {
    console.log('5e GPT Populator | Initializing');
    // Register settings
    game.settings.register('5e-gpt-populator', 'openaiApiKey', {
        name: "OpenAI API Key",
        hint: "Enter your OpenAI API key here.",
        scope: 'world',
        config: true,
        default: '',
        type: String
    });

    // Load templates
    await loadTemplates([
	    'templates/settings.html',
	    'templates/context-dialog.html'
    ]);
});

// Function to open the context dialog
async function openContextDialog() {
    const template = 'templates/context-dialog.html';
    const html = await renderTemplate(template, {});

    new Dialog({
        title: "Additional Context",
        content: html,
        buttons: {
            ok: {
                label: "Generate",
                callback: (html) => {
                    // Logic to handle generation
                }
            }
        },
        default: "ok"
    }).render(true);
}

// Hook into the rendering of JournalSheet
Hooks.on('renderJournalSheet', (journalSheet, html, data) => {
    // Add a mouseup event listener to the journal entry content
    html.find('.journal-entry-content').mouseup(async (event) => {
        const selectedText = window.getSelection().toString();

        // Check if the selected text is non-empty
        if (selectedText.trim().length > 0) {
            // Modify the tooltip to add your custom option
            await modifyTooltipForGPT(selectedText);
        }
    });
});

// Function to modify the tooltip to include an option for GPT generation
async function modifyTooltipForGPT(selectedText) {
    const tooltip = document.querySelector(/* selector for the tooltip element */);

    if (tooltip && !tooltip.querySelector('.gpt-option')) {
        const gptOption = document.createElement('button');
        gptOption.className = 'gpt-option';
        gptOption.textContent = 'Generate with GPT';
        gptOption.onclick = (event) => {
            event.stopPropagation(); // Prevent tooltip from closing
            handleGPTGeneration(selectedText);
        };
        tooltip.appendChild(gptOption);
    }
}

// Function to handle the GPT generation process
function handleGPTGeneration(selectedText) {
    // Implement the logic to use GPT for content generation
    // This could involve opening a dialog for additional context,
    // sending data to the GPT API, etc.
    // ...
}


