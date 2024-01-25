import { openDialog } from './uiHelpers.js';
/**
 * Hook that extends the ProseMirror editor in Foundry VTT. It modifies the ProseMirrorHighlightMatchesPlugin
 * to add custom functionality, such as tooltips and options for AI content generation.
 */
Hooks.once('ready', () => {
    const originalBuild = window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build;
    /**
     * Builds a modified version of the ProseMirrorHighlightMatchesPlugin for the editor.
     * This custom build adds additional functionality for handling highlighted text and integrating AI content generation.
     * @param {Object} schema - The schema of the editor.
     * @param {Object} [options={}] - Options for the plugin.
     * @returns {Object} The modified ProseMirrorHighlightMatchesPlugin.
     */
    window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build = function (schema, options = {}) {
        const originalPlugin = originalBuild.call(window.ProseMirror.ProseMirrorHighlightMatchesPlugin, schema, options);
        const originalView = originalPlugin.spec.view;
        if (typeof originalView === 'function') {
            originalPlugin.spec.view = (editorView) => {
                const tooltipInstance = originalView(editorView);
                if (typeof tooltipInstance.update === 'function') {
                    const originalUpdate = tooltipInstance.update.bind(tooltipInstance);
                    tooltipInstance.update = async function(view, lastState) {
                    const state = view.state;
                    const { from } = state.selection;
                    const start = view.coordsAtPos(from);
                    const left = (start.left + 3) + "px";
                    const bottom = (window.innerHeight - start.bottom + 25) + "px";
                    const position = { bottom, left };
                    await originalUpdate(view, lastState);
                    if (view.state.selection.content().size > 0){
                        const { from, to } = view.state.selection;
                        const highlightedText = view.state.doc.textBetween(from, to);
                        const safeHighlightedText = highlightedText.replace(/'/g, "\\'");
                        const closestJournalEntryElement = editorView.dom.closest('[id*=JournalEntry]');
                        let journalEntryId = null;
                        if (closestJournalEntryElement && closestJournalEntryElement.id) {
                            const idParts = closestJournalEntryElement.id.split('-');
                            const journalEntryIdIndex = idParts.findIndex(part => part === 'JournalEntry') + 1;
                            journalEntryId = idParts[journalEntryIdIndex];
                        }
                        const gptGenerateButtonContent = `
                            <section style="background-color:gold;">
                                <h4 style="color:black;">Legend Lore</h4>
                                <a class="generate-entry-link content-link" onclick="generateEntryForText('${safeHighlightedText}', '${journalEntryId}'); return false;">
                                    <i class="fas fa-wand-sparkles"></i>Generate Entry for ${highlightedText}
                                </a>
                            </section>
                        `;
                    /**
                     * Generates a new journal entry or content for the highlighted text in the ProseMirror editor.
                     * This function is invoked when the user interacts with the custom tooltip added to the editor.
                     * @param {string} highlightedText - The text highlighted by the user in the editor.
                     * @param {string} journalEntryId - The ID of the journal entry associated with the highlighted text.
                     */
                    window.generateEntryForText = function(highlightedText, journalEntryId) {
                        let originalContent = new DOMParser().parseFromString(editorView.dom.outerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>'), 'text/xml');
                        let originalTitle = $(editorView.dom).closest('.editable.flexcol').find('[name="name"').value;
                        openDialog({
                            type: "context",
                            highlightedText: highlightedText, 
                            journalEntryId: journalEntryId, 
                            originalTitle: originalTitle, 
                            originalContent: originalContent
                        });
                    };
                    if (this.tooltip) {
                        this.tooltip.innerHTML += gptGenerateButtonContent;
                    } else {
                        this._createTooltip(position, gptGenerateButtonContent, {cssClass: "link-matches"});
                    }
                    }
                };
                }
                return tooltipInstance;
            };
        }
        return originalPlugin;
    };
});
