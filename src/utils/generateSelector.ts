import { HtmlElementSelectorResult } from '../types/HtmlElementSelectorResult';

const childNodeIndexOf = (parentNode: Node, childNode: Node): number => Array.prototype.indexOf.call(parentNode.childNodes, childNode);

const computedNthIndex = (childElement: HTMLElement): number => {
    let elementsWithSameTag = 0;

    const parent = childElement.parentElement;

    if (parent) {
        // eslint-disable-next-line no-restricted-syntax
        for (const currentChild of parent.children) {
            if (currentChild.tagName === childElement.tagName) {
                elementsWithSameTag++;
            }
            if (currentChild === childElement) {
                break;
            }
        }
    }

    return elementsWithSameTag;
};

export const generateSelector = (node: Node, relativeTo: Node): HtmlElementSelectorResult => {
    const tagNames: string[] = [];
    let currentNode: HTMLElement | null = node as HTMLElement;
    const textNodeIndex = node.parentNode ? childNodeIndexOf(node.parentNode, node) : 0;

    while (currentNode && currentNode !== relativeTo.parentElement) {
        const tagName = currentNode.tagName?.toLowerCase();
        if (tagName) {
            const nthIndex = computedNthIndex(currentNode);
            tagNames.push(nthIndex > 1 ? `${tagName}:nth-of-type(${nthIndex})` : tagName);
        }
        currentNode = currentNode.parentElement;
    }

    return {
        s: tagNames.reverse().join('>'),
        c: textNodeIndex,
        o: 0,
    };
};
