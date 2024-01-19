export class ElementHandler {
    static htmlToJson(element) {
        // Convert an HTML element to a JSON representation
        let json = {
            tagName: element.tagName.toLowerCase(),
            //attributes: ElementHandler.getElementAttributes(element),
            content: '' // Initialize content as empty string
        };

        let children = [];
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Append text content from text nodes only
                json.content += node.nodeValue.trim();
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Recursively process child elements
                children.push(ElementHandler.htmlToJson(node));
            }
        }
        
        if (children.length > 0) {
            json.children = children;
        }
        return json;
    }

    static jsonToHtml(jsonObject) {
        // Create an HTML element from a JSON object
        const element = document.createElement(jsonObject.tagName);
        //ElementHandler.setElementAttributes(element, jsonObject.attributes);
        if (jsonObject.children) {
            for (let childJson of jsonObject.children) {
                let childElement = ElementHandler.jsonToHtml(childJson);
                element.appendChild(childElement);
            }
        } else {
            element.textContent = jsonObject.content || '';
        }
        return element;
    }

    static getElementAttributes(element) {
        let attributes = {};
        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }

    static setElementAttributes(element, attributes) {
        for (let attrName in attributes) {
            element.setAttribute(attrName, attributes[attrName]);
        }
    }
}
