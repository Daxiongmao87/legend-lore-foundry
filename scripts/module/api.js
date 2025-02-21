import { log, validateJsonAgainstSchema } from './utils.js';
/**
 * Processes the LLM request by constructing a payload from a template with placeholders.
 * Expects the settings to include a 'payloadJson' template with:
 *  - {{Model}} for the model name,
 *  - {{GenerationContext}} for the user instructions,
 *  - {{ContentSchema}} for the content schema.
**/
export async function processLLMRequest(params) {
  let payloadTemplate = game.settings.get('legend-lore', 'payloadJson');
  const escapedGenerationContext = JSON.stringify(params.contentTemplateInstructions).slice(1, -1);
  const escapedContentSchema = JSON.stringify(params.contentTemplateSchema).slice(1, -1);

  payloadTemplate = payloadTemplate
    .replaceAll('{{Model}}', params.model)
    .replaceAll('{{GenerationContext}}', escapedGenerationContext)
    .replaceAll('{{ContentSchema}}', params.contentTemplateSchema)
    .replaceAll('{{ContentSchemaEscaped}}', escapedContentSchema);

  let payload;
  try {
    payload = JSON.parse(payloadTemplate);
  } catch (error) {
    log({
      message: "Error parsing payload JSON template.",
      error: error,
      type: ["error"]
    });
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
    log({message: "Error processing LLM request.", error: error, type: ["error"]});
    throw error;
  }

  const data = await response.json();
  // Use responseJsonPath game setting to extract the response from the JSON (e.g. choices.0.message.content)
  const responseJsonPath = game.settings.get('legend-lore', 'responseJsonPath');
  let responseText = data;
  try {
    responseText = responseJsonPath.split('.').reduce((o, i) => o[i], data);
  } catch (error) {
    log({message: "Error extracting response from JSON.", error: error, type: ["error"]});
    throw error;
  }

  // Use reasoningEndTag game setting (if not empty) to filter text before and including that tag.
  const reasoningEndTag = game.settings.get('legend-lore', 'reasoningEndTag');
  if (reasoningEndTag) {
    responseText = responseText.split(reasoningEndTag).slice(1).join(reasoningEndTag);
  }

  // Try and extract the JSON from the remaining text: search for first '{' and last '}'.
  try {
    const start = responseText.indexOf('{');
    const end = responseText.lastIndexOf('}');
    responseText = responseText.substring(start, end + 1);
  } catch (error) {
    log({message: "Error extracting JSON from response text.", error: error, type: ["error"]});
    throw error;
  }

  // Try to convert the response text to JSON.
  let responseJSON;
  try {
    responseJSON = JSON.parse(responseText);
  } catch (error) {
    log({message: "Error parsing response JSON.", error: error, type: ["error"]});
    throw error;
  }

  // Validate the response JSON against the content schema.
  const schemaJson = JSON.parse(params.contentTemplateSchema);
  const valid = validateJsonAgainstSchema(responseJSON, schemaJson);
  if (!valid) {
    const error = new Error("Response JSON does not match content schema.");
    log({message: "Error linting response JSON.", error: error, type: ["error"]});
    throw error;
  }
  else {
    return responseJSON
  }
}

