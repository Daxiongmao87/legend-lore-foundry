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
