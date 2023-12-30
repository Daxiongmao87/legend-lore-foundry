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
    const openAIConfig = {
      apiKey: game.settings.get('5e-gpt-populator', 'openaiApiKey'),
      baseURL: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4-1106-preview', // Replace with your model of choice
    };

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
                            const closestContentDiv = document.querySelector('.editor-content.journal-page-content.ProseMirror');
                            let originalContent = closestContentDiv ? closestContentDiv.innerHTML.replace(/<([a-z][a-z0-9]*)[^>]*?(\/?)>/gi, '<$1$2>') : '';

                            // Pass only the highlighted text and journal entry ID
                            openContextDialog(highlightedText, journalEntryId, originalContent);
                        };

                        async function openContextDialog(highlightedText, journalEntryI, originalContent) {
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
                          title: `Additional Context for "${journalEntryName}"`,
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
                              await processGPTRequest(highlightedText, journalEntryName, additionalContext, originalContent, journalEntryId);

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
                            model: 'gpt-3.5-turbo-1106', // Replace with your model of choice
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
                            temperature: 0.7, // Adjust as necessary
                            max_tokens: 1024, // Adjust as necessary
                            response_format: { type: "json_object" }, // Enable JSON mode to ensure the model outputs valid JSON
    // Add any other parameters you wish to include in the request
                            // Additional parameters...
                          }),
                        };

                        // Send the request to the OpenAI API
                        try {
                          const response = await fetch(`${openAIConfig.baseURL}`, requestOptions);
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
                              return jsonObject.body;
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
                      async function processGPTRequest(highlightedText, journalEntryName, additionalContext, originalContent, journalEntryId) {
                        const preprompt = `You are a highly creative assistant designed to provide unique, original, and highly creative content for the user. Your responses are detailed, comprehensive, and complete.  You generate a vast amount of knowledge of any given subject and expand on any existing information provided. You strive to provide new names for unnamed subjects within the context of your creations with the goal of creating content that seems alive and real. Stay FOCUS on the subject, the information provided should be isolated to the given SUBJECT.`
                        const prompt = `Generate JSON-formatted content based on the following subject: "${highlightedText}" in the context of a journal named "${journalEntryName}". The JSON object MUST have the following formatting: '{ "title": "<Entry Title>", "body": "<Content>" }'.  Seperate the article title from the body.  The body should start with a brief, UNTITLED  introduction of "${highlightedText}" without an article title.  Within the "body" field (<content>), provide html-formatted content.  Use similar html formatting as found in the original content, as if written by the same author of the original content, BUT with sections that align with "${highlightedText}" and content being generated.
                        Note: There can be multiple sections with multiple subections.
                        Here is some context from where this content originated:
                        ---
                        # ORIGINAL CONTENT
                        "${originalContent}"
                        ---
                        Focus ONLY on the content related to "${highlightedText}" within the ORIGINAL CONTENT.
                        The following is additional context:
                        ---
                        # ADDITIONAL CONTEXT
                        "${additionalContext}"
                        ---
                        Generate a NEW article based on BOTH the original content, and additional context above, do not simply copy and paste, expand on "${highlightedText}" as if it were a detailed D&D 5e chapter for it.`;

                        // Call the OpenAI API passing the preprompt and the highlightedText (prompt part)
                        const apiResponseContent = await callOpenAI(preprompt, prompt);
                        if (!apiResponseContent) {
                          ui.notifications.error('Failed to get a response from OpenAI.');
                          return;
                        }

                        // Use the received content as the body for the new journal entry page
                        await createNewJournalEntryPage(journalEntryId, highlightedText, apiResponseContent);
                      }

                      async function createNewJournalEntryPage(journalEntryId, pageName, pageContent) {
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
                          text: {
                            content: pageContent || ""
                          },
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
                          console.log('Created Page:', createdPage)

                          // Now let's open the parent journal entry and navigate to the newly created page
                          await journalEntry.sheet.render(true);

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

Hooks.once('ready', async () => {
    // Register a callback for when the module settings are opened
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
});


