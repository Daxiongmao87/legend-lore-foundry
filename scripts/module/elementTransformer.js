export class ElementHandler {
    static htmlToJson(element) {
        let json = {
            tagName: element.tagName.toLowerCase()
        };
    
        let children = [];
        for (let node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim().length > 0) {
                // Include text nodes as distinct children
                children.push({ type: 'text', content: node.nodeValue.trim() });
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
        const element = document.createElement(jsonObject.tagName);
        
        if (jsonObject.children) {
            for (let childJson of jsonObject.children) {
                if (childJson.type === 'text') {
                    // Create text node for text type children
                    let textNode = document.createTextNode(childJson.content);
                    element.appendChild(textNode);
                } else {
                    // Recursively process nested elements
                    let childElement = ElementHandler.jsonToHtml(childJson);
                    element.appendChild(childElement);
                }
            }
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
