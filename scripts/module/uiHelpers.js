import { processGPTRequest } from "./api.js";
import { createNewJournalEntryPage } from "./journalManager.js";
import { ElementHandler } from './elementTransformer.js';
// Functions related to UI manipulation like tooltips, dialogs, etc.
export async function openDialog(options = {
  type,
  highlightedText, 
  journalEntryId, 
  originalTitle, 
  originalContent
}) {
  const type = options.type;
  const journalEntryId = options.journalEntryId;
  console.log(options.journalEntryId);
  // Fetch the journal entry to get its name and current content for additional context
  const journalEntry = game.journal.get(journalEntryId);
  let journalEntryName;
  if (journalEntry) {
    journalEntryName = journalEntry.name;
  }
  // Load the dialog HTML from the provided template path
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
  
  // Append this dropdown to your dialog content

  // Create and render a new dialog
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
  console.log(options.html.find(".accept"));
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
      //acceptButton.disabled = false;
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
      }); // Call your existing handleGenerate function
  });

  $(options.html).find('#entry-template').on('change', function() {
    // Call a function to update the template preview
    console.log(this);
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

function resetPreviewStyle(previewName) {
  $(`.legend-lore.${previewName}`).empty();
  $(`.legend-lore.${previewName}`).html(`
  <p>[Provide, with context to the original content, a brief introduction to the subject, including its basic definition, nature, and overall significance or relevance in the context it is being addressed.]</p>
<h2>General Description</h2>
<p>[Offer, with context to the original content, a general description of the subject, focusing on its key characteristics, features, or aspects. This section should lay the foundation for understanding the subject's uniqueness and importance.]</p>
  `);
}

function updatePreviewStyle(previewName) {
  $(`.legend-lore.${previewName}`).removeAttr( 'style' );
  $(`.legend-lore.${previewName}`).css ('height', '184px');
  $(`.legend-lore.${previewName}`).css ('padding-left', '8px');
  $(`.legend-lore.${previewName}`).css ('padding-right', '8px');
}
async function updateTemplatePreview(journalDataString) {
    // Logic to find the template content based on the selected templateId
    // and update the preview area
    updatePreviewStyle("template-preview");
    const journalData = JSON.parse(journalDataString);
    const templateContent = await getJournalEntryPages(journalData.pack, journalData.journalEntryName, journalData.journalEntryPageName);
    console.log(templateContent);
    $('.legend-lore.template-preview').html(templateContent.text.content);
}
function populateModels() {
  const dropdown = document.getElementById("gpt-model");
  const models= game.settings.get('legend-lore','models').split(' ');
  for (const model of models) {
    const option = document.createElement("option");
    option.value = model;
    option.text = model;
    dropdown.add(option);
  }
}
async function populateJournalEntryTemplates() {
  const compendiumNames = game.settings.get('legend-lore', 'journalEntryTemplates');
  const dropdown = document.getElementById("entry-template");
  clearDropdownOptions(dropdown); // Clears existing options

  for (const compendiumName of compendiumNames) {
      // Get all Journal Entries from the compendium
      const journalEntries = await getJournalEntriesFromCompendium(compendiumName);
      for (const journalEntry of journalEntries) {
          // Get all pages from the Journal Entry
          const pages = await getJournalEntryPages(compendiumName, journalEntry.name);
          if (pages && pages.size > 0) {
              addPagesToDropdown(pages, journalEntry, dropdown);
          }
      }
  }
}

function clearDropdownOptions(dropdown) {
  while (dropdown.options.length > 0) {
      dropdown.remove(0);
  }
  let option = document.createElement("option");
  option.value = "null";
  option.text = `None`;
  dropdown.add(option);
}

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


async function getJournalEntriesFromCompendium(compendiumName) {
  const compendium = game.packs.get(compendiumName);
  if (!compendium) {
      console.error(`Compendium not found: ${compendiumName}`);
      return [];
  }

  await compendium.getIndex(); // Ensure the index is loaded
  const journalEntries = [];
  for (const indexEntry of compendium.index) {
    const entry = await compendium.getDocument(indexEntry._id);
    journalEntries.push(entry);
  }
  return journalEntries;
}

async function getJournalEntryPages(compendiumName, journalEntryName, pageName) {
  const journalEntries = await getJournalEntriesFromCompendium(compendiumName);
  for (const journalEntry of journalEntries) {
    if (journalEntry.name == journalEntryName) {
      console.log(journalEntry);
      if (pageName) {
        console.log(journalEntry);
        return journalEntry.pages.find(page => page.name === pageName) || null;
      }

      return journalEntry.pages
    }
  }
}

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
    // Show the loading indicator and disable form elements while processing
    $(options.html).find(".dialog-button.generate")[0].innerHTML=`<i class="fas fa-sparkle fa-spin"></i> Generating...`;
    const formElements = $(options.html).find('input, textarea, button, a');
    formElements.prop('disabled', true);

    // Extract the additional context value from the form
    const model = $(options.html).find(".legend-lore.gpt-model")[0].value;
    let templateContentJSON = ''
    console.log($(options.html).find(".entry-template").value);
    console.log("ENTRY TEMPLATE VALUE: " + $(options.html).find(".entry-template").value);
    templateContentJSON = ElementHandler.htmlToJson($(options.html).find('.legend-lore.template-preview')[0]);
    console.log(templateContentJSON);
    let context, additionalContext, subject;
    if(options.type === "context"){
      subject = options.highlightedText;
      context=ElementHandler.htmlToJson(options.originalContent.activeElement);
      additionalContext = $(options.html).find(".legend-lore.context")[0].value;
    } else if (options.type === "generate") {
      subject = $(options.html).find(".legend-lore.entry-title")[0].value;
      context=$(options.html).find(".legend-lore.context")[0].value;
    }
    console.log("SUBJECT: " + subject);
    // Process the GPT request
    let data = await processGPTRequest({
      type: options.type,
      subject: subject, 
      journalEntryName: options.journalEntryName, 
      context: context, 
      originalTitle: options.originalTitle, 
      context: context, 
      globalContext: context,
      additionalContext: additionalContext,
      journalEntryId: options.journalEntryId, 
      templateContent: templateContentJSON, 
      model
    });
    const content = JSON.parse(data.apiResponseContent.choices[0].message.content.trim());
    console.log("CONTENT");
    console.log(content);
    console.log(ElementHandler.jsonToHtml(content.output));
    //let cleanedString = content.replace(/(\r\n|\n|\r)/gm, "").replace(/"([^"]+)"/g, (match, p1) => `"${p1.replace(/"/g, '\\"')}"`);

    // Try parsing the JSON string into an object and update UI
    try {
        let jsonObject = content;
        console.log(content.output);
        const text = ElementHandler.jsonToHtml(content.output);
        console.log(text)
        updateUIAfterResponse(options.html, text, data.apiResponseContent.usage);
    } catch (e) {
        console.error("Error parsing JSON:", e);
    }

    // Re-enable the form elements
    formElements.prop('disabled', false);
  }

function updateUIAfterResponse(html, returnedContent, tokens) {
    // Update response content and token count
    updatePreviewStyle("generation-preview");
    $(html).find('.legend-lore.generation-preview').html(returnedContent);
    $(html).find('#token-count').html(`<strong>Tokens sent: ${tokens.prompt_tokens}, Tokens received: ${tokens.completion_tokens}, Total Tokens Used: ${tokens.total_tokens}</strong>`);

    // Show the response container
    $(html).find('#response-container').show();
    $(html).find(".dialog-button.generate")[0].innerHTML=`<i class="fas fa-sparkle"></i> Generate`;
    // Update button statesconsole.log($(document).find(".dialog-button.generate"));
}

async function populateJournalDropdown(selectedJournalEntryId = null) {
  const dropdown = document.querySelector('.journal-entry-dropdown');
  console.log(selectedJournalEntryId);
  // Clear existing options
  dropdown.innerHTML = '';

  // Get all journal entries
  const journalEntries = game.journal.map(entry => ({ id: entry.id, name: entry.name }));
  for (const entry of journalEntries) {
      console.log(entry.id);
      let option = document.createElement("option");
      option.value = entry.id;
      option.textContent = entry.name;
      console.log(option);
      option.selected = entry.id === selectedJournalEntryId;
      dropdown.appendChild(option);
  }
}