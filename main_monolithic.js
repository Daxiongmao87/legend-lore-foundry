Hooks.once('ready', () => {
    console.log("5e-gpt-populator | Ready hook triggered.");

    game.settings.register('5e-gpt-populator', 'openaiApiKey', {
        name: "OpenAI API Key",
        hint: "Enter your OpenAI API key here.",
        scope: 'world',
        config: true,
        type: String,
        default: ""
    });
    game.settings.register('5e-gpt-populator', 'model', {
        name: "Model",
        hint: "Please enter a valid API Key.",
        scope: 'world',
        config: true,
        type: String,
        choices: {},
        default: "None"
    });
    game.settings.register('5e-gpt-populator', 'temperature', {
        name: "Temperature",
        hint: "Enter a desired temperature (higher is more creative, lower is more consistent).",
        scope: 'world',
        config: true,
        type: Number,
        default: "0.3"
    });
    max_tokens=4096;
    baseURL='https://api.openai.com/v1/chat/completions';
    updateModelDropdown();
    if (!window.ProseMirror || !window.ProseMirror.ProseMirrorHighlightMatchesPlugin) {
        console.error('ProseMirror or ProseMirrorHighlightMatchesPlugin not found.');
        return;
    }

    console.log("5e-gpt-populator | ProseMirror and ProseMirrorHighlightMatchesPlugin found.");

    const originalBuild = window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build;

    window.ProseMirror.ProseMirrorHighlightMatchesPlugin.build = function (schema, options = {}) {
        console.log("5e-gpt-populator | ProseMirrorHighlightMatchesPlugin build method called.");

        const originalPlugin = originalBuild.call(window.ProseMirror.ProseMirrorHighlightMatchesPlugin, schema, options);

        // Wrap the view function located under the spec object
        const originalView = originalPlugin.spec.view;
        if (typeof originalView === 'function') {
            originalPlugin.spec.view = (editorView) => {
                console.log("5e-gpt-populator | Custom view method called.");

                // Get the original tooltip instance
                const tooltipInstance = originalView(editorView);

                // Override the update method of the tooltip instance
                if (typeof tooltipInstance.update === 'function') {
                    const originalUpdate = tooltipInstance.update.bind(tooltipInstance);
                    tooltipInstance.update = async function(view, lastState) {
                      console.log("5e-gpt-populator | Custom update method called.");

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
                                <h4 style="color:black;">GPT Populator</h4>
                                <a class="generate-entry-link content-link" onclick="generateEntryForText('${safeHighlightedText}', '${journalEntryId}'); return false;">
                                    <i class="fas fa-robot"></i>Generate Entry for ${highlightedText}
                                </a>
                            </section>
                        `;
                        window.generateEntryForText = function(highlightedText, journalEntryId) {
                            console.log(`Preparing to generate entry for: ${highlightedText}`);
                            //const closestContentDiv = document.querySelector('.editor-content.journal-page-content.ProseMirror');
                            //let originalContent = closestContentDiv ? closestContentDiv.innerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>') : '';
                            //const closestTitleDiv = document.querySelector('.title')
                            let originalContent = editorView.dom.closest('.journal-page-content').innerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>');
                            let originalTitle = editorView.dom.closest('.editable.flexcol').querySelector('.journal-header').querySelector('.title').value;
                            // Pass only the highlighted text and journal entry ID
                            openContextDialog(highlightedText, journalEntryId, originalTitle, originalContent);
                        };

                        async function openContextDialog(highlightedText, journalEntryId, originalTitle, originalContent) {
                        // Fetch the journal entry to get its name and current content for additional context
                        const journalEntry = game.journal.get(journalEntryId);
                        if (!journalEntry) {
                          console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
                          return;
                        }
                        const journalEntryName = journalEntry.name; // Get the name of the JournalEntry

                        console.log(`Opening context dialog for: ${highlightedText} within Journal Entry: ${journalEntryName}`);

                        // Load the dialog HTML from the provided template path
                        const dialogTemplate = await renderTemplate('modules/5e-gpt-populator/templates/context-dialog.html', {});

                        // Create and render a new dialog
                        let d = new Dialog({
                          title: `Additional Context for "${highlightedText}"`,
                          content: dialogTemplate,
                          buttons: {
                            cancel: {
                              icon: '<i class="fas fa-times"></i>',
                              label: "Cancel"
                            }
                          },
                          render: (html) => {
                            // Find the form submission within the dialog and handle it
                            const form = html.find('form');
                            form.on('submit', async (event) => {
                              event.preventDefault();

                              // Show the loading indicator and disable the form elements while processing
                              html.find('#loading-indicator').show();
                              form.find('input, textarea, button, a').prop('disabled', true); // Disable buttons and links as well
                              html.find('.dialog-buttons button').prop('disabled', true);

                              // Extract the additional context value from the form
                              const additionalContext = html.find('#additional-context').val();

                              // Process the GPT request with the extracted additional context
                              await processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId);

                              // After processing, hide the loading indicator and re-enable form elements
                              html.find('#loading-indicator').hide();
                              form.find('input, textarea, button, a').prop('disabled', false);
                              html.find('.dialog-buttons button').prop('disabled', false);

                              d.close(); // Close the dialog
                            });

                            // Set initial focus to the textarea
                            html.find('#additional-context').focus();
                          },
                          default: "cancel"
                        }).render(true);
                      }

                        // Function to construct the full prompt
                        // Function to call the OpenAI API
                      async function callOpenAI(preprompt, contextPrompt) {
                        // Construct the full prompt
                        const fullPrompt = `${preprompt}\n\n${contextPrompt}`;

                        // Fetch the apiKey directly within the function to ensure it's always current
                        const apiKey = game.settings.get('5e-gpt-populator', 'openaiApiKey');
                        if (!apiKey) {
                          console.error("OpenAI API key is not set in the 5e-gpt-populator module settings.");
                          return null;
                        }

                        // requestOptions is now inside the function, using the apiKey fetched from settings
                        const requestOptions = {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${apiKey}`, // Use the apiKey directly from settings
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            model: game.settings.get('5e-gpt-populator', 'model') , // Replace with your model of choice
                            messages: [
                              {
                                role: "system",
                                content: preprompt  // Your preprompt text that provides context or instructions
                              },
                              {
                                role: "user",
                                content: contextPrompt  // The actual user's prompt or query
                              }
                              // Include additional message objects if you have more conversation context.
                            ],
                            temperature: game.settings.get('5e-gpt-populator', 'temperature'), // Adjust as necessary
                            max_tokens: max_tokens, // Adjust as necessary
                            response_format: { type: "json_object" }, // Enable JSON mode to ensure the model outputs valid JSON
    // Add any other parameters you wish to include in the request
                            // Additional parameters...
                          }),
                        };

                        // Send the request to the OpenAI API
                        try {
                          const response = await fetch(`${baseURL}`, requestOptions);
                          if (!response.ok) {
                            console.error('OpenAI API error:', response.statusText);
                            return null;
                          }

                          const data = await response.json();
                          console.log("DATA: ");
                          console.log(data);
                          content = data.choices[0].message.content.trim();
                          let cleanedString = content.replace(/(\r\n|\n|\r)/gm, "");

                          // Ensure double quotes inside string values are escaped
                          cleanedString = cleanedString.replace(/"([^"]+)"/g, function(match, p1) {
                              return `"${p1.replace(/"/g, '\\"')}"`;
                          });

                          // Parse the JSON string into an object
                          try {
                              let jsonObject = JSON.parse(cleanedString);
                              console.log(jsonObject);
                              text = `<section data-category="${jsonObject.category}">
                              ${jsonObject.intro}
                              ${jsonObject.body}
                              </section>`;
                              console.log(text);
                              return text;
                          } catch (e) {
                              console.error("Error parsing JSON:", e);
                              return null;
                          }

                        } catch (error) {
                          console.error('Error calling OpenAI API:', error);
                          return null;
                        }
                      }

                      // Function to handle GPT request using OpenAI's API
                      async function processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId) {
                        const preprompt = `You are a D&D 5e content generator.`
                        let prompt = `Generate a fuly-detailed and RICH D&D 5e entry for "${journalEntryName}" from within "${originalTitle}" on the following subject: "${highlightedText}".  Expand on "${journalEntryName}" in granular detail and introduce new subjects within the context of "${originalTitle}".  Here is more context on "${highlightedText}" below:
                        CONTEXT
                        ---
                        ${originalContent}
                        ---
                        `
                        if ( additionalContext != '') {
                          prompt = prompt + `
                        ADDITIONAL CONSIDERATIONS:
                        ${additionalContext}
                        `
                        }
                        prompt = prompt + `---
                        Output in JSON in the following format:
                        '{ "title": "<Entry Title>", "category": "<Category of Entry Based on Context (Location/Creature/Plant/Item/Lore/Religion/Philosophy/Group/Miscellaneous)>", "category_sections": "EXHAUSTIVE Comma-Seperated List of Entry Sections for this entry's category>", "precedent_subjects": "<Comprehensive Comma-Separated List of Existing Subjects with Precedent EXCLUSIVELY related to ${highlightedText}>", "new_subjects": "<Comprehensive Comma-Separated List of Newly Generated, UNPRECEDENTED DISTINCT Subjects EXCLUSIVELY related to ${highlightedText}, covering EACH SECTION, using PROPER NOUNS>", "subject_expansion": "array detailing each identified precedent_subject and new_subject, ONLY IF RELATED TO ${highlightedText}, in an effort to provide RICH content." "intro": "<Introductory text>", "body": "<HTML String containing the BODY of the RICH new content.  This should be TITLE-LESS.  This HTML string contains headers listed in category_sections.  This HTML string must cover subjects in both precedent_subjects and new_subjects in granular detail, providing a RICH Amount of information.  Use the subject_expansion section to flesh out the information in this HTML body of text.  Expand further for more rich and engaging content.>" }'

                        Emulate and adhere to the formatting and writing style of the CONTEXT provided. All new content must be DIRECTLY related to "${highlightedText}."`;
                        console.log(prompt);
                        // Call the OpenAI API passing the preprompt and the highlightedText (prompt part)
                        const apiResponseContent = await callOpenAI(preprompt, prompt);
                        if (!apiResponseContent) {
                          ui.notifications.error('Failed to get a response from OpenAI.');
                          return;
                        }

                        // Use the received content as the body for the new journal entry page
                        await createNewJournalEntryPage(journalEntryId, highlightedText, originalContent, apiResponseContent);
                      }

                      async function createNewJournalEntryPage(journalEntryId, pageName, originalContent, pageContent) {
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
                          saveEditorChanges();

                          // Allow a brief delay for the UI to update before attempting navigation
                          setTimeout(() => {
                            // Call the journal entry's sheet method to switch to the new page
                            if (journalEntry.sheet?.goToPage) {
                              journalEntry.sheet.goToPage(createdPage.id);
                            } else {
                              console.warn(`Could not switch to the new page with ID: ${createdPage.id}`);
                            }
                          }, 100);

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


                      // Check if the original update method resulted in an active tooltip.
                      if (this.tooltip) {
                        // The original update method created or found an existing tooltip, now append the dummy content.
                        console.log("5e-gpt-populator | Adding dummy content to existing tooltip.");
                        this.tooltip.innerHTML += gptGenerateButtonContent;
                      } else {
                        // The original function did not create a tooltip, so let's create one now with the dummy content.
                        console.log("5e-gpt-populator | Creating a new tooltip with dummy content.");
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
    console.log('5e-gpt-populator | ProseMirrorHighlightMatchesPlugin build method overridden.');
});

Hooks.on('renderModuleSettings', (app, html, data) => {
    // Check if this is your module's settings
    if (data.module === '5e-gpt-populator') {
        // Load your HTML template
        fetch('modules/5e-gpt-populator/templates/settings.html')
            .then(response => response.text())
            .then(template => {
                // Append or replace existing HTML with your template
                html.find('.settings-body').html(template);

                // Set the value of the input from saved settings
                html.find('#openai-api-key').val(game.settings.get('5e-gpt-populator', 'openaiApiKey'));

                // Add event listener for form submission
                html.on('submit', 'form', async (event) => {
                    event.preventDefault();
                    const apiKey = html.find('#openai-api-key').val();
                    await game.settings.set('5e-gpt-populator', 'openaiApiKey', apiKey);
                });
            });
    }
});

async function updateModelDropdown(html) {
    return new Promise(async (resolve, reject) => {
        const apiKey = game.settings.get('5e-gpt-populator', 'openaiApiKey');
        if (!apiKey) {
            game.settings.register('5e-gpt-populator', 'model', {
              name: "Model",
              hint: "Please enter a valid API Key.",
              scope: 'world',
              config: true,
              type: String,
              choices: {},
              default: "None"
            });
            resolve();
            return;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            const data = await response.json();
            const models = data.data
                .filter(model => model.id.includes('gpt'))
                .reduce((choices, model) => {
                    choices[model.id] = model.id;
                    return choices;
                }, {});
            defaultModel=(game.settings.get('5e-gpt-populator', 'model')) ? game.settings.get('5e-gpt-populator', 'model') : "gpt-3.5-turbo"
            await game.settings.register('5e-gpt-populator', 'model', {
                name: "Model",
                hint: "Select a model. For pricing information, see [OpenAI Pricing Link].",
                scope: 'world',
                config: true,
                type: String,
                choices: models,
                default: defaultModel // or set a default model if desired
            });
            if (html) {
              console.log(html.find('[data-setting-id="5e-gpt-populator.model"]').find('[class="notes"]')[0].innerHTML);
              html.find('[data-setting-id="5e-gpt-populator.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.'
              dropdown = html.find('[name="5e-gpt-populator.model"]');
              $.each(models, function(model) {
                dropdown.append($("<option></option>")
                  .attr("value", model)
                  .text(model));
              });
              dropdown.val(defaultModel).change();
            }
            resolve();

        } catch (error) {
            console.error('Error fetching models:', error);
            reject(error);
        }
    });
}

Hooks.on('renderPackageConfiguration', (app, html, data) => {
    const apiKeyInput = html.find('[name="5e-gpt-populator.openaiApiKey"]');
    html.find('[data-setting-id="5e-gpt-populator.model"]').find('[class="notes"]')[0].innerHTML = 'Select a model. For pricing information, see <a href="https://openai.com/pricing" target="_blank">OpenAI Pricing</a>.'
    debouncedApiKeychange = debounce(updateModelDropdown, 1000);
    // Only proceed if the input exists and does not have the listener attached.
    if (apiKeyInput.length > 0 && !apiKeyInput.data('listener-attached')) {
      // Add an 'input' event listener to the input field.
      apiKeyInput.on('input', (event) => {
        // Whenever the input value changes, log the new value to the console.
        newValue=event.target.value;
        game.settings.set('5e-gpt-populator', 'openaiApiKey', newValue);
        debouncedApiKeychange(html);

        console.log('OpenAI API Key changed:', newValue);
        // Additional handling code for the new value can go here.
      });

      // Set a data attribute to prevent attaching the listener multiple times.
      if(html) {}
        apiKeyInput.data('listener-attached', true);
    }

});

function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
