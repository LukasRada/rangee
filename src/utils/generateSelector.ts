import { HtmlElementSelectorResult } from '../types/HtmlElementSelectorResult';

const childNodeIndexOf = (parentNode: Node, childNode: Node) => {
    const childNodes = Array.from(parentNode.childNodes);
    let result = 0;
    for (let i = 0; i < childNodes.length; i++) {
        if (childNodes[i] === childNode) {
            result = i;
            break;
        }
    }
    return result;
};

const computedNthIndex = (childElement: HTMLElement) => {
    let elementsWithSameTag = 0;

    const parent = childElement.parentElement;

    if (parent) {
        for (let i = 0, l = parent.childNodes.length; i < l; i++) {
            const currentHtmlElement = parent.childNodes[i] as HTMLElement;
            if (currentHtmlElement === childElement) {
                elementsWithSameTag++;
                break;
            }
            if (currentHtmlElement.tagName === childElement.tagName) {
                elementsWithSameTag++;
            }
        }
    }
    return elementsWithSameTag;
};

export const generateSelector = (node: Node, relativeTo: Node): HtmlElementSelectorResult => {
    let currentNode: HTMLElement | null = node as HTMLElement;
    const tagNames: string[] = [];
    let textNodeIndex = 0;
    if (node.parentNode) {
        textNodeIndex = childNodeIndexOf(node.parentNode, node);

        while (currentNode) {
            const tagName = currentNode.tagName;

            if (tagName) {
                const nthIndex = computedNthIndex(currentNode);
                let selector = tagName;

                if (nthIndex > 1) {
                    selector += `:nth-of-type(${nthIndex})`;
                }

                tagNames.push(selector);
            }

            currentNode = currentNode.parentElement;

            if (currentNode === relativeTo.parentElement) {
                break;
            }
        }
    }
    return {
        s: tagNames.reverse().join('>').toLowerCase(),
        c: textNodeIndex,
        o: 0,
    };
};
