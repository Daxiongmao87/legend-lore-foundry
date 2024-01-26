import { openDialog } from './uiHelpers.js';

/**
 * This class represents a sheet within the AI Journal which allows
 * manipulation of journal entries through an enhanced user interface.
 */
class AIJournalSheet {
    /**
     * Constructs a new AI Journal Sheet object.
     * @param {Object} [options={}] - Configuration options for the journal sheet.
     */
    constructor (options = {}) {
        this.options = options;
        this.renderButton();
    }

    /**
     * Renders an additional button on the journal sheet to generate new pages.
     */
    renderButton() {
        const prevButton = this.options.html.find('[data-action="previous"]');
        const nextButton = this.options.html.find('[data-action="next"]');
        prevButton.css("flex", "0 0 24px");
        nextButton.css("flex", "0 0 24px");

        const createButton = this.options.html.find('[data-action="createPage"]');
        createButton.css("margin", "0.5rem 0.25rem");

        const genButton = $(document.createElement("button"));
        genButton.addClass("generate");
        genButton.attr('data-action', 'generate');
        genButton.css("margin", "0.5rem 0.25rem");
        genButton.append('<i class="fa-solid fa-wand-sparkles"></i> Generate Page');
        genButton.click({html: this.options.html}, this.openGenerateDialog);
        createButton.after(genButton);
    }

    /**
     * Opens a dialog to generate new content for a journal entry.
     * @param {Object} [options={}] - The options containing HTML and other data for dialog generation.
     */
    openGenerateDialog(options = {}) {
        const journalEntryElement = options.data.html[0];

        const idParts = journalEntryElement.id.split('-');
        const journalEntryIdIndex = idParts.findIndex(part => part === 'JournalEntry') + 1;
        const journalEntryId = idParts[journalEntryIdIndex];

        openDialog({
            type: "generate",
            journalEntryId: journalEntryId,
        });
    }
}

/**
 * Hook that is called when a Journal Sheet is rendered. It instantiates an AIJournalSheet
 * and attaches it to the rendered sheet for additional functionality.
 * @param {Application} app - The application representing the journal sheet.
 * @param {JQuery} html - The JQuery element representing the HTML content of the journal sheet.
 * @param {Object} data - The data object relevant to the journal sheet.
 */
Hooks.on('renderJournalSheet', (app, html, data) => {
    new AIJournalSheet({
        app: app,
        html: html,
        data: data
    });
});
