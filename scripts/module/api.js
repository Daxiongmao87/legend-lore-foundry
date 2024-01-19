import { base_url, max_tokens } from './settings.js';
import { createNewJournalEntryPage } from './journalManager.js'
async function callOpenAI(preprompt, contextPrompt, model) {
    // Construct the full prompt
    const fullPrompt = `${preprompt}\n\n${contextPrompt}`;

    // Fetch the apiKey directly within the function to ensure it's always current
    const apiKey = game.settings.get('legend-lore', 'openaiApiKey');
    if (!apiKey) {
      console.error("OpenAI API key is not set in the legend-lore module settings.");
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
        model: model, // Replace with your model of choice
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
        temperature: game.settings.get('legend-lore', 'temperature'), // Adjust as necessary
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
      return data;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return null;
    }
  }

// Other API related functions...
// Function to handle GPT request using OpenAI's API
export async function processGPTRequest(highlightedText, journalEntryName, additionalContext, originalTitle, originalContent, journalEntryId, templateContent, model) {
    const preprompt = `You are a TTRPG content generator.`
    console.log(templateContent);
    console.log(JSON.stringify(templateContent));
    let prompt = `Generate a fully-detailed and RICH TTRPG entry for "${journalEntryName}" from within "${originalTitle}" on the following subject: "${highlightedText}".  Expand on "${journalEntryName}" in granular detail and introduce new subjects within the context of "${originalTitle}".  Here is more context on "${highlightedText}" below:
    CONTEXT
    ---
    ${JSON.stringify(originalContent)}
    ---
    `
    if ( additionalContext != '') {
      prompt = prompt + `
    ADDITIONAL CONSIDERATIONS:
    ${additionalContext}
    ---`
    }
    if ( templateContent != '') {
      prompt = prompt + `
      ADHERE TO THE FOLLOWING JSON TEMPLATE:
      \`\`\`
      ${JSON.stringify(templateContent)}
      \`\`\`
      ---`
    }
    prompt = prompt + `
    Output in JSON in the following format:
    '{
    "precedent_subjects": "<Comprehensive Comma-Separated List of Existing Subjects with Precedent EXCLUSIVELY related to ${highlightedText}>", 
    "new_subjects": "<Comprehensive Comma-Separated List of Newly Generated, UNPRECEDENTED DISTINCT Subjects EXCLUSIVELY related to ${highlightedText}, using PROPER NOUNS>", 
    "subject_expansion": "array detailing each identified precedent_subject and new_subject, ONLY IF RELATED TO ${highlightedText}, in an effort to provide RICH content.",
    "output": <Nested JSON section adhering to the structure given in the TEMPLATE of the RICH new content. This section must contain subjects in both precedent_subjects and new_subjects in granular detail, providing a RICH Amount of information.  Use the subject_expansion section to flesh out the information in this JSON section.  Expand further for more rich and engaging content.>" 
    }'

    Emulate and adhere to the formatting and writing style of the CONTEXT provided. All new content must be DIRECTLY related to "${highlightedText}."`;
    console.log(prompt);
    // Call the OpenAI API passing the preprompt and the highlightedText (prompt part)
    const apiResponseContent = await callOpenAI(preprompt, prompt, model);
    //const apiResponseContent="test";
    if (!apiResponseContent) {
      ui.notifications.error('Failed to get a response from OpenAI.');
      return;
    }

    // Use the received content as the body for the new journal entry page
    console.log(apiResponseContent);
    return { 
        journalEntryId: journalEntryId, 
        highlightedText: highlightedText, 
        originalContent: originalContent, 
        apiResponseContent: apiResponseContent
    };
    //await createNewJournalEntryPage(journalEntryId, highlightedText, originalContent, apiResponseContent);
  }

  