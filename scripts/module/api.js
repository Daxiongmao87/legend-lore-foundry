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
export async function processGPTRequest(options = {
  type,
  subject, 
  journalEntryName,  
  originalTitle, 
  context, 
  additionalContext,
  journalEntryId, 
  templateContent,
  globalContext,
  model
}) {
    const preprompt = `You are a TTRPG content generator.`
    console.log(options);
    console.log(JSON.stringify(options.templateContent));
    
    let prompt = `Generate a fully-detailed and RICH TTRPG entry for "${options.journalEntryName}" from within "${options.originalTitle}" on the following subject: "${options.subject}".  Expand on "${options.journalEntryName}" in granular detail and introduce new subjects within the context of "${options.originalTitle}".  `
    if(options.context) {
      prompt = prompt + `Here is more context on "${options.subject}" below:
      CONTEXT
      ---
      ${JSON.stringify(options.context)}
      ---
      `
    }
    if ( options.additionalContext || options.globalContext) {
      prompt = prompt + `
      ADDITIONAL CONSIDERATIONS:`
      if (options.additionalContext) prompt = prompt + `
      ${options.additionalContext}
      ---`
      if (options.globalContext) prompt = prompt + `
      ${options.globalContext}
      ---`
    }
    prompt = prompt + `
    ADHERE TO THE FOLLOWING JSON TEMPLATE:
    '{
    "precedent_subjects": "<Comprehensive Comma-Separated List of Existing Subjects with Precedent EXCLUSIVELY related to ${options.subject}>", 
    "new_subjects": "<Comprehensive Comma-Separated List of Newly Generated, UNPRECEDENTED DISTINCT Subjects EXCLUSIVELY related to ${options.subject}, using PROPER NOUNS>", 
    "subject_expansion": "array detailing each identified precedent_subject and new_subject, ONLY IF RELATED TO ${options.subject}, in an effort to provide RICH content.",
    "output": ${JSON.stringify(options.templateContent)
      }" 
    }'

    Emulate and adhere to the formatting and writing style of the CONTEXT provided. All new content must be DIRECTLY related to "${options.subject}."`;
    console.log(prompt);
    // Call the OpenAI API passing the preprompt and the subject (prompt part)
    const apiResponseContent = await callOpenAI(preprompt, prompt, options.model);
    //const apiResponseContent="test";
    if (!apiResponseContent) {
      ui.notifications.error('Failed to get a response from OpenAI.');
      return;
    }

    // Use the received content as the body for the new journal entry page
    console.log(apiResponseContent);
    return { 
        journalEntryId: options.journalEntryId, 
        subject: options.subject, 
        originalContent: options.context, 
        apiResponseContent: apiResponseContent
    };
  }

  