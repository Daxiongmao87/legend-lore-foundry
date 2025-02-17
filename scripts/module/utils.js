/**
 * Logs messages with standard module formatting.
 * @param {Object} options - The options for logging.
 * @param {string} options.message - The message to log.
 * @param {string[]} [options.display=['console']] - The display methods for the log (e.g., 'console', 'ui').
 * @param {string[]} [options.type=['info']] - The type of log message (e.g., 'info', 'warn', 'error').
 * @param {Error} [options.error] - An optional error object to log.
 */
export function log(params = {
    message,
    display,
    type,
    error
    }) {
    const options = Object.assign({ display: ["console"], type: ["info"] }, params);
    const console_message = `Legend Lore | ${options.message}`
    const ui_message = `${options.message}`
    if (options.display.includes("console")) {
        if (options.type.includes("info")) {
            console.info(console_message);
        }
        if (options.type.includes("warn")) {
            console.warn(console_message);
        }
        if (options.type.includes("error")) {
            if(options.error){
                console.error(console_message, options.error);
            }
            else {
                console.error(console_message, options.error);
            }
        }
    }
    if (options.display.includes("ui")) {
        if (options.type.includes("info")) {
            ui.notifications.info(ui_message);
        }
        if (options.type.includes("warn")) {
            ui.notifications.warn(ui_message);
        }
        if (options.type.includes("error")) {
            if(options.error){
                ui.notifications.error(ui_message);
            }
            else {
                ui.notifications.error(ui_message + " [See web console for more information]");
            }
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
    getType: type =>
      ['string', 'number', 'array', 'object', 'boolean'].includes(type)
        ? (type === 'integer' ? 'number' : type)
        : typeof type,
    isSchema: object => utils.getType(object.type) !== 'undefined',
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
        const item = json[key];
        let curKey = key;
        // Check for required property
        if (key[0] === '*') {
          curKey = key.slice(1);
          required.push(curKey);
        }
        // Initialize property object to avoid passing undefined to Object.assign.
        properties[curKey] = {};
        utils.parse(item, properties[curKey]);
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
      // Merge the provided JSON schema
      Object.assign(schema, json);
      if (!utils.getType(json.type)) return;
      switch (json.type) {
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

