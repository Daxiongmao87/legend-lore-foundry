import { BASE_URL, MAX_TOKENS } from './settings.js';
import { createNewJournalEntryPage } from './journalManager.js'
import { log } from './utils.js';
/**
 * Makes an API call to OpenAI with the given prompts and model.
 * @param {string} preprompt - The preprompt text providing context or instructions.
 * @param {string} contextPrompt - The user's prompt or query.
 * @param {string} model - The model to use for the OpenAI API call.
 * @returns {Promise<Object|null>} A promise that resolves to the response from the OpenAI API or null in case of failure.
 */
async function callOpenAI(preprompt, contextPrompt, model) {
    log({
      message: "Processing OpenAI API call."
    })
    const fullPrompt = `${preprompt}\n\n${contextPrompt}`;
    const apiKey = game.settings.get('legend-lore', 'openaiApiKey');
    if (!apiKey) {
      log({
        message: "OpenAI API key is not set in the Legend Lore module settings.", 
        display: ["ui", "console"], 
        type: ["error"]});
      return null;
    }
    const requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`, 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model, 
        messages: [
          {
            role: "system",
            content: preprompt  
          },
          {
            role: "user",
            content: contextPrompt  
          }
        ],
        temperature: game.settings.get('legend-lore', 'temperature'), 
        max_tokens: MAX_TOKENS, 
        response_format: { type: "json_object" }, 

      }),
    };
    try {
      const response = await fetch(`${BASE_URL}`, requestOptions);
      if (!response.ok) {
        throw new Error(await response.json());
        return null;
      }
      const data = await response.json();
      log({
        message: "OpenAI API call process successful."
      })
      return data;
    } catch (error) {
      log({
        message: 'Error in OpenAI API request.', 
        error: error,
        display: ["ui", "console"],
        type: ["error"]
      });
      return null;
    }
  }
/**
 * Processes a request to generate content using GPT (Generative Pre-trained Transformer) model.
 * @param {Object} options - The options for the GPT request.
 * @param {string} options.type - The type of request.
 * @param {string} options.subject - The subject for content generation.
 * @param {string} options.journalEntryName - The name of the journal entry.
 * @param {string} options.originalTitle - The original title of the content.
 * @param {string} options.context - The context for content generation.
 * @param {string} options.additionalContext - Additional context information.
 * @param {string} options.journalEntryId - The ID of the journal entry.
 * @param {string} options.templateContent - The content of the template used.
 * @param {string} options.globalContext - The global context considered for generation.
 * @param {string} options.model - The model used for the OpenAI API call.
 * @returns {Promise<Object>} A promise that resolves to the processed content.
 */
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
    (prompt);
    const apiResponseContent = await callOpenAI(preprompt, prompt, options.model);
    if (!apiResponseContent) {
      ui.notifications.error('Failed to get a response from OpenAI.');
      return;
    }
    (apiResponseContent);
    return { 
        journalEntryId: options.journalEntryId, 
        subject: options.subject, 
        originalContent: options.context, 
        apiResponseContent: apiResponseContent
    };
  }
  
