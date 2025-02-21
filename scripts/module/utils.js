/**
 * Logs messages with standard module formatting.
 * @param {Object} options - The options for logging.
 * @param {string} options.message - The message to log.
 * @param {string[]} [options.display=['console']] - The display methods for the log (e.g., 'console', 'ui').
 * @param {string[]} [options.type=['info']] - The type of log message (e.g., 'info', 'warn', 'error').
 * @param {Error} [options.error] - An optional error object to log.
 */
export function log(params = {
  message: "",
  display: [],
  type: [],
  error: null
}) {
  const options = Object.assign({ display: ["console"], type: ["info"] }, params);
  const consoleMessage = `Legend Lore | ${options.message}`;
  const uiMessage = `${options.message}`;

  // Helper to extract detailed error info
  function getErrorDetails(error) {
    if (!error) return null;
    const details = {
      message: error.message || "No message",
      stack: error.stack || "No stack trace",
    };
    // Include other enumerable properties
    for (const key in error) {
      if (Object.prototype.hasOwnProperty.call(error, key)) {
        details[key] = error[key];
      }
    }
    return details;
  }

  if (options.display.includes("console")) {
    if (options.type.includes("info")) {
      console.info(consoleMessage);
    }
    if (options.type.includes("warn")) {
      if (options.error) {
        const errorDetails = getErrorDetails(options.error);
        console.warn(consoleMessage, errorDetails);
      } else {
        console.warn(consoleMessage);
      }
      console.warn(consoleMessage);
    }
    if (options.type.includes("error")) {
      if (options.error) {
        const errorDetails = getErrorDetails(options.error);
        console.error(consoleMessage, errorDetails);
      } else {
        console.error(consoleMessage);
      }
    }
  }

  if (options.display.includes("ui")) {
    if (options.type.includes("info")) {
      ui.notifications.info(uiMessage);
    }
    if (options.type.includes("warn")) {
      ui.notifications.warn(uiMessage);
    }
    if (options.type.includes("error")) {
      ui.notifications.error(uiMessage + " [See web console for more details]");
    }
  }
}

/**
 * A utility class for handling HTML elements, providing functionalities to convert
 * between HTML elements and JSON representation, and to manipulate element attributes.
 */
export class ElementHandler {
    /**
     * Converts an HTML element to its JSON representation.
     * @param {Element} element - The HTML element to convert.
     * @return {Object} JSON representation of the element.
     */
    static htmlToJson(element) {
        try {
            if (!(element instanceof Element)) {
                throw new Error("Invalid input: Expected HTML Element.");
            }
            let json = {
                tagName: element.tagName.toLowerCase()
            };
            let children = [];
            for (let node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
                    children.push({ type: 'text', content: node.nodeValue.trim() });
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    children.push(ElementHandler.htmlToJson(node));
                }
            }
            if (children.length > 0) {
                json.children = children;
            }
            return json;
        }
        catch (error) {
            log({
                message: 'Error in HTML to JSON processing.',
                error: error,
                display: ["ui", "console"],
                type: ["error"]
            });
        }
    }
    /**
     * Converts a JSON object back into an HTML element.
     * @param {Object} jsonObject - The JSON object to convert.
     * @return {Element} The resulting HTML element.
     */
    static jsonToHtml(jsonObject) {
        try {
            if (typeof jsonObject !== 'object' || jsonObject === null) {
                throw new Error("Invalid input: Expected JSON object.");
            }
            const element = document.createElement(jsonObject.tagName);
            if (jsonObject.children) {
                for (let childJson of jsonObject.children) {
                    if (childJson.type === 'text') {
                        let textNode = document.createTextNode(childJson.content);
                        element.appendChild(textNode);
                    } else {
                        let childElement = ElementHandler.jsonToHtml(childJson);
                        element.appendChild(childElement);
                    }
                }
            }
            return element;
        }
        catch (error) {
            log({
                message: 'Error in JSON to HTML processing.',
                error: error,
                display: ["ui", "console"],
                type: ["error"]
            });
        }
    }
    /**
     * Retrieves the attributes of an HTML element as an object.
     * @param {Element} element - The HTML element from which to retrieve attributes.
     * @return {Object} An object containing the attributes of the element.
     */
    static getElementAttributes(element) {
        let attributes = {};
        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }
    /**
     * Sets attributes on an HTML element from a given attributes object.
     * @param {Element} element - The HTML element on which to set attributes.
     * @param {Object} attributes - An object containing attributes to set on the element.
     */
    static setElementAttributes(element, attributes) {
        for (let attrName in attributes) {
            element.setAttribute(attrName, attributes[attrName]);
        }
    }
}

/**
 * Converts a JSON object to a JSON schema.
 * @param {Object} data - The JSON object to convert.
 * @returns {Object} - The JSON schema.
 */
export function jsonToSchema(data) {
  const utils = {
    isPlainObject: obj =>
      obj ? typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype : false,

    // Updated getType: map "text" to "string"
    getType: type => {
      if (type === "text") return "string";
      if (['string', 'number', 'array', 'object', 'boolean'].includes(type)) {
        return type === 'integer' ? 'number' : type;
      }
      return typeof type;
    },

    // Modified isSchema: treat an object with a "content" key as plain data.
    isSchema: object =>
      typeof object === "object" &&
      object !== null &&
      typeof object.type !== "undefined" &&
      !('content' in object),

    handleArray: (arr, schema) => {
      if (!arr.length) return;
      const props = {};
      utils.parse(arr[0], props);
      Object.assign(schema, {
        type: 'array',
        items: props
      });
    },

    handleObject: (json, schema) => {
      if (utils.isSchema(json)) {
        return utils.handleSchema(json, schema);
      }
      const properties = {};
      const required = [];
      for (const key in json) {
        let curKey = key;
        // Check for required property (indicated by a '*' at the start)
        if (key[0] === '*') {
          curKey = key.slice(1);
          required.push(curKey);
        }
        // Initialize property object to avoid undefined issues
        properties[curKey] = {};
        utils.parse(json[key], properties[curKey]);
      }
      Object.assign(schema, {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {})
      });
    },

    parse: (json, schema) => {
      if (Array.isArray(json)) return utils.handleArray(json, schema);
      if (utils.isPlainObject(json)) return utils.handleObject(json, schema);
      const type = utils.getType(json);
      Object.assign(schema, {
        type,
        ...(type === 'number' && Number.isInteger(json) ? { format: 'integer' } : {})
      });
    },

    handleSchema: (json, schema) => {
      // Instead of directly merging, we determine the actual type using getType.
      const actualType = utils.getType(json.type);
      // Merge the provided JSON schema but override the type with our mapped type.
      Object.assign(schema, json, { type: actualType });
      if (!actualType) return;
      switch (actualType) {
        case 'object':
          utils.handleObject(json.properties || {}, schema);
          break;
        case 'array':
          const itemsSchema = {};
          utils.parse(json.items, itemsSchema);
          Object.assign(schema, {
            type: 'array',
            items: itemsSchema
          });
          break;
      }
    }
  };

  const JsonSchema = {};
  utils.parse(data, JsonSchema);
  return JsonSchema;
}

/**
 * Validates a JSON object against a simplified JSON Schema.
 *
 * This implementation supports a few keywords:
 * - "type": Must be one of "object", "array", "string", "number", "boolean", or "null".
 * - "properties": For objects, an object whose keys define sub-schemas.
 * - "required": An array of required property names.
 * - "items": For arrays, the schema each item must conform to.
 * - "enum": An array of allowed values (for strings, numbers, etc.)
 *
 * @param {any} data - The JSON data to validate.
 * @param {object} schema - The JSON Schema definition.
 * @returns {boolean} True if data validates against the schema, otherwise false.
 */
export function validateJsonAgainstSchema(data, schema) {
  // If schema has a "type", validate based on it.
  if (schema.type) {
    switch (schema.type) {
      case "object":
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
          return false;
        }
        // Check for required keys.
        if (schema.required && Array.isArray(schema.required)) {
          for (const key of schema.required) {
            if (!(key in data)) {
              return false;
            }
          }
        }
        // Validate each property defined in "properties".
        if (schema.properties && typeof schema.properties === "object") {
          for (const key in schema.properties) {
            // Only validate if the key exists in data.
            if (key in data) {
              if (!validateJsonAgainstSchema(data[key], schema.properties[key])) {
                return false;
              }
            }
          }
        }
        return true;

      case "array":
        if (!Array.isArray(data)) {
          return false;
        }
        // Validate each item using the "items" schema.
        if (schema.items) {
          for (const item of data) {
            if (!validateJsonAgainstSchema(item, schema.items)) {
              return false;
            }
          }
        }
        return true;

      case "string":
        if (typeof data !== "string") {
          return false;
        }
        if (schema.enum && Array.isArray(schema.enum)) {
          if (!schema.enum.includes(data)) {
            return false;
          }
        }
        return true;

      case "number":
        if (typeof data !== "number") {
          return false;
        }
        if (schema.enum && Array.isArray(schema.enum)) {
          if (!schema.enum.includes(data)) {
            return false;
          }
        }
        return true;

      case "boolean":
        return typeof data === "boolean";

      case "null":
        return data === null;

      default:
        // Unsupported type keyword
        return false;
    }
  }
  // If no type is specified in the schema, we assume it is valid.
  return true;
}
