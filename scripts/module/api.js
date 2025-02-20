import { log } from './utils.js';
/**
 * Hardcoded system prompt that instructs the LLM on output structure.
 */

/**
 * Processes the LLM request by constructing a payload from a template with placeholders.
 * Expects the settings to include a 'payloadJson' template with:
 *  - {{GenerationContext}}
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
    .replaceAll('{{GenerationContext}}', sanitizedContentTemplateInstructions)
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
  const tryLimit = game.settings.get('legend-lore', 'generationTryLimit');
  let tryCount = 0;
  // Start async timer
  const startTime = performance.now();
  while (tryCount < tryLimit) {
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
      if (tryCount === tryLimit - 1) {
        log({message: "Error processing LLM request.", error: error, type: ["error"]});
        throw error;
      }
      else {
        log({message: `Failed to process LLM request.  Retrying ${tryCount + 1}/${tryLimit}) ...`, error: error, type: ["warn"]});
        tryCount++;
      }
    }
    const data = await response.json();
    // use responseJsonPath game setting to extract the response from the json (example: choices.0.message.content)
    const responseJsonPath = game.settings.get('legend-lore', 'responseJsonPath');
    let responseText = data;
    try {
      responseText = responseJsonPath.split('.').reduce((o, i) => o[i], data);
    } catch (error) {
      if (tryCount === tryLimit - 1) {
        log({message: "Error extracting response from JSON.", error: error, type: ["error"]});
        throw error;
      }
      else {
        log({message: `Failed to extract response from JSON.  Retrying ${tryCount + 1}/${tryLimit}) ...`, error: error, type: ["warn"]});
        tryCount++;
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
    } catch (error) {
      if (tryCount === tryLimit - 1) {
        log({message: "Error extracting JSON from response text.", error: error, type: ["error"]});
        throw error;
      } else {
        log({message: `Failed to extract JSON from response text.  Retrying ${tryCount + 1}/${tryLimit}) ...`, error: error, type: ["warn"]});
        tryCount++;
      }
    }
    // Try to convert the response text to JSON
    try {
      const responseJSON = JSON.parse(responseText);
      const endTime = performance.now();
      // Calculate the generation time and provide string in seconds and possibly minutes.
      let generationTime = (endTime - startTime) / 1000;
      let generationTimeString = "N/A";
      if (generationTime > 60) {
        const generationTimeMinutes = generationTime / 60;
        const generationTimeSeconds = generationTime % 60;
        generationTimeString = generationTimeMinutes.toFixed(0) + " minutes" + (generationTimeSeconds > 0 ? ` and ${generationTimeSeconds.toFixed(0)} seconds` : "");
      } else {
        generationTime = generationTime.toFixed(2);
        generationTimeString = generationTime + " seconds";
      }
      const triesString = `${tryCount + 1} of ${tryLimit}`;
      return {responseJSON: responseJSON, tries: triesString, generationTime: generationTimeString };
    }
    catch (error) {
      if (tryCount === tryLimit - 1) {
        log({message: "Error parsing response JSON.", error: error, type: ["error"]});
        throw error;
      } else {
        log({message: `Failed to parse response JSON.  Retrying ${tryCount + 1}/${tryLimit}) ...`, error: error, type: ["warn"]});
        tryCount++;
      }
    }
  }
}

