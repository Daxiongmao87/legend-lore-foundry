import { processGPTRequest } from "./api.js";
// Functions related to UI manipulation like tooltips, dialogs, etc.
export async function openContextDialog(highlightedText, journalEntryId, originalTitle, originalContent) {
    // Fetch the journal entry to get its name and current content for additional context
    const journalEntry = game.journal.get(journalEntryId);
    if (!journalEntry) {
      console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
      return;
    }
    const journalEntryName = journalEntry.name; // Get the name of the JournalEntry

    console.log(`Opening context dialog for: ${highlightedText} within Journal Entry: ${journalEntryName}`);

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
        // Find the form submission within the dialog and handle it
        const form = html.find('form');
        form.on('submit', async (event) => {
          event.preventDefault();

          // Show the loading indicator and disable the form elements while processing
          html.find('#loading-indicator').show();
          form.find('input, textarea, button, a').prop('disabled', true); // Disable buttons and links as well
          html.find('.dialog-buttons button').prop('disabled', true);

          // Extract the additional context value from the form
          const additionalContext = html.find('#additional-context').val();

          // Process the GPT request with the extracted additional context
          await processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId);

          // After processing, hide the loading indicator and re-enable form elements
          html.find('#loading-indicator').hide();
          form.find('input, textarea, button, a').prop('disabled', false);
          html.find('.dialog-buttons button').prop('disabled', false);

          d.close(); // Close the dialog
        });

        // Set initial focus to the textarea
        html.find('#additional-context').focus();
      },
      default: "cancel"
    }).render(true);
  }
