import { processGPTRequest } from "./api.js";
import { createNewJournalEntryPage } from "./journalManager.js";
import { ElementHandler } from './elementTransformer.js';
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
  const dialogTemplate = await renderTemplate('modules/legend-lore/templates/context-dialog.html', {});

  // Create and render a new dialog
  let d = new Dialog({
      title: `Additional Context for "${highlightedText}"`,
      content: dialogTemplate,
      buttons: {
        accept: {
          icon: '<i class="fas fa-check"></i>',
          label: "Accept",
          callback: (html) => createNewJournalEntryPage(journalEntryId, $(".legend-lore.entry-title")[0].value, highlightedText, originalContent, $(".legend-lore.generation-preview").html())
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
          // ... [callback for cancel]
        }
      },
      default: "cancel",
      render: (html) => dialogHelper(html, highlightedText, journalEntryName, originalTitle, originalContent, journalEntryId)
    }).render(true, {
      width: 800
    });
  }

function dialogHelper(html, highlightedText, journalEntryName, originalTitle, originalContent, journalEntryId) {
  $(".dialog-buttons").prepend('<button class="dialog-button generate"><i class="fas fa-wand-sparkles"></i>Generate</button>');
  $(".legend-lore.entry-title").val(highlightedText);
  //$(".legend-lore.")
  // Add event listener to the new 'Generate' button
  $('.dialog-button.generate').click(function() {
      handleGenerate(html, highlightedText, journalEntryName, originalTitle, originalContent, journalEntryId); // Call your existing handleGenerate function
  });
  html.find('#entry-template').on('change', function() {
    // Call a function to update the template preview
    console.log(this);
    if (this.value === "null" ) {
      resetPreviewStyle("template-preview)");
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
  $(`.legend-lore.${previewName}`).text("Select a template");
  $(`.legend-lore.${previewName}`).removeAttr( 'style' );
  $(`.legend-lore.${previewName}`).css ('height', '184px');
  $(`.legend-lore.${previewName}`).css ('line-height', '184px');
  $(`.legend-lore.${previewName}`).css ('text-align', 'center');
  $(`.legend-lore.${previewName}`).css ('padding-left', '8px');
  $(`.legend-lore.${previewName}`).css ('padding-right', '8px');
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
          console.log(pages);
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

async function handleGenerate(html, highlightedText, journalEntryName, originalTitle, originalContent, journalEntryId) {
    // Show the loading indicator and disable form elements while processing
    $(".dialog-button.generate")[0].innerHTML=`<i class="fas fa-sparkle fa-spin"></i>Generating...`;
    const formElements = html.find('input, textarea, button, a');
    formElements.prop('disabled', true);

    // Extract the additional context value from the form
    const additionalContext = $(".legend-lore.additional-context")[0].value;
    const model = $(".legend-lore.gpt-model")[0].value;
    let templateContentJSON = ''
    if ($(".entry-template").value != "null") {
      templateContentJSON = ElementHandler.htmlToJson($('.legend-lore.template-preview')[0]);
      console.log(templateContentJSON);
    }
    else {
      templateContentJSON = '';
    }
    const originalContentJSON=ElementHandler.htmlToJson(originalContent.activeElement);
    // Process the GPT request
    let data = await processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContentJSON, journalEntryId, templateContentJSON, model);
    const content = JSON.parse(data.apiResponseContent.choices[0].message.content.trim());
    console.log("CONTENT");
    console.log(content);
    console.log(ElementHandler.jsonToHtml(content.output));
    //let cleanedString = content.replace(/(\r\n|\n|\r)/gm, "").replace(/"([^"]+)"/g, (match, p1) => `"${p1.replace(/"/g, '\\"')}"`);

    // Try parsing the JSON string into an object and update UI
    try {
        let jsonObject = content;
        const text = ElementHandler.jsonToHtml(content.output);
        updateUIAfterResponse(html, text, data.apiResponseContent.usage);
    } catch (e) {
        console.error("Error parsing JSON:", e);
    }

    // Re-enable the form elements
    formElements.prop('disabled', false);
    $(".dialog-button.generate")[0].innerHTML=`<i class="fas fa-wand-sparkles"></i>Generate`;
  }

function updateUIAfterResponse(html, returnedContent, tokens) {
    // Update response content and token count
    updatePreviewStyle("generation-preview");
    html.find('.legend-lore.generation-preview').html(returnedContent);
    html.find('#token-count').html(`<strong>Tokens sent: ${tokens.prompt_tokens}, Tokens received: ${tokens.completion_tokens}, Total Tokens Used: ${tokens.total_tokens}</strong>`);

    // Show the response container
    html.find('#response-container').show();

    // Update button states
    updateButtonStates(html);
}

function updateButtonStates(html) {
    // Change 'Generate' to 'Regenerate' and show 'Accept' button
    html.find("#generate-btn").text("Regenerate");
    html.find("#accept-btn").show();

    // Style the buttons to be horizontal if needed
    // html.find('.dialog-buttons').css('display', 'flex');
}