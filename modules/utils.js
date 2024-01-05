// utilities.js
export const utils = {
    // Utility function for updating editor content
    updateEditorContent: function(updatedContent) {
        let editorContentDiv = document.querySelector('.editor-content.journal-page-content.ProseMirror');
        if (editorContentDiv) {
            editorContentDiv.innerHTML = updatedContent;
        } else {
            console.error('Editor content div not found');
        }
    },

    // Utility function for saving editor changes
    saveEditorChanges: function() {
        let saveButton = document.querySelector('button[data-action="save"]');
        if (saveButton) {
            saveButton.click();
        } else {
            console.error('Save button not found');
        }
    },

    // Utility function for replacing highlighted text in content
    replaceHighlightedTextInContent: function(originalText, pageUUID, content) {
        let replacementText = `@UUID[.${pageUUID}]{${originalText}}`;
        return content.split(originalText).join(replacementText);
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;

        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };

            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
};
