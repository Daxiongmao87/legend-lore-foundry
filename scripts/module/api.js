import { log } from './utils.js';
/**
 * Hardcoded system prompt that instructs the LLM on output structure.
 */

/**
 * Processes the LLM request by constructing a payload from a template with placeholders.
 * Expects the settings to include a 'payloadJson' template with:
 *  - {{UserInput}}
 *  - {{ContentTemplate}}
 *
 * @param {Object} params - The parameters for the request.
 * @returns {Promise<Object>} The API response.
 */
export async function processLLMRequest(params) {
  // Retrieve the payload template from settings.
  let payloadTemplate = game.settings.get('legend-lore', 'payloadJson');

  // Sanitize placeholder values for JSON without wrapping them in quotes.
  const sanitizedContentTemplateInstructions = JSON.stringify(params.contentTemplateInstructions).slice(1, -1);
  const sanitizedContentTemplateSchema = JSON.stringify(params.contentTemplateSchema).slice(1, -1);

  // Replace placeholders with actual values.
  payloadTemplate = payloadTemplate
    .replaceAll('{{Model}}', params.model)
    .replaceAll('{{UserInput}}', sanitizedContentTemplateInstructions)
    .replaceAll('{{ContentTemplate}}', sanitizedContentTemplateSchema);
  let payload;
  try {
    payload = JSON.parse(payloadTemplate);
  } catch (error) {
    log({message: "Error parsing payload JSON template.", error: error, type: ["error"]});
    throw error;
  }

  // Optionally override the model.
  if (params.model) {
    payload.model = params.model;
  }

  // Construct the API URL.
  const useHttps = game.settings.get('legend-lore', 'https');
  const protocol = useHttps ? 'https://' : 'http://';
  const baseUrl = game.settings.get('legend-lore', 'textGenerationApiUrl');
  const apiUrl = protocol + baseUrl;

  // Retrieve the API key.
  const apiKey = game.settings.get('legend-lore', 'apiKey');
  const retryLimit = game.settings.get('legend-lore', 'generationRetryLimit');
  let retryCount = 0;
  while (retryCount < retryLimit) {
    let response = '';
    try {
      // skip ssl if module setting skipSSLVerification is true
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": apiKey ? `Bearer ${apiKey}` : ""
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      if (retryCount === retryLimit - 1) {
        log({message: "Error processing LLM request.", error: error, type: ["error"]});
        throw error;
      }
      else {
        log({message: `Failed to process LLM request.  Retrying ${retryCount + 1}/${retryLimit}) ...`, error: error, type: ["warn"]});
        retryCount++;
      }
    }
    const data = await response.json();
    // use responseJsonPath game setting to extract the response from the json (example: choices.0.message.content)
    const responseJsonPath = game.settings.get('legend-lore', 'responseJsonPath');
    let responseText = data;
    try {
      responseText = responseJsonPath.split('.').reduce((o, i) => o[i], data);
    } catch (error) {
      if (retryCount === retryLimit - 1) {
        log({message: "Error extracting response from JSON.", error: error, type: ["error"]});
        throw error;
      }
      else {
        log({message: `Failed to extract response from JSON.  Retrying ${retryCount + 1}/${retryLimit}) ...`, error: error, type: ["warn"]});
        retryCount++;
      }
    }
    // Use reaosningEndTag game setting (if not empty) to filter all text before and including that tag
    const reasoningEndTag = game.settings.get('legend-lore', 'reasoningEndTag');
    if (reasoningEndTag) {
      responseText = responseText.split(reasoningEndTag).slice(1).join(reasoningEndTag);
    }

    // Try and extract the json from the remaining text.  this means search for the first { and
    // the last } and extract everything in between
    try {
      const start = responseText.indexOf('{');
      const end = responseText.lastIndexOf('}');
      responseText = responseText.substring(start, end + 1);
      return responseText;
    } catch (error) {
      if (retryCount === retryLimit - 1) {
        log({message: "Error extracting JSON from response text.", error: error, type: ["error"]});
        throw error;
      } else {
        log({message: `Failed to extract JSON from response text.  Retrying ${retryCount + 1}/${retryLimit}) ...`, error: error, type: ["warn"]});
        retryCount++;
      }
    }
  }
}

