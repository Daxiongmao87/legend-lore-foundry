import { base_url, max_tokens } from './settings.js';
import { createNewJournalEntryPage } from './journalManager.js'
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
      const response = await fetch(`${base_url}`, requestOptions);
      if (!response.ok) {
        console.error('OpenAI API error:', response.statusText);
        return null;
      }

      const data = await response.json();
      console.log("DATA: ");
      console.log(data);
      const content = data.choices[0].message.content.trim();
      let cleanedString = content.replace(/(\r\n|\n|\r)/gm, "");

      // Ensure double quotes inside string values are escaped
      cleanedString = cleanedString.replace(/"([^"]+)"/g, function(match, p1) {
          return `"${p1.replace(/"/g, '\\"')}"`;
      });

      // Parse the JSON string into an object
      try {
          let jsonObject = JSON.parse(cleanedString);
          console.log(jsonObject);
          const text = `<section data-category="${jsonObject.category}">
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

// Other API related functions...
// Function to handle GPT request using OpenAI's API
export async function processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId) {
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
    console.log(originalContent);
    await createNewJournalEntryPage(journalEntryId, highlightedText, originalContent, apiResponseContent);
  }

  