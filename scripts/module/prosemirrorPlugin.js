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
                        // Call the original update function
                        await originalUpdate(view, lastState);

                        // If there's NO highlighted text, remove the tooltip
                        if (view.state.selection.content().size === 0) {
                            if (this.tooltip) {
                                this.tooltip.remove();
                                this.tooltip = null;
                            }
                            return; // Stop here, nothing to show
                        }

                        // If we have highlighted text, proceed
                        const selection = window.getSelection();
                        if (selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0);
                            const rect = range.getBoundingClientRect();
                            const left = (rect.left + 3) + "px";
                            const bottom = (window.innerHeight - rect.bottom + 25) + "px";
                            const position = { bottom, left };

                            const { from, to } = view.state.selection;
                            const highlightedText = view.state.doc.textBetween(from, to);
                            const safeHighlightedText = highlightedText.replace(/'/g, "\\'");

                            const characterLimit = 42;
                            const displayedText = highlightedText.length > characterLimit
                                ? highlightedText.substring(0, characterLimit) + '...'
                                : highlightedText;
                            const closestJournalEntryElement = editorView.dom.closest('[id*=JournalEntry]');
                            let journalEntryId = null;
                            if (closestJournalEntryElement && closestJournalEntryElement.id) {
                                const idParts = closestJournalEntryElement.id.split('-');
                                const journalEntryIdIndex = idParts.findIndex(part => part === 'JournalEntry') + 1;
                                journalEntryId = idParts[journalEntryIdIndex];
                            }

                            const gptGenerateButtonContent = `
                                <section class="section-legend-lore-highlight-background">
                                    <h4 class="section-legend-lore-highlight-label">Legend Lore</h4>
                                    <button class="generate-entry-link content-link content-link-legend-lore" onclick="generateEntryForText('${safeHighlightedText}', '${journalEntryId}'); return false;">
                                        <i class="fas fa-wand-sparkles"></i>Generate Entry for <strong><u>${displayedText}</u></strong>
                                    </button>
                                </section>
                            `;

                            // Function to handle AI content generation
                            window.generateEntryForText = function(highlightedText, journalEntryId) {
                                let originalContent = new DOMParser().parseFromString(
                                    editorView.dom.outerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>'),
                                    'text/xml'
                                );
                                let originalTitle = $(editorView.dom).closest('.editable.flexcol').find('[name="name"]').value;
                                openDialog({
                                    type: "context",
                                    highlightedText: highlightedText,
                                    journalEntryId: journalEntryId,
                                    originalTitle: originalTitle,
                                    originalContent: originalContent
                                });
                                //destroy the element that matches 'locked-tooltip active link-matches link-matches-legend-lore' classes
                                let lockedTooltip = document.querySelector('.locked-tooltip.active.link-matches.link-matches-legend-lore');
                                if (lockedTooltip) {
                                    lockedTooltip.remove();
                                }
                            };
                            if (this.tooltip && this.tooltip.classList.contains('link-matches-legend-lore')) {
                                this.tooltip.innerHTML = gptGenerateButtonContent; // Overwrite content
                            } else {
                                // Create a new tooltip with the custom class added
                                this._createTooltip(position, gptGenerateButtonContent, { cssClass: "link-matches link-matches-legend-lore" });
                                this.tooltip.style.borderImage = "var(--legend-lore-color-silver) 1";
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

