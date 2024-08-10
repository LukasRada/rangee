import { HtmlElementSelectorResult } from '../types/HtmlElementSelectorResult';

export const findNodeBySelector = (result: HtmlElementSelectorResult, document: Document): Node => {
    const element = document.querySelector(result.s);

    if (!element) {
        // TODO: Create RangeeError and throw here
        throw new Error(`Unable to find element with selector: ${result.s}`);
    }
    if (result.c !== undefined && result.c !== null) {
        return element.childNodes[result.c];
    }
    return element;
};
