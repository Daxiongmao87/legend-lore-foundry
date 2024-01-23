import { openDialog } from './uiHelpers.js';
Hooks.once('ready', () => {
    const originalBuild = window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build;

    // Modify ProseMirrorHighlightMatchesPlugin
    window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build = function (schema, options = {}) {
        console.log("legend-lore | ProseMirrorHighlightMatchesPlugin build method called.");
        
        const originalPlugin = originalBuild.call(window.ProseMirror.ProseMirrorHighlightMatchesPlugin, schema, options);

        // Wrap the view function located under the spec object
        const originalView = originalPlugin.spec.view;
        if (typeof originalView === 'function') {
            originalPlugin.spec.view = (editorView) => {
                console.log("legend-lore | Custom view method called.");

                // Get the original tooltip instance
                const tooltipInstance = originalView(editorView);

                // Override the update method of the tooltip instance
                if (typeof tooltipInstance.update === 'function') {
                    const originalUpdate = tooltipInstance.update.bind(tooltipInstance);
                    tooltipInstance.update = async function(view, lastState) {
                    console.log("legend-lore | Custom update method called.");

                    // Capture the initial position of the selection
                    const state = view.state;
                    const { from } = state.selection;
                    const start = view.coordsAtPos(from);
                    const left = (start.left + 3) + "px";
                    const bottom = (window.innerHeight - start.bottom + 25) + "px";
                    const position = { bottom, left };

                    // Continue with the original update logic and see if it creates a tooltip.
                    await originalUpdate(view, lastState);
                    if (view.state.selection.content().size > 0){
                        console.log(view.state.selection);
                        //const highlightedText = view.state.selection.content().content.textBetween(0, view.state.selection.content().size);
                        const { from, to } = view.state.selection;
                        const highlightedText = view.state.doc.textBetween(from, to);

                        // Escape single quotes (') to avoid ending the HTML attribute string prematurely.
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
                    
                    window.generateEntryForText = function(highlightedText, journalEntryId) {
                        console.log(`legend-lore | Preparing to generate entry for: ${highlightedText}`);
                        console.log(editorView.dom);
                        console.log(editorView.dom.outerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>'));
                        let originalContent = new DOMParser().parseFromString(editorView.dom.outerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>'), 'text/xml');
                        let originalTitle = $(editorView.dom).closest('.editable.flexcol').find('[name="name"').value;
                        // Pass only the highlighted text and journal entry ID
                        openDialog({
                            type: "context",
                            highlightedText: highlightedText, 
                            journalEntryId: journalEntryId, 
                            originalTitle: originalTitle, 
                            originalContent: originalContent
                        });
                    };
                    // Check if the original update method resulted in an active tooltip.
                    if (this.tooltip) {
                        // The original update method created or found an existing tooltip, now append the dummy content.
                        console.log("legend-lore | Adding dummy content to existing tooltip.");
                        this.tooltip.innerHTML += gptGenerateButtonContent;
                    } else {
                        // The original function did not create a tooltip, so let's create one now with the dummy content.
                        console.log("legend-lore | Creating a new tooltip with dummy content.");
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
