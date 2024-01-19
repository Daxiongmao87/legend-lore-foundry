// Functions related to managing journal entries
export async function createNewJournalEntryPage(journalEntryId, pageName, highlightedText, originalContent, pageContent) {
    // Fetch the existing JournalEntry to which the new page will be added
    let journalEntry = game.journal.get(journalEntryId);
    if (!journalEntry) {
      console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
      return;
    }

    // Determine the sort order for the new page
    // Use the JournalEntry's pages and getNextSortOrder() if available, or default back to a manual calculation
    let sortValue;
    if (typeof journalEntry.getNextSortOrder === "function") {
      // If Foundry provides a helper function to get the next sort value, use it
      sortValue = journalEntry.getNextSortOrder();
    } else {
      // Calculate sort manually if no helper function is available
      const pages = journalEntry.pages.contents; // 'contents' may need to be accessed depending on the structure in v11
      sortValue = pages.length ? (pages[pages.length - 1].sort + CONST.SORT_INTEGER_DENSITY) : 0;
    }
    // Prepare the data object for the new page
    let data = {
      name: pageName || "New Page",
      // Adjust this structure to match the new expected format
      text: { content: pageContent || "" },
      sort: sortValue,
      parent: journalEntry.id
    };
    console.log('Data object for new JournalEntryPage:', data);
    // Check whether the user has the necessary permissions to create the journal page
    if (!game.user.can("JOURNAL_CREATE")) {
      ui.notifications.warn("You do not have permission to create new journal pages.");
      return;
    }

    // Create the new JournalEntryPage
  try {
      // The `createdPage` variable holds the newly created page document
      let createdPage = await JournalEntryPage.create(data, {parent: journalEntry});
      console.log(`New page created with ID: ${createdPage.id}`);
      // Replace highlighted text in original content with UUID
      
      let updatedContent = replaceHighlightedTextInContent(highlightedText, createdPage.id, originalContent);

      // Update the editor's content
      updateEditorContent(updatedContent);

      // Save the changes
      //saveEditorChanges();

      // Allow a brief delay for the UI to update before attempting navigation
      /*
      setTimeout(() => {
        // Call the journal entry's sheet method to switch to the new page
        if (journalEntry.sheet?.goToPage) {
          journalEntry.sheet.goToPage(createdPage.id);
        } else {
          console.warn(`Could not switch to the new page with ID: ${createdPage.id}`);
        }
      }, 100);
      */
      // Return the createdPage to enable chaining or further processing if needed
      return createdPage;
    } catch (error) {
      console.error(`Error creating new JournalEntryPage:`, error);
      return null;
    }
  }

function replaceHighlightedTextInContent(originalText, pageUUID, content) {
    let replacementText = `@UUID[.${pageUUID}]{${originalText}}`;
    
    return content.split(originalText).join(replacementText);
}


function updateEditorContent(updatedContent) {
    let editorContentDiv = document.querySelector('.editor-content.journal-page-content.ProseMirror');
    if(editorContentDiv) {
        editorContentDiv.innerHTML = updatedContent;
    } else {
        console.error('Editor content div not found');
    }
}

function saveEditorChanges() {
    let saveButton = document.querySelector('button[data-action="save"]');
    if(saveButton) {
        saveButton.click();
    } else {
        console.error('Save button not found');
    }
}
