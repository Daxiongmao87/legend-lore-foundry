import { openDialog } from './uiHelpers.js';
class AIJournalSheet{
    constructor (options = {}) {
        this.options = options;
        this.renderButton()
    }
    renderButton() {
        const prevButton = this.options.html.find('[data-action="previous"]');
        const nextButton = this.options.html.find('[data-action="next"]');
        prevButton.css("flex", "0 0 24px");
        nextButton.css("flex", "0 0 24px");
        const createButton = this.options.html.find('[data-action="createPage"]');
        createButton.css("margin", "0.5rem 0.25rem")
        const genButton = $(document.createElement("button"));
        genButton.addClass("generate");
        genButton.attr('data-action', 'generate');
        genButton.css("margin", "0.5rem 0.25rem");
        genButton.append('<i class="fa-solid fa-wand-sparkles"></i> Generate Page');
        genButton.click({html: this.options.html}, this.openGenerateDialog);
        createButton.after(genButton);
    }
    openGenerateDialog(options = {}) {
        const journalEntryElement = options.data.html[0];
        console.log(journalEntryElement);
        const idParts = journalEntryElement.id.split('-');
        const journalEntryIdIndex = idParts.findIndex(part => part === 'JournalEntry') + 1;
        const journalEntryId = idParts[journalEntryIdIndex];
        openDialog({
            type: "generate",
            journalEntryId: journalEntryId, 
        });
    }
}

Hooks.on('renderJournalSheet', (app, html, data) => {
    const aiJournalSheet = new AIJournalSheet({
        app: app,
        html: html,
        data: data
    })
  });