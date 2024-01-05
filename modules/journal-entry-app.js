// journal-entry-app.js
export const journalEntryApp = {
    generateJournalEntry: async function(highlightedText, journalEntryId, processGPTRequest) {
        console.log(`Preparing to generate entry for: ${highlightedText}`);

        // Fetch the existing JournalEntry for context
        const journalEntry = game.journal.get(journalEntryId);
        if (!journalEntry) {
            console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
            return;
        }

        let originalContent = journalEntry.content; // Or however the content is accessed
        let originalTitle = journalEntry.name; // Assuming the title is directly accessible

        // Call the dialog handler to open the context dialog
        // Assuming dialogHandler is globally accessible or passed as a parameter
        dialogHandler.openContextDialog(highlightedText, journalEntryId, originalTitle, originalContent, processGPTRequest);
    },

    handleHighlightedText: function(editorView, processGPTRequest) {
        // Extract highlighted text from the ProseMirror editor
        const { from, to } = editorView.state.selection;
        const highlightedText = editorView.state.doc.textBetween(from, to);

        // Determine the journal entry ID (the context in which the editor is used)
        const closestJournalEntryElement = editorView.dom.closest('[id*=JournalEntry]');
        let journalEntryId = null;
        if (closestJournalEntryElement && closestJournalEntryElement.id) {
            const idParts = closestJournalEntryElement.id.split('-');
            const journalEntryIdIndex = idParts.findIndex(part => part === 'JournalEntry') + 1;
            journalEntryId = idParts[journalEntryIdIndex];
        }

        if (journalEntryId) {
            this.generateJournalEntry(highlightedText, journalEntryId, processGPTRequest);
        } else {
            console.error('Journal entry ID could not be determined.');
        }
    },

    // Additional journal entry related functions...
};

// Ensure that the necessary functions from other modules are accessible in the context where journalEntryApp functions are called.
