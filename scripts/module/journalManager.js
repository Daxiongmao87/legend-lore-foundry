import { log } from './utils.js';
/**
 * Creates a new journal entry page in Foundry VTT.
 * @param {Object} options - Options for the new journal entry page.
 * @param {string} options.type - The type of the journal entry.
 * @param {string} options.journalEntryId - The ID of the journal entry.
 * @param {string} [options.pageName] - The name of the new journal page.
 * @param {string} [options.highlightedText] - Text highlighted by the user for the journal entry.
 * @param {Object} [options.originalContent] - The original content of the journal entry.
 * @param {string} [options.pageContent] - The content of the new journal page.
 * @returns {Promise<Object|null>} A promise that resolves to the newly created journal entry page or null in case of failure.
 */
export async function createNewJournalEntryPage(options = {
  type,
  journalEntryId, 
  pageName, 
  highlightedText, 
  originalContent, 
  pageContent
  }) {
    const type = options.type;
    const journalEntryId = options.journalEntryId;
    const pageName = options.pageName;
    const highlightedText = options.highlightedText;
    const originalContent = options.originalContent;
    const pageContent = options.pageContent;
    let journalEntry = game.journal.get(journalEntryId);
    if (!journalEntry) {
      log({
        message: `Could not find JournalEntry with ID: ${journalEntryId}`,
        display: ["console", "ui"],
        type: ["error"]
    });
      return;
    }
    let sortValue;
    if (typeof journalEntry.getNextSortOrder === "function") {
      sortValue = journalEntry.getNextSortOrder();
    } else {
      const pages = journalEntry.pages.contents; 
      sortValue = pages.length ? (pages[pages.length - 1].sort + CONST.SORT_INTEGER_DENSITY) : 0;
    }
    let data = {
      name: pageName || "New Page",
      text: { content: pageContent || "" },
      sort: sortValue,
      parent: journalEntry.id
    };
    ('Data object for new JournalEntryPage:', data);
    if (!game.user.can("JOURNAL_CREATE")) {
      log({
        message: `You do not have permission to create new journal pages.`,
        display: ["console", "ui"],
        type: ["warn"]
      });
      return;
    }
  try {
      let createdPage = await JournalEntryPage.create(data, {parent: journalEntry});
      log(`New page created with ID: ${createdPage.id}`);
      let updatedContent = replaceHighlightedTextInContent(highlightedText, createdPage.id, originalContent);
      updateEditorContent(updatedContent);
      return createdPage;
    } catch (error) {
      log({
        message: `Error creating new JournalEntryPage.`,
        error: error,
        display: ["console", "ui"],
        type: ["error"]
      });
      return null;
    }
  }
/**
 * Replaces the highlighted text in the content with a reference to the new journal entry page.
 * @param {string} originalText - The original text to be replaced.
 * @param {string} pageUUID - The UUID of the new journal entry page.
 * @param {string} content - The content in which the text replacement will occur.
 * @returns {string} The updated content with the replaced text.
 */
function replaceHighlightedTextInContent(originalText, pageUUID, content) {
    let replacementText = `@UUID[.${pageUUID}]{${originalText}}`;
    return content.split(originalText).join(replacementText);
}
/**
 * Updates the content of the ProseMirror editor with the given content.
 * @param {string} updatedContent - The updated content to set in the editor.
 */
function updateEditorContent(updatedContent) {
    let editorContentDiv = document.querySelector('.editor-content.journal-page-content.ProseMirror');
    if(editorContentDiv) {
        editorContentDiv.innerHTML = updatedContent;
    } else {
        log({
          message: `Editor content div not found`,
          display: ["console", "ui"],
          type: ["error"]
        });
    }
}
