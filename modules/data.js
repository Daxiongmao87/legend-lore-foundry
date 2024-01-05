// data.js
export const dataHandler = {
    processGPTRequest: async function(highlightedText, journalEntryId) {
        const preprompt = `You are a D&D 5e content generator.`;
        let prompt = `Generate a fully-detailed and RICH D&D 5e entry for "${journalEntryName}" from within "${originalTitle}" on the following subject: "${highlightedText}". Expand on "${journalEntryName}" in granular detail and introduce new subjects within the context of "${originalTitle}". Here is more context on "${highlightedText}" below:
        CONTEXT
        ---
        ${originalContent}
        ---
        `;
        if (additionalContext != '') {
            prompt += `
            ADDITIONAL CONSIDERATIONS:
            ${additionalContext}
            `;
        }
        prompt += `---
        Output in JSON in the following format:
        { "title": "<Entry Title>", "category": "<Category of Entry Based on Context>", "intro": "<Introductory text>", "body": "<HTML String containing the BODY of the new content.>" }
        `;
        const response = await apiManager.callOpenAI(preprompt, contextPrompt);
        if (!response || !response.choices || response.choices.length === 0) {
            console.error('Invalid or empty response from OpenAI API');
            return null;
        }

        // Extracting relevant content from the response
        const content = response.choices[0].message.content.trim();
        let cleanedString = content.replace(/(\r\n|\n|\r)/gm, "");

        // Ensure double quotes inside string values are escaped
        cleanedString = cleanedString.replace(/"([^"]+)"/g, function(match, p1) {
            return `"${p1.replace(/"/g, '\\"')}"`;
        });

        // Parse the JSON string into an object
        try {
            let jsonObject = JSON.parse(cleanedString);
            return jsonObject; // Returning the parsed object
        } catch (e) {
            console.error("Error parsing JSON:", e);
            return null;
        }
    },


    createNewJournalEntryPage: async function(journalEntryId, pageName, pageContent) {
        // Assuming JournalEntry and JournalEntryPage are FoundryVTT classes
        let journalEntry = game.journal.get(journalEntryId);
        if (!journalEntry) {
            console.error(`Could not find JournalEntry with ID: ${journalEntryId}`);
            return null;
        }

        // Create the data object for the new page
        let data = {
            name: pageName || "New Page",
            content: pageContent || "",
            // Add other necessary properties
        };

        // Create the new journal entry page
        try {
            let createdPage = await JournalEntryPage.create(data, {parent: journalEntry});
            console.log(`New page created with ID: ${createdPage.id}`);
            return createdPage;
        } catch (error) {
            console.error(`Error creating new JournalEntryPage:`, error);
            return null;
        }
    },

    replaceHighlightedTextInContent: function(originalText, pageUUID, content) {
        let replacementText = `@UUID[.${pageUUID}]{${originalText}}`;
        return content.split(originalText).join(replacementText);
    }
};
