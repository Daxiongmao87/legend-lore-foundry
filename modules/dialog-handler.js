// dialog-handler.js
export const dialogHandler = {
    openContextDialog: async function(highlightedText, journalEntryId, originalTitle, originalContent) {
        // Fetch the journal entry to get its name and current content for additional context
        const journalEntry = game.journal.get(journalEntryId);
        if (!journalEntry) {
            console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
            return;
        }
        const journalEntryName = journalEntry.name;

        // Load the dialog HTML from the provided template path
        const dialogTemplate = await renderTemplate('modules/5e-gpt-populator/templates/context-dialog.html', {});

        // Create and render a new dialog
        let d = new Dialog({
            title: `Additional Context for "${highlightedText}"`,
            content: dialogTemplate,
            buttons: {
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            render: (html) => {
                const form = html.find('form');
                form.on('submit', async (event) => {
                    event.preventDefault();
                    html.find('#loading-indicator').show();
                    form.find('input, textarea, button, a').prop('disabled', true);
                    html.find('.dialog-buttons button').prop('disabled', true);

                    const additionalContext = html.find('#additional-context').val();

                    // Call the function to process the GPT request
                    await processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId);

                    html.find('#loading-indicator').hide();
                    form.find('input, textarea, button, a').prop('disabled', false);
                    html.find('.dialog-buttons button').prop('disabled', false);

                    d.close();
                });

                html.find('#additional-context').focus();
            },
            default: "cancel"
        }).render(true);
    },

    // Additional dialog-related functions
};

// You may need to define other functions referenced in this module or ensure they are accessible
