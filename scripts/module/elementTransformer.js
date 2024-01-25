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
