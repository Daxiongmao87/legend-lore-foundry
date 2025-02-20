import { processLLMRequest } from "./api.js"; import { createNewJournalEntryPage } from "./journalManager.js";
import { ElementHandler } from './elementTransformer.js';
import { log, jsonToSchema } from './utils.js';
/**
 * Opens a dialog in the Foundry VTT UI based on the provided options. This dialog is used for user interactions related to AI content generation.
 * @param {Object} options - The options for the dialog.
 * @param {string} options.type - The type of dialog to open (e.g., 'context', 'generate').
 * @param {string} [options.highlightedText] - The text highlighted in the editor, if applicable.
 * @param {string} [options.journalEntryId] - The ID of the journal entry associated with the dialog.
 * @param {string} [options.originalTitle] - The original title of the content related to the dialog.
 * @param {Object} [options.originalContent] - The original content of the journal entry or page.
 * @returns {Promise<void>} A promise that resolves when the dialog is rendered.
 */
export async function openDialog(options = {
  type,
  highlightedText,
  journalEntryId,
  originalTitle,
  originalContent
}) {
  const type = options.type;
  const journalEntryId = options.journalEntryId;
  const journalEntry = game.journal.get(journalEntryId);
  let journalEntryName;
  if (journalEntry) {
    journalEntryName = journalEntry.name;
  }
  let dialogTitle, dialogTemplate, highlightedText, originalTitle, originalContent, contextName, contextPlaceholder;
  if (type === "context") {
    highlightedText = options.highlightedText;
    originalTitle = options.originalTitle;
    originalContent = options.originalContent;
    contextName = "Additional Context";
    contextPlaceholder = "OPTIONAL: Add any additional information or instruction for the AI model to consider.";
    dialogTitle = `Additional Context for "${highlightedText}"`;
  } else if (type === "generate") {
    dialogTitle = `Generate New Journal Entry Page`;
    contextName = "Generation Context";
    contextPlaceholder = "REQUIRED: Add information or instruction for the AI model to use as inspiration for generating this entry.";
  }
  dialogTemplate = await renderTemplate('modules/legend-lore/templates/dialog.html', {
    contextName: contextName,
    contextPlaceholder: contextPlaceholder
  });
  let d = new Dialog({
      title: dialogTitle,
      content: dialogTemplate,
      buttons: {
        accept: {
          icon: '<i class="fas fa-check"></i>',
          label: "Accept",
          disabled: true,
          callback: (html) => {
            let selectedJournalId = html.find('.journal-entry-dropdown').val();
            createNewJournalEntryPage({
                type: type,
                journalEntryId: selectedJournalId,
                pageName: html.find(".legend-lore.entry-title")[0].value,
                highlightedText: highlightedText,
                originalContent: originalContent,
                pageContent: html.find(".legend-lore.generation-preview").html()
            });
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "cancel",
      render: async (html) => dialogHelper({
        html: html,
        type: type,
        model: html.find('#llm-model').val(),
        highlightedText: highlightedText,
        journalEntryName: journalEntryName,
        originalTitle: originalTitle,
        originalContent: originalContent,
        journalEntryId: journalEntryId
      })
    }).render(true, {
      width: 800
    });
  }
/**
 * Helper function to set up interactive elements within the dialog, such as dropdowns and buttons, and to handle their events.
 * @param {Object} options - Options and elements for the dialog.
 * @param {JQuery} options.html - The jQuery object representing the HTML of the dialog.
 * @param {string} options.type - The type of dialog.
 * @param {string} [options.highlightedText] - Highlighted text for the dialog context.
 * @param {string} [options.pageName] - The name of the journal page.
 * @param {string} [options.journalEntryName] - The name of the journal entry.
 * @param {string} [options.originalTitle] - The original title of the content.
 * @param {Object} [options.originalContent] - The original content of the journal entry or page.
 * @param {string} [options.journalEntryId] - The ID of the journal entry.
 */
async function dialogHelper(options = {
  html,
  type,
  highlightedText,
  pageName,
  journalEntryName,
  originalTitle,
  originalContent,
  journalEntryId
}) {
  await populateJournalDropdown(options.journalEntryId);
  $(options.html[2]).prepend('<button class="dialog-button generate"><i class="fas fa-wand-sparkles"></i> Generate</button>');
  const generateButton = options.html.find(".dialog-button.generate");
  const acceptButton = options.html.find(".dialog-button.accept");
  const contextField = options.html.find(".context");
  const titleField = options.html.find(".entry-title");
  titleField.on("input", () => {
    generateButton.prop("disabled",(!(contextField.val() && titleField.val())));
  });
  if(options.type === "generate") {
    generateButton.prop("disabled",true);
    contextField.on("input", () => {
      generateButton.prop("disabled",(!(contextField.val() && titleField.val())));
    });
  }
  const contentPreview = options.html.find(".generation-preview");
  contentPreview.on("change", () => {
    if ( contentPreview.innerHTML != "Pending Generation") {
    }
  });
  options.html.find(".legend-lore.entry-title").val(options.highlightedText);
  generateButton.click(function() {
      handleGenerate(options = {
        html: options.html,
        type: options.type,
        highlightedText: options.highlightedText,
        journalEntryName: options.journalEntryName,
        originalTitle: options.originalTitle,
        globalContext: (options.html.find('.global-context')[0].value) ? game.settings.get('legend-lore','globalContext') : '',
        originalContent: (options.html.find('.originating-content')[0].value) ? options.originalContent : '',
        journalEntryId: options.journalEntryId
      });
  });
  $(options.html).find('#entry-template').on('change', function() {
    if (this.value === "null" ) {
      resetPreviewStyle("template-preview");
    }
    else {
      updateTemplatePreview(this.value);
    }
  });
  populateJournalEntryTemplates();
  populateModels();
}
/**
 * Resets the style of the preview element in the dialog to its default state.
 * @param {string} previewName - The name of the preview element to reset.
 */
function resetPreviewStyle(previewName) {
  $(`.legend-lore.${previewName}`).empty();
  $(`.legend-lore.${previewName}`).html(`
  <p>[Provide, with context to the original content, a brief introduction to the subject, including its basic definition, nature, and overall significance or relevance in the context it is being addressed.]</p>
<h2>General Description</h2>
<p>[Offer, with context to the original content, a general description of the subject, focusing on its key characteristics, features, or aspects. This section should lay the foundation for understanding the subject's uniqueness and importance.]</p>
  `);
}
/**
 * Updates the style of the preview element in the dialog.
 * @param {string} previewName - The name of the preview element to update.
 */
function updatePreviewStyle(previewName) {
  $(`.legend-lore.${previewName}`).removeAttr( 'style' );
  $(`.legend-lore.${previewName}`).css ('height', '184px');
  $(`.legend-lore.${previewName}`).css ('padding-left', '8px');
  $(`.legend-lore.${previewName}`).css ('padding-right', '8px');
}
/**
 * Updates the template preview in the dialog with content from a selected journal entry.
 * @param {string} journalDataString - A JSON string representing the selected journal entry data.
 */
async function updateTemplatePreview(journalDataString) {
    updatePreviewStyle("template-preview");
    const journalData = JSON.parse(journalDataString);
    const templateContent = await getJournalEntryPages(journalData.pack, journalData.journalEntryName, journalData.journalEntryPageName);
    $('.legend-lore.template-preview').html(templateContent.text.content);
}
/**
 * Populates the journal entry template dropdown in the dialog with entries from the selected compendiums.
 */
async function populateJournalEntryTemplates() {
  const compendiumNames = game.settings.get('legend-lore', 'journalEntryTemplates');
  const dropdown = document.getElementById("entry-template");
  clearDropdownOptions(dropdown);
  for (const compendiumName of compendiumNames) {
      const journalEntries = await getJournalEntriesFromCompendium(compendiumName);
      for (const journalEntry of journalEntries) {
          const pages = await getJournalEntryPages(compendiumName, journalEntry.name);
          if (pages && pages.size > 0) {
              addPagesToDropdown(pages, journalEntry, dropdown);
          }
      }
  }
}
/**
 * Clears all options from a specified dropdown element.
 * @param {HTMLElement} dropdown - The dropdown element to clear.
 */
function clearDropdownOptions(dropdown) {
  while (dropdown.options.length > 0) {
      dropdown.remove(0);
  }
  let option = document.createElement("option");
  option.value = "null";
  option.text = `Default`;
  dropdown.add(option);
}
/**
 * Adds journal entry pages to a dropdown element.
 * @param {Array} pages - An array of journal entry pages to add to the dropdown.
 * @param {Object} journalEntry - The journal entry associated with the pages.
 * @param {HTMLElement} dropdown - The dropdown element to which the pages will be added.
 */
function addPagesToDropdown(pages, journalEntry, dropdown) {
  for (const page of pages) {
      const option = document.createElement("option");
      option.value = JSON.stringify({
        pack: page.pack,
        journalEntryName: journalEntry.name,
        journalEntryPageName: page.name
      });
      option.text = `${journalEntry.name}: ${page.name}`;
      dropdown.add(option);
  }
}
/**
 * Retrieves journal entries from a specified compendium.
 * @param {string} compendiumName - The name of the compendium from which to retrieve entries.
 * @returns {Promise<Array>} A promise that resolves to an array of journal entries from the compendium.
 */
async function getJournalEntriesFromCompendium(compendiumName) {
  const compendium = game.packs.get(compendiumName);
  if (!compendium) {
      log({
        message: `Compendium not found: ${compendiumName}.`,
        display: ["console", "ui"],
        type: ["error"]
      })
      return [];
  }
  await compendium.getIndex();
  const journalEntries = [];
  for (const indexEntry of compendium.index) {
    const entry = await compendium.getDocument(indexEntry._id);
    journalEntries.push(entry);
  }
  return journalEntries;
}
/**
 * Retrieves pages of a specific journal entry from a compendium.
 * @param {string} compendiumName - The name of the compendium containing the journal entry.
 * @param {string} journalEntryName - The name of the journal entry for which to retrieve pages.
 * @param {string} [pageName] - The name of a specific page to retrieve (optional).
 * @returns {Promise<Object|null>} A promise that resolves to the journal entry pages or null if not found.
 */
async function getJournalEntryPages(compendiumName, journalEntryName, pageName) {
  const journalEntries = await getJournalEntriesFromCompendium(compendiumName);
  for (const journalEntry of journalEntries) {
    if (journalEntry.name == journalEntryName) {
      if (pageName) {
        return journalEntry.pages.find(page => page.name === pageName) || null;
      }
      return journalEntry.pages
    }
  }
}

/**
 * Handles the generation of AI content based on the user's input and selections in the dialog.
 * @param {Object} options - The options for content generation.
 */
async function handleGenerate(options = {
  html,
  type,
  highlightedText,
  journalEntryName,
  originalTitle,
  originalContent,
  globalContext,
  journalEntryId
}) {
    // Update the UI: disable form elements and change button state.
    const genButton = $(options.html).find(".dialog-button.generate")[0];
    genButton.innerHTML = `<i class="fas fa-spinner-third fa-spin"></i> Generating...`;
    // add a 'generating' class
    genButton.classList.add('generating');
    const formElements = $(options.html).find('input, textarea, button, a');
    formElements.prop('disabled', true);
    const model = $(options.html).find(".legend-lore.llm-model")[0].value;
    let entryTitle, contextInput, additionalContext;
    if(options.type === "context") {
      entryTitle = options.highlightedText;
      contextInput = JSON.stringify(ElementHandler.htmlToJson(options.originalContent.documentElement));
      additionalContext = $(options.html).find(".legend-lore.context")[0].value;
    } else if (options.type === "generate") {
    // Assemble the user input from title and context.
      entryTitle = $(options.html).find(".legend-lore.entry-title")[0].value;
      contextInput = $(options.html).find(".legend-lore.context")[0].value;
    }


    if(options.type === "context") {
    }

    // Get the content template as JSON from the HTML conversion.
    const contentTemplateObj = ElementHandler.htmlToJson($(options.html).find('.legend-lore.template-preview')[0]);
    // contentTemplateInstructions needs to include the journalEntryName, originalTitle, originalContent, and globalContext in a way that the LLM can understand.
    let contentTemplateInstructions = `
      Journal Name: ${options.journalEntryName},
      Journal Entry Title: ${entryTitle},
      Original Content: ${contextInput}`
    if (options.globalContext) {
      contentTemplateInstructions += `, Global Context: ${options.globalContext}`;
    }
    if (additionalContext) {
      contentTemplateInstructions += `, Additional Context: ${additionalContext}`;
    }
    contentTemplateInstructions+=`, JSON Format: ${JSON.stringify(contentTemplateObj)}`

   // JSON.stringify(contentTemplateObj);
    const contentTemplateSchema = JSON.stringify(jsonToSchema(contentTemplateObj));

    // Call processLLMRequest with userInput and contentTemplate.
    let data;
    data = await processLLMRequest({
        model: model,
        contentTemplateInstructions: contentTemplateInstructions,
        contentTemplateSchema: contentTemplateSchema
    });
    // If data returns an error, log it and update the UI.
    if (data.error) {
        log({
          message: data.error,
          type: ["error"],
          display: ["error", "ui"]
        });
        formElements.prop('disabled', false);
        genButton.classList.remove('generating');
        $(options.html).find(".dialog-button.generate")[0].innerHTML = `<i class="fas fa-spinner-third"></i> Generate`;
        return;
    }

    let text;
    try {
        // Expecting the response to be a JSON with an 'output' field.
        text = ElementHandler.jsonToHtml(data.responseJSON);
        console.log(text)
    } catch (error) {
        log({
          message:"Error parsing JSON response.",
          error: error,
          type: ["error"],
          display: ["error", "ui"]
        });
    }
    try {
        updateUIAfterResponse(options.html, text, data.tries, data.generationTime);
    } catch (error) {
        log({
          message: "Error updating UI after response.",
          error: error,
          type: ["error"],
          display: ["error", "ui"]
        });
    }
    formElements.prop('disabled', false);
    genButton.classList.remove('generating');
}


/**
 * Updates the UI after receiving a response from the LLM.
 * @param {JQuery} html - The jQuery object for the dialog.
 * @param {HTMLElement} returnedContent - The HTML element containing the generated content.
 * @param {Object} tokens - Token usage information.
 */
function updateUIAfterResponse(html, returnedContent, retryCount, generationTime) {
    updatePreviewStyle("generation-preview");
    $(html).find('.legend-lore.generation-preview').html(returnedContent.outerHTML);
    $(html).find('#retry-count').html(`<strong>Tries: ${retryCount}</strong>`);
    $(html).find('#generation-time').html(`<strong>Generation Time: ${generationTime}</strong>`);
    $(html).find('#response-container').show();
    $(html).find(".dialog-button.generate")[0].innerHTML = `<i class="fas fa-spinner-third"></i> Generate`;
}


/**
 * Populates the model dropdown in the dialog with available LLM models from the module settings.
 */
function populateModels() {
  const dropdown = document.getElementById("llm-model");
  const models= game.settings.get('legend-lore','models').split(',').map(model => model.trim());
  for (const model of models) {
    const option = document.createElement("option");
    option.value = model;
    option.text = model;
    dropdown.add(option);
  }
}

/**
 * Populates a dropdown with journal entries available in the game. Used for selecting a journal entry in the dialog.
 * @param {string|null} [selectedJournalEntryId=null] - The ID of the journal entry to be pre-selected in the dropdown.
 */
async function populateJournalDropdown(selectedJournalEntryId = null) {
  const dropdown = document.querySelector('.journal-entry-dropdown');
  dropdown.innerHTML = '';
  const journalEntries = game.journal.map(entry => ({ id: entry.id, name: entry.name }));
  for (const entry of journalEntries) {
      let option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.name;
      option.selected = entry.id === selectedJournalEntryId;
      dropdown.appendChild(option);
  }
}
