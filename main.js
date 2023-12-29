Hooks.once('ready', async function() {
    console.log('5e GPT Populator | Initializing');
    // Register settings
    game.settings.register('5e-gpt-populator', 'openaiApiKey', {
        name: "OpenAI API Key",
        hint: "Enter your OpenAI API key here.",
        scope: 'world',
        config: true,
        default: '',
        type: String
    });

    // Load templates
    await loadTemplates([
	    'templates/settings.html',
	    'templates/context-dialog.html'
    ]);
});

// Function to open the context dialog
async function openContextDialog() {
    const template = 'templates/context-dialog.html';
    const html = await renderTemplate(template, {});

    new Dialog({
        title: "Additional Context",
        content: html,
        buttons: {
            ok: {
                label: "Generate",
                callback: (html) => {
                    // Logic to handle generation
                }
            }
        },
        default: "ok"
    }).render(true);
}

// Hook into the rendering of JournalSheet
Hooks.on('renderJournalSheet', (journalSheet, html, data) => {
    // Add a mouseup event listener to the journal entry content
    html.find('.journal-entry-content').mouseup(async (event) => {
        const selectedText = window.getSelection().toString();

        // Check if the selected text is non-empty
        if (selectedText.trim().length > 0) {
            // Modify the tooltip to add your custom option
            await modifyTooltipForGPT(selectedText);
        }
    });
});

// Function to handle the GPT generation process
function handleGPTGeneration(selectedText) {
    // Implement the logic to use GPT for content generation
    // This could involve opening a dialog for additional context,
    // sending data to the GPT API, etc.
    // ...
}

// Assuming PossibleMatchesTooltip is accessible

// Function to create the aside element
function createAsideElement() {
    // Create the H4 element with text
    const h4 = document.createElement('h4');
    h4.textContent = 'GPT';

    // Create the section element and append the H4 to it
    const section = document.createElement('section');
    section.appendChild(h4);

    // Create the aside element with the appropriate classes
    const aside = document.createElement('aside');
    aside.className = 'locked-tooltip active link-matches';
    aside.appendChild(section);

    // Insert the aside into the document, for example within the current div.
    // You may want to add logic here to place the `aside` at a specific location.
    return aside;
}

// Function to get the selected text
function getSelectedText() {
    if (window.getSelection) {
        return window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        return document.selection.createRange().text;
    }
    return '';
}

// Get the div element with multiple classes
const editorDiv = document.querySelector('div.editor-content.journal-page-content.ProseMirror');

// Check if the element exists to avoid errors
if (editorDiv) {
    editorDiv.addEventListener('mouseup', function(event) {
        const selectedText = getSelectedText();
        if (selectedText) { // Check if there's a selected text
            console.log('User selected text:', selectedText);
            // Remove any existing asides
            const existingAside = document.querySelector('aside.locked-tooltip.active.link-matches');
            if (existingAside) {
                existingAside.remove();
            }
            // Append the new aside element to the div or other location
            const asideElement = createAsideElement();
            // You can change where you want the aside to appear depending on your requirements
            // For instance, appending to the editor div
            editorDiv.appendChild(asideElement);
            // Or insert before or after the editor div
            // editorDiv.parentNode.insertBefore(asideElement, editorDiv.nextSibling);
        }
    });
} else {
    console.log('The editor div does not exist.');
}

// Logic to replace Foundry VTT's PossibleMatchesTooltip with MyPossibleMatchesTooltip
// This depends on how PossibleMatchesTooltip is instantiated and used within Foundry VTT

